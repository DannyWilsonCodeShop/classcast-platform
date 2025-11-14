#!/bin/bash

# Deploy Video Interactions to Production
echo "🚀 Deploying Video Interactions to Production..."

# Set environment variables
export AWS_REGION=${AWS_REGION:-us-east-1}
export ENVIRONMENT=production

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy CDK stacks
echo "☁️ Deploying AWS infrastructure..."
cd cdk

# Deploy video interactions stack
echo "📹 Deploying video interactions stack..."
npx cdk deploy DemoProject-VideoInteractionsStack --require-approval never

# Get stack outputs
echo "📋 Getting stack outputs..."
VIDEOS_TABLE=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`VideosTableName`].OutputValue' --output text)
COMMENTS_TABLE=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`CommentsTableName`].OutputValue' --output text)
RESPONSES_TABLE=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`ResponsesTableName`].OutputValue' --output text)
SHARES_TABLE=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`SharesTableName`].OutputValue' --output text)
VIDEO_BUCKET=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`VideoBucketName`].OutputValue' --output text)
NOTIFICATIONS_TOPIC=$(aws cloudformation describe-stacks --stack-name DemoProject-VideoInteractionsStack --query 'Stacks[0].Outputs[?OutputKey==`NotificationsTopicArn`].OutputValue' --output text)

cd ..

# Update environment variables
echo "🔧 Updating environment variables..."
cat > .env.local << EOF
# Video Interactions Configuration
VIDEOS_TABLE_NAME=${VIDEOS_TABLE}
COMMENTS_TABLE_NAME=${COMMENTS_TABLE}
RESPONSES_TABLE_NAME=${RESPONSES_TABLE}
SHARES_TABLE_NAME=${SHARES_TABLE}
VIDEO_BUCKET_NAME=${VIDEO_BUCKET}
SNS_TOPIC_ARN=${NOTIFICATIONS_TOPIC}
AWS_REGION=${AWS_REGION}
EOF

# Deploy to Vercel (if using Vercel)
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
fi

# Deploy to AWS (if using other deployment method)
if [ "$DEPLOY_METHOD" = "aws" ]; then
    echo "🚀 Deploying to AWS..."
    # Add your AWS deployment commands here
fi

echo "✅ Video Interactions deployment complete!"
echo ""
echo "📊 Stack Outputs:"
echo "  Videos Table: ${VIDEOS_TABLE}"
echo "  Comments Table: ${COMMENTS_TABLE}"
echo "  Responses Table: ${RESPONSES_TABLE}"
echo "  Shares Table: ${SHARES_TABLE}"
echo "  Video Bucket: ${VIDEO_BUCKET}"
echo "  Notifications Topic: ${NOTIFICATIONS_TOPIC}"
echo ""
echo "🎉 Video interactions are now live in production!"
