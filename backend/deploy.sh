#!/bin/bash

# ============================================================================
# CLASSCAST BACKEND DEPLOYMENT SCRIPT
# ============================================================================

set -e

echo "🚀 Starting ClassCast Backend Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd infrastructure
npm install
cd ..

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
cd infrastructure
cdk deploy --require-approval never
cd ..

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your frontend environment variables with the new API endpoints"
echo "2. Test the authentication flow"
echo "3. Create your first course"
echo ""
echo "🔗 API Gateway URL: Check the CDK outputs above"
echo "🔗 Cognito User Pool: Check the CDK outputs above"
