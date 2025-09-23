#!/bin/bash

# ClassCast Platform - Quick Test Setup Script
# This script helps testers quickly set up the development environment

echo "🚀 ClassCast Platform - Test Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# ClassCast Platform - Development Environment
# This file contains environment variables for local development

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# AWS Configuration (Optional - app works with mock data)
# Uncomment and fill in your AWS credentials for full functionality
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# COGNITO_USER_POOL_ID=your_user_pool_id
# COGNITO_CLIENT_ID=your_client_id
# S3_BUCKET_NAME=your_bucket_name
# DYNAMODB_TABLE_PREFIX=classcast
EOF
    echo "✅ .env.local file created"
else
    echo "✅ .env.local file already exists"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "⚠️  Type check failed, but continuing..."
else
    echo "✅ Type check passed"
fi

echo ""
echo "🎉 Setup complete! You can now run the application:"
echo ""
echo "   npm run dev          # Start development server on port 3000"
echo "   npm run dev:test     # Start development server on port 3001"
echo ""
echo "   The application will be available at:"
echo "   - http://localhost:3000 (main)"
echo "   - http://localhost:3001 (test port)"
echo ""
echo "📚 For more information, see DEVELOPMENT.md"
echo ""
echo "Happy testing! 🚀"
