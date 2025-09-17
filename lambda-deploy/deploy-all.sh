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
        --query 'FunctionName' || echo "Function $function_name may already exist, updating..."
    
    # Clean up
    rm -rf $function_name ${function_name}.zip
    echo "✅ $function_name deployed"
    echo ""
}

# Deploy key Lambda functions
deploy_lambda "classcast-fetch-assignments" "../lambda/auth/fetch-assignments.ts"
deploy_lambda "classcast-grade-submission" "../lambda/auth/grade-submission.ts"
deploy_lambda "classcast-fetch-grades" "../lambda/auth/fetch-grades.ts"
deploy_lambda "classcast-fetch-submissions" "../lambda/auth/fetch-submissions.ts"
deploy_lambda "classcast-signin-handler" "../lambda/auth/signin-handler.ts"
deploy_lambda "classcast-signup-handler" "../lambda/auth/signup-handler.ts"

echo "🎉 All Lambda functions deployed successfully!"
