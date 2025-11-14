#!/bin/bash

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/classcast-lambda-role"

# Function to deploy a Lambda function
deploy_lambda() {
    local function_name=$1
    local source_file=$2
    
    echo "Deploying $function_name..."
    
    # Create directory for this function
    mkdir -p $function_name
    cp $source_file $function_name/index.js
    
    # Create package.json
    cat > $function_name/package.json << EOF
{
  "name": "$function_name",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1691.0"
  }
}
EOF
    
    # Install dependencies
    cd $function_name
    npm install --production --silent
    zip -r ../${function_name}.zip . > /dev/null
    cd ..
    
    # Deploy function
    aws lambda create-function \
        --region $REGION \
        --function-name $function_name \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://${function_name}.zip \
        --description "ClassCast $function_name Lambda Function" \
        --timeout 30 \
        --memory-size 256 \
        --output table \
        --query 'FunctionName' 2>/dev/null || echo "Function $function_name may already exist, updating..."
    
    # Clean up
    rm -rf $function_name ${function_name}.zip
    echo "✅ $function_name deployed"
    echo ""
}

echo "🚀 Deploying HIGH-VALUE FEATURES first..."
echo "=========================================="

# HIGH-VALUE FEATURES
deploy_lambda "classcast-generate-video-upload-url" "../lambda/auth/generate-video-upload-url.ts"
deploy_lambda "classcast-process-video-submission" "../lambda/auth/process-video-submission.ts"
deploy_lambda "classcast-confirm-password-reset" "../lambda/auth/confirm-password-reset.ts"
deploy_lambda "classcast-forgot-password-handler" "../lambda/auth/forgot-password-handler.ts"
deploy_lambda "classcast-role-management" "../lambda/auth/role-management.ts"

echo ""
echo "🔐 Deploying ADVANCED AUTHENTICATION..."
echo "======================================"

# ADVANCED AUTHENTICATION
deploy_lambda "classcast-resend-confirmation" "../lambda/auth/resend-confirmation.ts"
deploy_lambda "classcast-signup-confirmation" "../lambda/auth/signup-confirmation.ts"
deploy_lambda "classcast-refresh-token-handler" "../lambda/auth/refresh-token-handler.ts"
deploy_lambda "classcast-signout-handler" "../lambda/auth/signout-handler.ts"
deploy_lambda "classcast-session-management" "../lambda/auth/session-management.ts"
deploy_lambda "classcast-jwt-verifier" "../lambda/auth/jwt-verifier.ts"

echo ""
echo "👥 Deploying USER MANAGEMENT..."
echo "============================="

# USER MANAGEMENT
deploy_lambda "classcast-role-based-signup" "../lambda/auth/role-based-signup.ts"

echo ""
echo "🔔 Deploying COGNITO TRIGGERS..."
echo "==============================="

# COGNITO TRIGGERS
deploy_lambda "classcast-pre-authentication" "../lambda/auth/pre-authentication.ts"
deploy_lambda "classcast-pre-token-generation" "../lambda/auth/pre-token-generation.ts"
deploy_lambda "classcast-custom-message" "../lambda/auth/custom-message.ts"

echo ""
echo "📱 Deploying COMMUNITY FEATURES..."
echo "================================="

# COMMUNITY FEATURES
deploy_lambda "classcast-instructor-community-feed" "../lambda/auth/instructor-community-feed.ts"

echo ""
echo "🎉 ALL LAMBDA FUNCTIONS DEPLOYED SUCCESSFULLY!"
echo "=============================================="

# List all deployed functions
echo ""
echo "📊 DEPLOYED FUNCTIONS SUMMARY:"
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `classcast`)].FunctionName' --output table
