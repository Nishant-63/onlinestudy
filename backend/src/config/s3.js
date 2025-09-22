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
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  };

  if (mockMode) {
    console.log(`🔧 Mock S3: Generated upload URL for ${key}`);
  }

  return s3.getSignedUrl('putObject', params);
};

// Generate signed URL for multipart upload
const generateMultipartUpload = (key, contentType) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  };

  if (mockMode) {
    console.log(`🔧 Mock S3: Generated multipart upload for ${key}`);
  }

  return s3.createMultipartUpload(params).promise();
};

// Generate signed URL for part upload
const generateSignedPartUrl = (key, uploadId, partNumber, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('uploadPart', params);
};

// Complete multipart upload
const completeMultipartUpload = (key, uploadId, parts) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  };

  if (mockMode) {
    console.log(`🔧 Mock S3: Completed multipart upload for ${key}`);
  }

  return s3.completeMultipartUpload(params).promise();
};

// Generate signed URL for download/view
const generateSignedDownloadUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: expiresIn,
  };

  if (mockMode) {
    console.log(`🔧 Mock S3: Generated download URL for ${key}`);
  }

  return s3.getSignedUrl('getObject', params);
};

// Delete object from S3
const deleteObject = (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
  };

  return s3.deleteObject(params).promise();
};

// Check if object exists
const objectExists = async (key) => {
  try {
    await s3.headObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
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
