#!/bin/bash

# Setup Video Interactions - Complete Setup Script
# This script deploys the infrastructure and populates sample data

set -e

echo "🚀 Setting up Video Interactions for ClassCast Platform"
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ Error: AWS CDK is not installed. Please install it first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to CDK directory
echo "📁 Navigating to CDK directory..."
cd cdk

# Install CDK dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Deploy the database stack
echo "🏗️  Deploying database stack with video tables..."
cdk deploy DatabaseStack --require-approval never

# Go back to project root
cd ..

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Wait a moment for tables to be fully created
echo "⏳ Waiting for DynamoDB tables to be ready..."
sleep 10

# Populate sample data
echo "📊 Populating sample video data..."
node scripts/populate-video-data.js

echo "📊 Populating sample video interactions..."
node scripts/populate-video-interactions.js

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎬 Video Interactions are now ready!"
echo ""
echo "📋 What's been set up:"
echo "  • DynamoDB tables for videos and interactions"
echo "  • Sample video content (5 videos)"
echo "  • Sample user data (5 students)"
echo "  • Sample interactions (likes, comments, ratings)"
echo ""
echo "🚀 Next steps:"
echo "  1. Start your Next.js development server: npm run dev"
echo "  2. Navigate to the student dashboard"
echo "  3. Test the video interaction features:"
echo "     - Like/unlike videos"
echo "     - Add comments"
echo "     - Rate content creators"
echo "     - View real-time stats"
echo ""
echo "🔧 API Endpoints available:"
echo "  • GET /api/videos - List all videos"
echo "  • POST /api/videos - Create new video"
echo "  • GET /api/videos/[videoId]/interactions - Get video interactions"
echo "  • POST /api/videos/[videoId]/interactions - Create interaction"
echo "  • DELETE /api/videos/[videoId]/interactions - Remove interaction"
echo ""
echo "Happy coding! 🎉"
