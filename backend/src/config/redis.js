const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();

// Check if we're in development mode without Redis
const isDevelopment = process.env.NODE_ENV === 'development';
let redisConnection;
let videoQueue;

if (isDevelopment) {
  console.log('🔧 Running in development mode with mock Redis configuration');
  
  // Mock Redis connection
  redisConnection = {
    ping: () => Promise.resolve('PONG'),
    quit: () => Promise.resolve(),
  };

  // Mock video queue
  videoQueue = {
    add: async (jobType, data) => {
      console.log(`🔧 Mock Redis: Added job ${jobType} with data:`, data);
      return Promise.resolve({ id: 'mock-job-id' });
    },
    close: () => Promise.resolve(),
  };
} else {
  // Real Redis connection
  redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
  });

  // Video processing queue
  videoQueue = new Queue('video processing', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

// Job types
const JOB_TYPES = {
  GENERATE_HLS: 'generate_hls',
  GENERATE_THUMBNAIL: 'generate_thumbnail',
  CLEANUP_TEMP_FILES: 'cleanup_temp_files',
};

module.exports = {
  redisConnection,
  videoQueue,
  JOB_TYPES,
};
