const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateSignedUploadUrl, generateSignedDownloadUrl } = require('../config/s3');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validateAssignmentUpload, validateUUID, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Upload assignment (teacher only)
router.post('/upload', authenticateToken, requireTeacher, validateAssignmentUpload, async (req, res) => {
  try {
    const { title, description, classId, dueDate } = req.body;
    const { id: teacherId } = req.user;

    // Check file size limit (50MB for assignments)
    const maxFileSize = 50 * 1024 * 1024; // 50MB in bytes

    // Verify class exists and belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Generate unique file key
    const fileKey = `assignments/${teacherId}/${uuidv4()}.pdf`;

    // Generate signed URL for upload
    const uploadUrl = generateSignedUploadUrl(fileKey, 'application/pdf', 3600);

    // Create assignment record
    const assignmentId = uuidv4();
    await pool.query(
      `INSERT INTO assignments (id, title, description, file_key, file_size, class_id, teacher_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [assignmentId, title, description, fileKey, 0, classId, teacherId, dueDate || null]
    );

    res.json({
      assignmentId,
      uploadUrl,
      fileKey,
      message: 'Assignment created successfully'
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Complete assignment upload (teacher only)
router.post('/:id/complete-upload', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { fileSize } = req.body;
    const { id: teacherId } = req.user;

    // Validate file size (50MB limit for assignments)
    const maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
    if (fileSize && fileSize > maxFileSize) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' });
    }

    // Verify assignment exists and belongs to teacher
    const assignmentResult = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    // Update assignment with file size
    await pool.query(
      'UPDATE assignments SET file_size = $1 WHERE id = $2',
      [fileSize, id]
    );

    res.json({ message: 'Assignment upload completed successfully' });

  } catch (error) {
    console.error('Complete assignment upload error:', error);
    res.status(500).json({ error: 'Failed to complete assignment upload' });
  }
});

// Get assignments for class (students and teachers)
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

    // Get assignments
    const result = await pool.query(
      `SELECT a.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM assignments a
       JOIN users u ON a.teacher_id = u.id
       WHERE a.class_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    // Add download URLs to assignments
    const assignmentsWithDownloadUrls = result.rows.map(assignment => ({
      ...assignment,
      downloadUrl: assignment.file_key ? generateSignedDownloadUrl(assignment.file_key, 3600) : null
    }));

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM assignments WHERE class_id = $1',
      [classId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      assignments: assignmentsWithDownloadUrls,
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
    console.error('Get class assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Get all assignments for student across all enrolled classes
router.get('/student', authenticateToken, requireStudent, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name, c.name as class_name,
              s.id as submission_id, s.submitted_at, s.grade, s.file_size as submission_file_size
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_enrollments ce ON c.id = ce.class_id
       JOIN users u ON a.teacher_id = u.id
       LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = $1
       WHERE ce.student_id = $1
       ORDER BY a.due_date ASC, a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE ce.student_id = $1`,
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Add download URLs to assignments
    const assignmentsWithDownloadUrls = result.rows.map(assignment => ({
      ...assignment,
      downloadUrl: assignment.file_key ? generateSignedDownloadUrl(assignment.file_key, 3600) : null
    }));

    res.json({
      assignments: assignmentsWithDownloadUrls,
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
    console.error('Get student assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Get student's assignment submissions (for students)
router.get('/student/submissions', authenticateToken, requireStudent, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.due_date, c.name as class_name
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM assignment_submissions WHERE student_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      submissions: result.rows,
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
    console.error('Get student submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get specific student's assignment submissions (for teachers)
router.get('/student/:studentId', authenticateToken, requireTeacher, validateUUID('studentId'), validatePagination, async (req, res) => {
  try {
    const { studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verify student exists
    const studentResult = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = \'student\'',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.due_date, c.name as class_name
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN classes c ON a.class_id = c.id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM assignment_submissions WHERE student_id = $1',
      [studentId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      submissions: result.rows,
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
    console.error('Get student submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get assignment details and download URL
router.get('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Get assignment details
    const assignmentResult = await pool.query(
      `SELECT a.*, c.name as class_name, u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN users u ON a.teacher_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    // Check access permissions
    if (role === 'teacher') {
      if (assignment.teacher_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // Check if student is enrolled in the class
      const enrollmentResult = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
        [assignment.class_id, userId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Generate download URL
    const downloadUrl = generateSignedDownloadUrl(assignment.file_key, 3600);

    res.json({
      assignment: {
        ...assignment,
        downloadUrl
      }
    });

  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ error: 'Failed to get assignment details' });
  }
});

// Submit assignment (student only)
router.post('/:id/submit', authenticateToken, requireStudent, validateUUID('id'), async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { fileSize } = req.body;
    const { id: studentId } = req.user;

    // Verify assignment exists and student has access
    const assignmentResult = await pool.query(
      `SELECT a.id, a.class_id FROM assignments a
       JOIN class_enrollments ce ON a.class_id = ce.class_id
       WHERE a.id = $1 AND ce.student_id = $2`,
      [assignmentId, studentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    // Generate unique file key for submission
    const fileKey = `submissions/${studentId}/${assignmentId}/${uuidv4()}.pdf`;

    // Generate signed URL for upload
    const uploadUrl = generateSignedUploadUrl(fileKey, 'application/pdf', 3600);

    // Create submission record
    const submissionId = uuidv4();
    await pool.query(
      `INSERT INTO assignment_submissions (id, assignment_id, student_id, file_key, file_size)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET file_key = $4, file_size = $5, submitted_at = CURRENT_TIMESTAMP`,
      [submissionId, assignmentId, studentId, fileKey, fileSize]
    );

    res.json({
      submissionId,
      uploadUrl,
      fileKey,
      message: 'Assignment submission created successfully'
    });

  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Complete assignment submission (student only)
router.post('/:id/complete-submission', authenticateToken, requireStudent, validateUUID('id'), async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { fileSize } = req.body;
    const { id: studentId } = req.user;

    // Update submission with file size
    const result = await pool.query(
      `UPDATE assignment_submissions 
       SET file_size = $1, submitted_at = CURRENT_TIMESTAMP
       WHERE assignment_id = $2 AND student_id = $3
       RETURNING id`,
      [fileSize, assignmentId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment submission not found' });
    }

    res.json({ message: 'Assignment submission completed successfully' });

  } catch (error) {
    console.error('Complete assignment submission error:', error);
    res.status(500).json({ error: 'Failed to complete assignment submission' });
  }
});

// Get assignment submissions (teacher only)
router.get('/:id/submissions', authenticateToken, requireTeacher, validateUUID('id'), validatePagination, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { id: teacherId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verify assignment belongs to teacher
    const assignmentResult = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
      [assignmentId, teacherId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    // Get submissions
    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.email
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [assignmentId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1',
      [assignmentId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      submissions: result.rows,
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
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Failed to get assignment submissions' });
  }
});

// Grade assignment submission (teacher only)
router.patch('/submissions/:submissionId/grade', authenticateToken, requireTeacher, validateUUID('submissionId'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const { id: teacherId } = req.user;

    // Verify submission exists and teacher has access
    const submissionResult = await pool.query(
      `SELECT s.id FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1 AND a.teacher_id = $2`,
      [submissionId, teacherId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    // Update grade and feedback
    const result = await pool.query(
      'UPDATE assignment_submissions SET grade = $1, feedback = $2 WHERE id = $3 RETURNING *',
      [grade, feedback, submissionId]
    );

    res.json({
      message: 'Grade updated successfully',
      submission: result.rows[0]
    });

  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ error: 'Failed to grade assignment' });
  }
});

// Delete assignment (teacher only)
router.delete('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: teacherId } = req.user;

    // Verify assignment belongs to teacher
    const assignmentResult = await pool.query(
      'SELECT file_key FROM assignments WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    const assignment = assignmentResult.rows[0];

    // Delete from S3 (file will be deleted in background)
    const { deleteObject } = require('../config/s3');
    await deleteObject(assignment.file_key).catch(console.error);

    // Delete from database (cascade will handle related records)
    await pool.query('DELETE FROM assignments WHERE id = $1', [id]);

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
