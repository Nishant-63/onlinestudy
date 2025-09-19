#!/bin/bash

# OnlineStudy Startup Script

echo "🚀 Starting OnlineStudy Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file from template..."
    cp backend/env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration before continuing."
    echo "   Required: Database credentials, S3 credentials, JWT secrets"
    read -p "Press Enter to continue after updating .env file..."
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    
    # Run database migrations
    echo "🗄️  Running database migrations..."
    docker-compose exec backend npm run migrate
    
    # Seed database with sample data
    echo "🌱 Seeding database with sample data..."
    docker-compose exec backend npm run seed
    
    echo ""
    echo "🎉 OnlineStudy is ready!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "🗄️  MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
    echo ""
    echo "👤 Sample accounts:"
    echo "   Teacher: teacher@onlinestudy.com / teacher123"
    echo "   Student: student1@onlinestudy.com / student123"
    echo ""
    echo "🛑 To stop services: docker-compose down"
    echo "📊 To view logs: docker-compose logs -f"
    
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
