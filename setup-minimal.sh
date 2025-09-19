#!/bin/bash

# OnlineStudy Minimal Setup Script (for testing without external dependencies)

echo "🚀 Setting up OnlineStudy Platform (Minimal Setup)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create minimal .env file for testing
echo "📝 Creating minimal environment file..."
cat > .env << EOF
# Database Configuration (using SQLite for testing)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onlinestudy_test
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=test-jwt-secret-key-for-development
JWT_REFRESH_SECRET=test-refresh-secret-key-for-development
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# S3 Configuration (using local file system for testing)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=onlinestudy-files
S3_ACCESS_KEY_ID=test-access-key
S3_SECRET_ACCESS_KEY=test-secret-key
S3_REGION=us-east-1

# Redis Configuration (optional for testing)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Limits
MAX_VIDEO_SIZE=21474836480
MAX_PDF_SIZE=524288000
MAX_STUDENT_PDF_SIZE=524288000

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
HLS_SEGMENT_DURATION=10
EOF

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Create frontend .env file
echo "📝 Creating frontend environment file..."
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF

cd ..

echo ""
echo "🎉 Minimal setup complete!"
echo ""
echo "⚠️  Note: This setup uses minimal configuration for testing."
echo "   For production, you'll need:"
echo "   - PostgreSQL database"
echo "   - Redis server"
echo "   - S3-compatible storage"
echo ""
echo "To start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
