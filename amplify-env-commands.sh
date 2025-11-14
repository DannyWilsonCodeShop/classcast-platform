#!/bin/bash

echo "🔧 AWS Amplify Environment Variables Setup Commands"
echo "=================================================="
echo ""

echo "📋 Step 1: First, let's find your Amplify app ID:"
echo "aws amplify list-apps --query 'apps[].{Name:name,AppId:appId}' --output table"
echo ""

echo "📋 Step 2: Once you have the app ID, run these commands:"
echo ""

# Environment variables to add
declare -A env_vars=(
    ["REGION"]="us-east-1"
    ["USERS_TABLE_NAME"]="classcast-users"
    ["S3_ASSETS_BUCKET"]="cdk-hnb659fds-assets-463470937777-us-east-1"
    ["S3_VIDEOS_BUCKET"]="classcast-videos-463470937777-us-east-1"
    ["ASSIGNMENTS_TABLE_NAME"]="classcast-assignments"
    ["SUBMISSIONS_TABLE_NAME"]="classcast-submissions"
    ["COURSES_TABLE_NAME"]="classcast-courses"
    ["CONTENT_MODERATION_TABLE_NAME"]="classcast-content-moderation"
    ["FROM_EMAIL"]="noreply@myclasscast.com"
    ["REPLY_TO_EMAIL"]="support@myclasscast.com"
    ["NODE_ENV"]="production"
)

echo "# Replace YOUR_APP_ID with the actual app ID from step 1"
echo ""

for key in "${!env_vars[@]}"; do
    echo "aws amplify update-app --app-id YOUR_APP_ID --environment-variables ${key}=${env_vars[$key]}"
done

echo ""
echo "📋 Step 3: Alternative - Use AWS Console:"
echo "1. Go to AWS Console → Amplify"
echo "2. Click on your app: classcast-platform"
echo "3. Go to 'App settings' → 'Environment variables'"
echo "4. Add each variable manually"
echo ""

echo "📋 Step 4: Test the configuration:"
echo "curl https://development-testing-branch.d166bugwfgjggz.amplifyapp.com/api/debug/env"
echo ""

echo "✅ After adding variables, wait 2-3 minutes and test the profile save functionality!"
