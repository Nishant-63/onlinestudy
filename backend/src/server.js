require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const videoRoutes = require('./routes/videos');
const assignmentRoutes = require('./routes/assignments');
const attendanceRoutes = require('./routes/attendance');
const remarkRoutes = require('./routes/remarks');
const setupRoutes = require('./routes/setup');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Request logging (skip in test to avoid noise)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(isProduction ? 'combined' : 'dev'));
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: isProduction
    ? [process.env.CORS_ORIGIN || 'https://onlinestudy-frontend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting on auth routes only (login/register brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Production health check: server + database connectivity
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      status: 'ok',
      database: 'connected'
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'error',
      database: 'disconnected',
      message: process.env.NODE_ENV === 'production' ? 'Service unavailable' : err.message
    });
  }
});

// API routes (auth protected by rate limiter)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/remarks', remarkRoutes);
app.use('/api/setup', setupRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (!isProduction) {
    console.error(err.stack);
  } else {
    console.error('[Error]', err.message || err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }

  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : (err.message || 'Internal server error')
  });
});

// 404 handler (must be after routes)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  if (isProduction) process.exit(1);
});

// Graceful shutdown
let server;
function shutdown(signal) {
  const msg = `Received ${signal}, shutting down gracefully...`;
  if (!isProduction) console.log(msg);
  if (server) {
    server.close(() => {
      pool.end().then(() => {
        process.exit(0);
      }).catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 10000);
  } else {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server only when run directly (not when required by tests)
async function start() {
  try {
    await pool.query('SELECT 1');
    if (process.env.NODE_ENV !== 'test') {
      console.log('Database connection OK');
    }
  } catch (err) {
    console.error('[FATAL] Database connection failed:', err.message);
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    }
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[FATAL] Startup failed:', err);
    process.exit(1);
  });
}

module.exports = app;
