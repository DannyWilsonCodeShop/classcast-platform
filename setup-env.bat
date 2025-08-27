@echo off
echo 🔧 ClassCast Environment Setup Script
echo ====================================
echo.

echo 📝 This script will help you set up your environment variables
echo    after AWS deployment.
echo.

echo 🔍 Please enter the following values from your CDK deployment:
echo.

set /p AWS_REGION="AWS Region (e.g., us-east-1): "
set /p USER_POOL_ID="Cognito User Pool ID: "
set /p CLIENT_ID="Cognito Client ID: "
set /p IDENTITY_POOL_ID="Cognito Identity Pool ID: "
set /p DATABASE_URL="Database URL: "
set /p S3_BUCKET="S3 Bucket Name: "
set /p API_ENDPOINT="API Gateway Endpoint: "

echo.
echo 📁 Creating .env.local file...

(
echo # AWS Configuration
echo AWS_REGION=%AWS_REGION%
echo AWS_USER_POOL_ID=%USER_POOL_ID%
echo AWS_CLIENT_ID=%CLIENT_ID%
echo AWS_IDENTITY_POOL_ID=%IDENTITY_POOL_ID%
echo.
echo # Database
echo DATABASE_URL=%DATABASE_URL%
echo.
echo # S3
echo S3_BUCKET_NAME=%S3_BUCKET%
echo.
echo # API Gateway
echo API_ENDPOINT=%API_ENDPOINT%
echo.
echo # Environment
echo NODE_ENV=production
echo NEXT_PUBLIC_API_URL=%API_ENDPOINT%
) > .env.local

echo ✅ Environment file created successfully!
echo.
echo 📋 Your .env.local file contains:
echo.
type .env.local
echo.
echo 🔒 Remember: Never commit this file to Git!
echo.
echo 🚀 You can now run your production application:
echo    npm run build
echo    npm run start
echo.

pause



