const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { 
  generateUploadUrl,
  uploadFile,
  deleteFile,
  generateThumbnail,
  generateHLS
} = require('../config/cloudinary');
const { videoQueue, JOB_TYPES } = require('../config/redis');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validateVideoUpload, validateUUID, validatePagination } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Video routes are working!', timestamp: new Date().toISOString() });
});

// Configure multer for file uploads in development
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use the file key from the request body if available
    const fileKey = req.body.fileKey || file.originalname;
    cb(null, fileKey);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 10737418240 // 10GB default
  }
});

// Simple file upload endpoint for development mode
router.post('/upload-file', upload.single('video'), (req, res) => {
  try {
    console.log('📁 File upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    console.log('✅ File uploaded successfully:', fileUrl);
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Generate signed URL for video upload (teacher only)
router.post('/upload-url', authenticateToken, requireTeacher, validateVideoUpload, async (req, res) => {
  try {
    const { title, description, classId } = req.body;
    const { id: teacherId } = req.user;

    // Verify class exists and belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Generate unique file key
    const fileExtension = 'mp4'; // Assuming MP4 for now
    const fileKey = `videos/${teacherId}/${uuidv4()}.${fileExtension}`;

    // Generate multipart upload
    const multipartUpload = await generateMultipartUpload(fileKey, 'video/mp4');

    // Create video record in database
    const videoId = uuidv4();
    await pool.query(
      `INSERT INTO videos (id, title, description, file_key, file_size, class_id, teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [videoId, title, description, fileKey, 0, classId, teacherId]
    );

    res.json({
      videoId,
      uploadId: multipartUpload.UploadId,
      fileKey,
      message: 'Upload URL generated successfully'
    });

  } catch (error) {
    console.error('Generate upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Generate signed URL for part upload
router.post('/upload-part-url', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { videoId, uploadId, partNumber } = req.body;

    // Get video info
    const videoResult = await pool.query(
      'SELECT file_key, teacher_id FROM videos WHERE id = $1',
      [videoId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoResult.rows[0];

    // Verify teacher owns this video
    if (video.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const signedUrl = generateSignedPartUrl(video.file_key, uploadId, partNumber);

    res.json({ signedUrl });

  } catch (error) {
    console.error('Generate part URL error:', error);
    res.status(500).json({ error: 'Failed to generate part URL' });
  }
});

// Complete upload and trigger processing
router.post('/complete-upload', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { videoId, uploadId, parts, fileSize, fileUrl } = req.body;

    // Get video info
    const videoResult = await pool.query(
      'SELECT file_key, teacher_id FROM videos WHERE id = $1',
      [videoId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoResult.rows[0];

    // Verify teacher owns this video
    if (video.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For development mode, we don't need to complete multipart upload
    if (uploadId && parts) {
      await completeMultipartUpload(video.file_key, uploadId, parts);
    }

    // Update video record with file size
    const finalFileSize = fileSize || 0;
    await pool.query(
      'UPDATE videos SET file_size = $1 WHERE id = $2',
      [finalFileSize, videoId]
    );

    // Add video processing jobs to queue (only if not in development mode)
    if (process.env.NODE_ENV !== 'development') {
      await videoQueue.add(JOB_TYPES.GENERATE_HLS, {
        videoId,
        fileKey: video.file_key
      });

      await videoQueue.add(JOB_TYPES.GENERATE_THUMBNAIL, {
        videoId,
        fileKey: video.file_key
      });
    }

    res.json({
      message: 'Upload completed successfully. Video processing started.',
      videoId
    });

  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

// Get videos for a class (students and teachers)
router.get('/class/:classId', authenticateToken, validateUUID('classId'), validatePagination, async (req, res) => {
  try {
    const { classId } = req.params;
    const { id: userId, role } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user has access to this class
    let accessQuery;
    if (role === 'teacher') {
      accessQuery = 'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2';
    } else {
      accessQuery = `
        SELECT c.id FROM classes c
        JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE c.id = $1 AND ce.student_id = $2
      `;
    }

    const accessResult = await pool.query(accessQuery, [classId, userId]);

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    // Get videos
    const result = await pool.query(
      `SELECT v.id, v.title, v.description, v.file_size, v.duration, 
              v.thumbnail_key, v.hls_key, v.created_at,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM videos v
       JOIN users u ON v.teacher_id = u.id
       WHERE v.class_id = $1
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM videos WHERE class_id = $1',
      [classId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      videos: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get class videos error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

// Get video details and signed URL for playback
router.get('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Get video details
    const videoResult = await pool.query(
      `SELECT v.*, c.name as class_name, u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name
       FROM videos v
       JOIN classes c ON v.class_id = c.id
       JOIN users u ON v.teacher_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoResult.rows[0];

    // Check access permissions
    if (role === 'teacher') {
      if (video.teacher_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // Check if student is enrolled in the class
      const enrollmentResult = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
        [video.class_id, userId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Generate signed URLs
    const videoUrl = video.hls_key 
      ? generateSignedDownloadUrl(video.hls_key, 3600) // 1 hour
      : generateSignedDownloadUrl(video.file_key, 3600);

    const thumbnailUrl = video.thumbnail_key 
      ? generateSignedDownloadUrl(video.thumbnail_key, 3600)
      : null;

    res.json({
      video: {
        ...video,
        videoUrl,
        thumbnailUrl
      }
    });

  } catch (error) {
    console.error('Get video details error:', error);
    res.status(500).json({ error: 'Failed to get video details' });
  }
});

// Track video view (students only)
router.post('/:id/view', authenticateToken, requireStudent, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;
    const { action, progress, duration } = req.body; // action: 'start', 'pause', 'seek', 'complete'

    // Verify video exists and student has access
    const videoResult = await pool.query(
      `SELECT v.id, v.class_id FROM videos v
       JOIN class_enrollments ce ON v.class_id = ce.class_id
       WHERE v.id = $1 AND ce.student_id = $2`,
      [id, userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    const video = videoResult.rows[0];

    // Update or create video view record
    const now = new Date();
    const completionPercentage = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;
    const isCompleted = completionPercentage >= 90; // Consider 90%+ as completed

    await pool.query(
      `INSERT INTO video_views (video_id, student_id, first_watched_at, last_watched_at, 
                               watch_duration, completion_percentage, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (video_id, student_id)
       DO UPDATE SET
         last_watched_at = $3,
         watch_duration = video_views.watch_duration + $5,
         completion_percentage = GREATEST(video_views.completion_percentage, $6),
         is_completed = $7`,
      [id, userId, now, now, progress || 0, completionPercentage, isCompleted]
    );

    res.json({ message: 'View tracked successfully' });

  } catch (error) {
    console.error('Track video view error:', error);
    res.status(500).json({ error: 'Failed to track video view' });
  }
});

// Get video view statistics (teacher only)
router.get('/:id/views', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    // Verify video exists and belongs to teacher
    const videoResult = await pool.query(
      'SELECT id, title FROM videos WHERE id = $1 AND teacher_id = $2',
      [id, userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    // Get view statistics
    const viewsResult = await pool.query(
      `SELECT vv.*, u.first_name, u.last_name, u.email
       FROM video_views vv
       JOIN users u ON vv.student_id = u.id
       WHERE vv.video_id = $1
       ORDER BY vv.first_watched_at DESC`,
      [id]
    );

    res.json({
      video: videoResult.rows[0],
      views: viewsResult.rows
    });

  } catch (error) {
    console.error('Get video views error:', error);
    res.status(500).json({ error: 'Failed to get video views' });
  }
});

// Delete video (teacher only)
router.delete('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    // Get video details
    const videoResult = await pool.query(
      'SELECT file_key, thumbnail_key, hls_key FROM videos WHERE id = $1 AND teacher_id = $2',
      [id, userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    const video = videoResult.rows[0];

    // Delete from S3 (files will be deleted in background)
    const { deleteObject } = require('../config/s3');
    
    if (video.file_key) {
      await deleteObject(video.file_key).catch(console.error);
    }
    if (video.thumbnail_key) {
      await deleteObject(video.thumbnail_key).catch(console.error);
    }
    if (video.hls_key) {
      await deleteObject(video.hls_key).catch(console.error);
    }

    // Delete from database (cascade will handle related records)
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
