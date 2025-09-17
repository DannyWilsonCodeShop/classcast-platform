#!/bin/bash

# Deploy Content Moderation Lambda Function with proper role setup
echo "🚀 Deploying Content Moderation Lambda Function..."

# Set variables
FUNCTION_NAME="classcast-content-moderation"
ROLE_NAME="classcast-content-moderation-role"
ZIP_FILE="content-moderation.zip"
LAMBDA_DIR="content-moderation"
REGION="us-east-1"

# Set AWS region
export AWS_DEFAULT_REGION=$REGION

# Navigate to lambda directory
cd "$(dirname "$0")"

# Create IAM role for Lambda function
echo "🔐 Creating IAM role for Lambda function..."
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' 2>/dev/null || echo "Role already exists"

# Attach basic execution policy
echo "📋 Attaching basic execution policy..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for DynamoDB access
echo "📋 Creating custom policy for DynamoDB access..."
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name ContentModerationDynamoDBPolicy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": "arn:aws:dynamodb:'$REGION':*:table/classcast-content-moderation"
            }
        ]
    }'

# Wait for role to be ready
echo "⏳ Waiting for role to be ready..."
sleep 10

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Create zip file
echo "📦 Creating deployment package..."
cd $LAMBDA_DIR
zip -r ../$ZIP_FILE .
cd ..

# Deploy or update Lambda function
echo "🔄 Deploying Lambda function: $FUNCTION_NAME"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME >/dev/null 2>&1; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$ZIP_FILE
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://$ZIP_FILE \
        --description "Content moderation for ClassCast platform" \
        --timeout 30 \
        --memory-size 512
fi

# Set environment variables
echo "🔧 Setting environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables='{OPENAI_API_KEY=your_key_here,MODERATION_TABLE=classcast-content-moderation}'

# Add API Gateway permissions
echo "🔗 Adding API Gateway permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:*" \
    --output text 2>/dev/null || echo "Permission already exists"

# Clean up
echo "🧹 Cleaning up..."
rm $ZIP_FILE

echo "✅ Content Moderation Lambda function deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🔗 Role ARN: $ROLE_ARN"
echo "🔗 Next steps:"
echo "   1. Set OPENAI_API_KEY environment variable"
echo "   2. Create DynamoDB table for moderation logs"
echo "   3. Add API Gateway integration"
echo "   4. Test the moderation endpoints"
