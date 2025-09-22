const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();

// Check if Redis is available
const hasRedisUrl = process.env.REDIS_URL && process.env.REDIS_URL !== '';
let redisConnection;
let videoQueue;

if (!hasRedisUrl) {
  console.log('🔧 Running without Redis - using mock configuration');
  
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
  console.log('🔧 Connecting to Redis...');
  
  // Real Redis connection
  redisConnection = new Redis(process.env.REDIS_URL, {
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
