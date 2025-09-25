#!/bin/bash

echo "🔧 Adding Environment Variables to AWS Amplify"
echo "App ID: d166bugwfgjggz"
echo "=============================================="
echo ""

# Add each environment variable
echo "Adding REGION..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables REGION=us-east-1

echo "Adding USERS_TABLE_NAME..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables USERS_TABLE_NAME=classcast-users

echo "Adding S3_ASSETS_BUCKET..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables S3_ASSETS_BUCKET=cdk-hnb659fds-assets-463470937777-us-east-1

echo "Adding S3_VIDEOS_BUCKET..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables S3_VIDEOS_BUCKET=classcast-videos-463470937777-us-east-1

echo "Adding ASSIGNMENTS_TABLE_NAME..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables ASSIGNMENTS_TABLE_NAME=classcast-assignments

echo "Adding SUBMISSIONS_TABLE_NAME..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables SUBMISSIONS_TABLE_NAME=classcast-submissions

echo "Adding COURSES_TABLE_NAME..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables COURSES_TABLE_NAME=classcast-courses

echo "Adding CONTENT_MODERATION_TABLE_NAME..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables CONTENT_MODERATION_TABLE_NAME=classcast-content-moderation

echo "Adding FROM_EMAIL..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables FROM_EMAIL=noreply@myclasscast.com

echo "Adding REPLY_TO_EMAIL..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables REPLY_TO_EMAIL=support@myclasscast.com

echo "Adding NODE_ENV..."
aws amplify update-app --app-id d166bugwfgjggz --environment-variables NODE_ENV=production

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Wait 2-3 minutes for the changes to propagate"
echo "2. Test: curl https://development-testing-branch.d166bugwfgjggz.amplifyapp.com/api/debug/env"
echo "3. Try the profile save functionality again"
