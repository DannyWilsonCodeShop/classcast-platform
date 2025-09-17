#!/bin/bash

# Deploy Content Moderation Lambda Function
echo "🚀 Deploying Content Moderation Lambda Function..."

# Set variables
FUNCTION_NAME="classcast-content-moderation"
ZIP_FILE="content-moderation.zip"
LAMBDA_DIR="content-moderation"

# Navigate to lambda directory
cd "$(dirname "$0")"

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
        --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role \
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
    --environment Variables='{
        "OPENAI_API_KEY":"'$OPENAI_API_KEY'",
        "MODERATION_TABLE":"classcast-content-moderation"
    }'

# Add API Gateway permissions
echo "🔗 Adding API Gateway permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:*:*:*" \
    --output text 2>/dev/null || echo "Permission already exists"

# Clean up
echo "🧹 Cleaning up..."
rm $ZIP_FILE

echo "✅ Content Moderation Lambda function deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🔗 Next steps:"
echo "   1. Add API Gateway integration"
echo "   2. Create DynamoDB table for moderation logs"
echo "   3. Test the moderation endpoints"
