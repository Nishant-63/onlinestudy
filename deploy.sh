#!/bin/bash

# OnlineStudy Deployment Script for Render
echo "🚀 Starting OnlineStudy deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Follow the RENDER_DEPLOYMENT.md guide"
echo "3. Set up your services in Render dashboard"
echo "4. Configure environment variables"
echo "5. Deploy and test!"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"

