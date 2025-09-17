#!/bin/bash

# Setup Bulk Student Enrollment - Complete Setup Script
# This script deploys the infrastructure and sets up email notifications

set -e

echo "🚀 Setting up Bulk Student Enrollment for ClassCast Platform"
echo "=========================================================="

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

# Deploy the database stack with new tables
echo "🏗️  Deploying database stack with enrollment tables..."
cdk deploy DatabaseStack --require-approval never

# Go back to project root
cd ..

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Wait a moment for tables to be fully created
echo "⏳ Waiting for DynamoDB tables to be ready..."
sleep 10

# Verify SES is set up for email notifications
echo "📧 Checking SES configuration..."
if ! aws ses describe-configuration-set --configuration-set-name "classcast-emails" 2>/dev/null; then
    echo "⚠️  SES configuration set not found. Creating basic setup..."
    
    # Create SES configuration set
    aws ses create-configuration-set --configuration-set '{
        "Name": "classcast-emails",
        "DeliveryOptions": {
            "TlsPolicy": "Optional"
        }
    }' 2>/dev/null || echo "Configuration set may already exist"
    
    # Verify sending domain (this will need to be done manually)
    echo "📝 IMPORTANT: You need to verify your sending domain in SES:"
    echo "   1. Go to AWS SES Console"
    echo "   2. Verify your domain or email address"
    echo "   3. Request production access if needed"
    echo "   4. Set up DKIM records for your domain"
fi

# Set up environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# AWS Configuration
AWS_REGION=us-east-1

# DynamoDB Tables
USERS_TABLE=classcast-users
COURSES_TABLE=classcast-courses
ENROLLMENTS_TABLE=classcast-enrollments
VIDEOS_TABLE=classcast-videos
VIDEO_INTERACTIONS_TABLE=classcast-video-interactions

# Cognito Configuration
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ Created .env.local file. Please update with your actual values."
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "✅ Bulk Enrollment setup completed!"
echo ""
echo "🎓 Bulk Student Enrollment is now ready!"
echo ""
echo "📋 What's been set up:"
echo "  • DynamoDB enrollments table with proper GSIs"
echo "  • Bulk enrollment API endpoints"
echo "  • Email notification system (SES)"
echo "  • Cognito integration for user creation"
echo "  • CSV and text input parsing"
echo "  • Instructor portal integration"
echo ""
echo "🚀 Next steps:"
echo "  1. Update .env.local with your actual AWS values"
echo "  2. Verify your domain in AWS SES"
echo "  3. Start your Next.js development server: npm run dev"
echo "  4. Navigate to the instructor portal"
echo "  5. Click 'Add Students' on any published course"
echo ""
echo "📧 Email Setup Required:"
echo "  • Verify your sending domain in AWS SES Console"
echo "  • Request production access if sending to unverified emails"
echo "  • Update SES_FROM_EMAIL in .env.local"
echo ""
echo "🔧 API Endpoints available:"
echo "  • POST /api/courses/bulk-enroll - Bulk enroll students"
echo "  • GET /api/courses - List courses"
echo "  • GET /api/users - List users"
echo ""
echo "Happy teaching! 🎉"
