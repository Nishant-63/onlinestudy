const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { Worker } = require('bullmq');
const { redisConnection, JOB_TYPES } = require('../config/redis');
const { s3, generateSignedDownloadUrl } = require('../config/s3');
const pool = require('../config/database');

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, '../../temp');
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Video processing worker
const videoWorker = new Worker('video processing', async (job) => {
  const { type, videoId, fileKey } = job.data;

  try {
    switch (type) {
      case JOB_TYPES.GENERATE_HLS:
        return await generateHLS(videoId, fileKey);
      
      case JOB_TYPES.GENERATE_THUMBNAIL:
        return await generateThumbnail(videoId, fileKey);
      
      case JOB_TYPES.CLEANUP_TEMP_FILES:
        return await cleanupTempFiles();
      
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } catch (error) {
    console.error(`Video processing error for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2, // Process 2 videos concurrently
});

// Generate HLS (HTTP Live Streaming) from video
async function generateHLS(videoId, fileKey) {
  const tempInputPath = path.join(TEMP_DIR, `input_${videoId}.mp4`);
  const tempOutputDir = path.join(TEMP_DIR, `hls_${videoId}`);
  const hlsKey = `hls/${videoId}/playlist.m3u8`;

  try {
    // Create output directory
    await fs.mkdir(tempOutputDir, { recursive: true });

    // Download video from S3
    console.log(`Downloading video ${fileKey} for HLS generation...`);
    const videoStream = s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey
    }).createReadStream();

    const writeStream = require('fs').createWriteStream(tempInputPath);
    await new Promise((resolve, reject) => {
      videoStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Generate HLS
    console.log(`Generating HLS for video ${videoId}...`);
    await new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename', path.join(tempOutputDir, 'segment_%03d.ts'),
          '-f hls'
        ])
        .output(path.join(tempOutputDir, 'playlist.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Get video duration
    const duration = await getVideoDuration(tempInputPath);

    // Upload HLS files to S3
    console.log(`Uploading HLS files for video ${videoId}...`);
    const files = await fs.readdir(tempOutputDir);
    
    for (const file of files) {
      const filePath = path.join(tempOutputDir, file);
      const key = `hls/${videoId}/${file}`;
      
      await s3.upload({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: await fs.readFile(filePath),
        ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'
      }).promise();
    }

    // Update video record
    await pool.query(
      'UPDATE videos SET hls_key = $1, duration = $2 WHERE id = $3',
      [hlsKey, duration, videoId]
    );

    // Cleanup temp files
    await fs.unlink(tempInputPath).catch(console.error);
    await fs.rmdir(tempOutputDir, { recursive: true }).catch(console.error);

    console.log(`HLS generation completed for video ${videoId}`);
    return { success: true, hlsKey, duration };

  } catch (error) {
    console.error(`HLS generation failed for video ${videoId}:`, error);
    
    // Cleanup on error
    await fs.unlink(tempInputPath).catch(console.error);
    await fs.rmdir(tempOutputDir, { recursive: true }).catch(console.error);
    
    throw error;
  }
}

// Generate thumbnail from video
async function generateThumbnail(videoId, fileKey) {
  const tempInputPath = path.join(TEMP_DIR, `input_thumb_${videoId}.mp4`);
  const tempThumbPath = path.join(TEMP_DIR, `thumb_${videoId}.jpg`);
  const thumbnailKey = `thumbnails/${videoId}.jpg`;

  try {
    // Download video from S3
    console.log(`Downloading video ${fileKey} for thumbnail generation...`);
    const videoStream = s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey
    }).createReadStream();

    const writeStream = require('fs').createWriteStream(tempInputPath);
    await new Promise((resolve, reject) => {
      videoStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Generate thumbnail at 10% of video duration
    console.log(`Generating thumbnail for video ${videoId}...`);
    const duration = await getVideoDuration(tempInputPath);
    const seekTime = Math.max(1, Math.floor(duration * 0.1));

    await new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .seekInput(seekTime)
        .outputOptions([
          '-vframes 1',
          '-q:v 2',
          '-s 1280x720'
        ])
        .output(tempThumbPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Upload thumbnail to S3
    console.log(`Uploading thumbnail for video ${videoId}...`);
    await s3.upload({
      Bucket: process.env.S3_BUCKET,
      Key: thumbnailKey,
      Body: await fs.readFile(tempThumbPath),
      ContentType: 'image/jpeg'
    }).promise();

    // Update video record
    await pool.query(
      'UPDATE videos SET thumbnail_key = $1 WHERE id = $2',
      [thumbnailKey, videoId]
    );

    // Cleanup temp files
    await fs.unlink(tempInputPath).catch(console.error);
    await fs.unlink(tempThumbPath).catch(console.error);

    console.log(`Thumbnail generation completed for video ${videoId}`);
    return { success: true, thumbnailKey };

  } catch (error) {
    console.error(`Thumbnail generation failed for video ${videoId}:`, error);
    
    // Cleanup on error
    await fs.unlink(tempInputPath).catch(console.error);
    await fs.unlink(tempThumbPath).catch(console.error);
    
    throw error;
  }
}

// Get video duration using ffprobe
async function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(Math.floor(metadata.format.duration));
      }
    });
  });
}

// Cleanup temporary files
async function cleanupTempFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        if (stats.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
        } else {
          await fs.unlink(filePath);
        }
        console.log(`Cleaned up temp file: ${file}`);
      }
    }

    return { success: true, cleanedFiles: files.length };
  } catch (error) {
    console.error('Cleanup temp files error:', error);
    throw error;
  }
}

// Handle job completion
videoWorker.on('completed', (job) => {
  console.log(`Video processing job ${job.id} completed successfully`);
});

// Handle job failure
videoWorker.on('failed', (job, err) => {
  console.error(`Video processing job ${job.id} failed:`, err.message);
  
  // Update video job status in database
  if (job.data.videoId) {
    pool.query(
      'UPDATE video_jobs SET status = $1, error_message = $2, completed_at = CURRENT_TIMESTAMP WHERE video_id = $3',
      ['failed', err.message, job.data.videoId]
    ).catch(console.error);
  }
});

// Schedule cleanup job every 24 hours
setInterval(async () => {
  try {
    await videoWorker.add(JOB_TYPES.CLEANUP_TEMP_FILES, {});
  } catch (error) {
    console.error('Failed to schedule cleanup job:', error);
  }
}, 24 * 60 * 60 * 1000);

console.log('Video processing worker started');

module.exports = videoWorker;
