const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Check if we're in development mode or missing Cloudinary credentials
const isDevelopment = process.env.NODE_ENV === 'development' && 
  (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your-cloud-name');

let cloudinaryConfig;
let mockMode = false;

if (isDevelopment) {
  console.log('🔧 Running in development mode with mock Cloudinary configuration');
  mockMode = true;
  
  // Mock Cloudinary for development
  cloudinaryConfig = {
    upload: async (file, options = {}) => {
      console.log(`🔧 Mock Cloudinary: Uploading file ${file}`);
      return {
        public_id: `mock-${Date.now()}`,
        secure_url: `http://localhost:3001/uploads/${file}`,
        url: `http://localhost:3001/uploads/${file}`,
        format: 'mp4',
        resource_type: 'video',
        bytes: 1024000,
        width: 1920,
        height: 1080
      };
    },
    uploader: {
      upload: async (file, options = {}) => {
        console.log(`🔧 Mock Cloudinary: Uploading file ${file}`);
        return {
          public_id: `mock-${Date.now()}`,
          secure_url: `http://localhost:3001/uploads/${file}`,
          url: `http://localhost:3001/uploads/${file}`,
          format: 'mp4',
          resource_type: 'video',
          bytes: 1024000,
          width: 1920,
          height: 1080
        };
      },
      destroy: async (publicId) => {
        console.log(`🔧 Mock Cloudinary: Deleting file ${publicId}`);
        return { result: 'ok' };
      },
      generateArchive: async (options = {}) => {
        console.log(`🔧 Mock Cloudinary: Generating archive`);
        return { secure_url: 'http://localhost:3001/archive.zip' };
      }
    }
  };
} else {
  console.log('🔧 Configuring Cloudinary...');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  cloudinaryConfig = cloudinary;
}

// Generate upload URL for direct uploads
const generateUploadUrl = (folder = 'onlinestudy') => {
  if (mockMode) {
    return Promise.resolve({
      upload_url: 'http://localhost:3001/upload',
      public_id: `mock-${Date.now()}`
    });
  }
  
  return cloudinary.utils.api_sign_request(
    {
      timestamp: Math.round((new Date).getTime() / 1000),
      folder: folder,
      resource_type: 'video'
    },
    process.env.CLOUDINARY_API_SECRET
  );
};

// Upload file to Cloudinary
const uploadFile = async (file, options = {}) => {
  if (mockMode) {
    console.log(`🔧 Mock Cloudinary: Uploading file ${file}`);
    return {
      public_id: `mock-${Date.now()}`,
      secure_url: `http://localhost:3001/uploads/${file}`,
      url: `http://localhost:3001/uploads/${file}`,
      format: 'mp4',
      resource_type: 'video',
      bytes: 1024000,
      width: 1920,
      height: 1080
    };
  }
  
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
      folder: 'onlinestudy',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  if (mockMode) {
    console.log(`🔧 Mock Cloudinary: Deleting file ${publicId}`);
    return { result: 'ok' };
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Generate video thumbnail
const generateThumbnail = async (publicId, options = {}) => {
  if (mockMode) {
    console.log(`🔧 Mock Cloudinary: Generating thumbnail for ${publicId}`);
    return {
      public_id: `mock-thumb-${Date.now()}`,
      secure_url: `http://localhost:3001/thumbnails/${publicId}.jpg`,
      url: `http://localhost:3001/thumbnails/${publicId}.jpg`
    };
  }
  
  try {
    const result = await cloudinary.uploader.upload(
      `video/${publicId}`,
      {
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
          { quality: 'auto' }
        ],
        ...options
      }
    );
    return result;
  } catch (error) {
    console.error('Cloudinary thumbnail error:', error);
    throw error;
  }
};

// Generate HLS streaming URL
const generateHLS = async (publicId) => {
  if (mockMode) {
    console.log(`🔧 Mock Cloudinary: Generating HLS for ${publicId}`);
    return `http://localhost:3001/hls/${publicId}.m3u8`;
  }
  
  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      resource_type: 'video',
      type: 'upload',
      eager: [
        {
          format: 'm3u8',
          streaming_profile: 'hd'
        }
      ]
    });
    
    return result.eager[0].secure_url;
  } catch (error) {
    console.error('Cloudinary HLS error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary: cloudinaryConfig,
  generateUploadUrl,
  uploadFile,
  deleteFile,
  generateThumbnail,
  generateHLS,
};
