#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# OnlineStudy Manual Setup Script (without Docker)

echo "🚀 Setting up OnlineStudy Platform (Manual Installation)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 15+ first."
    echo "   Download from: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL detected"

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis is not installed. Please install Redis 7+ first."
    echo "   Install with: brew install redis (on macOS)"
    echo "   Or download from: https://redis.io/download"
    exit 1
fi

echo "✅ Redis detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating backend environment file..."
    cp env.example .env
    echo "⚠️  Please update backend/.env with your configuration:"
    echo "   - Database credentials"
    echo "   - JWT secrets"
    echo "   - S3 credentials (optional for testing)"
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Create frontend .env file
echo "📝 Creating frontend environment file..."
cat > .env << EOF
REACT_APP_API_URL=https://onlinestudy-backend-4u8y.onrender.com/api
EOF

cd ..

# Start Redis
echo "🔄 Starting Redis..."
redis-server --daemonize yes

# Start PostgreSQL (assuming it's already running)
echo "🔄 Checking PostgreSQL connection..."

# Run database setup
echo "🗄️  Setting up database..."
cd backend
npm run migrate
npm run seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "   Frontend: https://onlinestudy-frontend.onrender.com (deployed)"
echo "   Backend API: https://onlinestudy-backend-4u8y.onrender.com (deployed)"
echo "   Local Development: http://localhost:3000 (frontend) / http://localhost:5000 (backend)"
echo ""
echo "Sample accounts:"
echo "   Teacher: teacher@onlinestudy.com / teacher123"
echo "   Student: student1@onlinestudy.com / student123"
