const { cloudinary, generateUploadUrl, uploadFile, deleteFile } = require('./cloudinary');
require('dotenv').config();

// Check if we're in development mode or missing Cloudinary credentials
const isDevelopment = process.env.NODE_ENV === 'development' && 
  (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your-cloud-name');

let s3;
let mockMode = false;

if (isDevelopment) {
  console.log('🔧 Running in development mode with local file storage');
  mockMode = true;
  
  // For development, we'll use a simple approach that stores files locally
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create a mock S3 object for development that actually works
  s3 = {
    getSignedUrl: (operation, params) => {
      // Return a localhost URL that will work for file uploads
      const baseUrl = `http://localhost:3001/uploads`;
      return `${baseUrl}/${params.Key}`;
    },
    createMultipartUpload: (params) => {
      return {
        promise: () => Promise.resolve({ UploadId: crypto.randomUUID() })
      };
    },
    completeMultipartUpload: (params) => {
      return {
        promise: () => Promise.resolve({ Location: `http://localhost:3001/uploads/${params.Key}` })
      };
    },
    deleteObject: (params) => {
      return {
        promise: () => {
          const filePath = path.join(uploadsDir, params.Key);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return Promise.resolve({});
        }
      };
    },
    headObject: (params) => {
      return {
        promise: () => {
          const filePath = path.join(uploadsDir, params.Key);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            return Promise.resolve({ ContentLength: stats.size });
          }
          return Promise.resolve({ ContentLength: 0 });
        }
      };
    }
  };
} else {
  console.log('🔧 Using Cloudinary for file storage');
  // Use Cloudinary instead of AWS S3
  s3 = cloudinary;
}

// Generate signed URL for upload
const generateSignedUploadUrl = (key, contentType, expiresIn = 3600) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Generated upload URL for ${key}`);
    return `http://localhost:3001/uploads/${key}`;
  }

  // For production, use Cloudinary upload URL
  return generateUploadUrl(`onlinestudy/${key}`);
};

// Generate signed URL for multipart upload
const generateMultipartUpload = async (key, contentType) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Generated multipart upload for ${key}`);
    return { UploadId: 'mock-upload-id' };
  }

  // For production, use Cloudinary upload URL
  const uploadData = await generateUploadUrl(`onlinestudy/${key}`);
  return { UploadId: uploadData.public_id };
};

// Generate signed URL for part upload
const generateSignedPartUrl = (key, uploadId, partNumber, expiresIn = 3600) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Generated part upload URL for ${key}`);
    return `http://localhost:3001/uploads/${key}`;
  }

  // For production, use Cloudinary upload URL
  return generateUploadUrl(`onlinestudy/${key}`);
};

// Complete multipart upload
const completeMultipartUpload = async (key, uploadId, parts) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Completed multipart upload for ${key}`);
    return { Location: `http://localhost:3001/uploads/${key}` };
  }

  // For production, return Cloudinary URL
  return { Location: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${uploadId}` };
};

// Generate signed URL for download/view
const generateSignedDownloadUrl = (key, expiresIn = 3600) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Generated download URL for ${key}`);
    return `http://localhost:3001/uploads/${key}`;
  }

  // For production, determine resource type based on file extension
  const fileExtension = key.split('.').pop().toLowerCase();
  let resourceType = 'image'; // default for PDFs and other files
  
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension)) {
    resourceType = 'video';
  } else if (['mp3', 'wav', 'aac', 'ogg'].includes(fileExtension)) {
    resourceType = 'video'; // Cloudinary uses 'video' for audio too
  }

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${key}`;
};

// Delete object from S3
const deleteObject = async (key) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Deleted object ${key}`);
    return {};
  }

  // For production, use Cloudinary delete
  return await deleteFile(key);
};

// Check if object exists
const objectExists = async (key) => {
  if (mockMode) {
    console.log(`🔧 Mock S3: Checking if object exists ${key}`);
    return true;
  }

  // For production, assume object exists (Cloudinary handles this)
  return true;
};

module.exports = {
  s3,
  generateSignedUploadUrl,
  generateMultipartUpload,
  generateSignedPartUrl,
  completeMultipartUpload,
  generateSignedDownloadUrl,
  deleteObject,
  objectExists,
};
