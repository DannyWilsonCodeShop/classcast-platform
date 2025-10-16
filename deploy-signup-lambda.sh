#!/bin/bash

echo "🚀 Deploying updated Lambda signup function with Cristo Rey logo"
echo "================================================================"
echo ""

FUNCTION_NAME="classcast-signup"
ZIP_FILE="lambda-signup-updated.zip"

# Navigate to lambda directory
cd lambda/signup || { echo "❌ Failed to navigate to lambda/signup directory"; exit 1; }

# Create a deployment package
echo "📦 Creating deployment package..."
zip -r ../../$ZIP_FILE index.js package.json node_modules 2>/dev/null

cd ../..

# Check if zip was created
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

echo "✅ Deployment package created: $ZIP_FILE"
echo ""

# Update the Lambda function
echo "📤 Uploading to AWS Lambda..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://$ZIP_FILE \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Lambda function updated successfully!"
    echo ""
    echo "🎓 New user accounts will now include:"
    echo "   ✓ Cristo Rey Atlanta Jesuit High School logo"
    echo "   ✓ Logo path: /logos/cristo-rey-atlanta.png"
    echo "   ✓ Automatically displayed on student and instructor dashboards"
    echo ""
    
    # Clean up zip file
    rm $ZIP_FILE
    echo "🧹 Cleaned up deployment package"
else
    echo ""
    echo "❌ Failed to update Lambda function"
    echo "   Please check AWS credentials and permissions"
    exit 1
fi

echo ""
echo "✨ Deployment complete!"

