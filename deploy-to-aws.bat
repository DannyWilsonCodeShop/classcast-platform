@echo off
echo 🚀 ClassCast AWS Production Deployment Script
echo =============================================
echo.

echo 📋 Checking prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ Node.js found

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)
echo ✅ npm found

REM Check AWS CLI
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS CLI not found. Please restart your terminal after installing AWS CLI.
    echo    Or run: winget install -e --id Amazon.AWSCLI
    pause
    exit /b 1
)
echo ✅ AWS CLI found

REM Check CDK
cdk --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS CDK not found. Please install CDK first.
    echo    Run: npm install -g aws-cdk
    pause
    exit /b 1
)
echo ✅ AWS CDK found

echo.
echo 🔧 All prerequisites are satisfied!
echo.

REM Check if AWS is configured
echo 🔍 Checking AWS configuration...
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS not configured. Please run 'aws configure' first.
    echo.
    echo You'll need:
    echo - AWS Access Key ID
    echo - AWS Secret Access Key
    echo - Default region (e.g., us-east-1)
    echo - Default output format (press Enter for json)
    echo.
    pause
    exit /b 1
)
echo ✅ AWS configured successfully

echo.
echo 🚀 Starting deployment process...
echo.

REM Navigate to CDK directory
cd cdk
if %errorlevel% neq 0 (
    echo ❌ Failed to navigate to CDK directory
    pause
    exit /b 1
)

echo 📦 Installing CDK dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Bootstrapping CDK (first time only)...
npm run bootstrap
if %errorlevel% neq 0 (
    echo ❌ CDK bootstrap failed
    pause
    exit /b 1
)

echo.
echo 🏗️ Deploying all infrastructure...
echo This may take 15-30 minutes...
npm run deploy:all
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    echo.
    echo 🔍 Check the error messages above for details.
    echo 💡 Common issues:
    echo    - Insufficient IAM permissions
    echo    - VPC limits exceeded
    echo    - Region-specific service availability
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next steps:
echo 1. Check the CDK outputs above for your resource IDs
echo 2. Update your .env.local file with the new values
echo 3. Test your production environment
echo 4. Monitor costs in AWS Cost Explorer
echo.
echo 🔗 Useful AWS Console links:
echo - CloudFormation: https://console.aws.amazon.com/cloudformation
echo - ECS: https://console.aws.amazon.com/ecs
echo - Cognito: https://console.aws.amazon.com/cognito
echo - S3: https://console.aws.amazon.com/s3
echo - CloudWatch: https://console.aws.amazon.com/cloudwatch
echo.

pause




