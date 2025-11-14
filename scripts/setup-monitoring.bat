@echo off
REM Monitoring and Logging Setup Script for Windows
REM This script helps configure the monitoring and logging infrastructure

setlocal enabledelayedexpansion

echo ==========================================
echo   DemoProject Monitoring ^& Logging Setup
echo ==========================================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if AWS CLI is installed
where aws >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI is not installed. Please install it first.
    echo [INFO] Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
    pause
    exit /b 1
)

REM Check if AWS credentials are configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS credentials are not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

REM Check if CDK is installed
where cdk >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CDK is not installed. Please install it first.
    echo [INFO] Run: npm install -g aws-cdk
    pause
    exit /b 1
)

REM Check if CDK is bootstrapped
aws cloudformation describe-stacks --stack-name CDKToolkit >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] CDK is not bootstrapped. This will be done during deployment.
)

echo [SUCCESS] Prerequisites check passed

REM Configure environment
echo [INFO] Configuring monitoring and logging environment...

REM Get environment type
set /p ENVIRONMENT="Enter environment type [development]: "
if "!ENVIRONMENT!"=="" set ENVIRONMENT=development

if not "!ENVIRONMENT!"=="development" if not "!ENVIRONMENT!"=="staging" if not "!ENVIRONMENT!"=="production" (
    echo [ERROR] Invalid environment. Must be development, staging, or production
    pause
    exit /b 1
)

echo [SUCCESS] Environment set to: !ENVIRONMENT!

REM Get AWS region
set /p AWS_REGION="Enter AWS region [us-east-1]: "
if "!AWS_REGION!"=="" set AWS_REGION=us-east-1

REM Get AWS account ID
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i
echo [INFO] AWS Account ID: !AWS_ACCOUNT_ID!

REM Get domain information
if "!ENVIRONMENT!"=="production" (
    set /p PRODUCTION_DOMAIN="Enter production domain (e.g., yourdomain.com): "
    if "!PRODUCTION_DOMAIN!"=="" (
        echo [ERROR] Production domain is required.
        pause
        exit /b 1
    )
    set STAGING_DOMAIN=staging.!PRODUCTION_DOMAIN!
) else (
    set /p STAGING_DOMAIN="Enter staging domain (e.g., staging.yourdomain.com): "
    if "!STAGING_DOMAIN!"=="" (
        echo [ERROR] Staging domain is required.
        pause
        exit /b 1
    )
    for /f "tokens=2 delims=." %%i in ("!STAGING_DOMAIN!") do set PRODUCTION_DOMAIN=%%i
)

REM Get external service configurations
echo [INFO] External service configurations (optional):

set /p SENTRY_DSN="Enter Sentry DSN (optional): "
set /p DATADOG_API_KEY="Enter DataDog API key (optional): "
set /p NEW_RELIC_LICENSE_KEY="Enter New Relic license key (optional): "

REM Create environment file
echo [INFO] Creating environment configuration file...

(
echo # Monitoring and Logging Environment Configuration
echo # Generated on: %date% %time%
echo.
echo # Required Environment Variables
echo ENVIRONMENT=!ENVIRONMENT!
echo AWS_REGION=!AWS_REGION!
echo AWS_ACCOUNT_ID=!AWS_ACCOUNT_ID!
echo.
echo # Domain Configuration
echo PRODUCTION_DOMAIN=!PRODUCTION_DOMAIN!
echo STAGING_DOMAIN=!STAGING_DOMAIN!
echo.
echo # External Service Integrations
echo SENTRY_DSN=!SENTRY_DSN!
echo DATADOG_API_KEY=!DATADOG_API_KEY!
echo NEW_RELIC_LICENSE_KEY=!NEW_RELIC_LICENSE_KEY!
echo.
echo # CDK Configuration
echo CDK_DEFAULT_ACCOUNT=!AWS_ACCOUNT_ID!
echo CDK_DEFAULT_REGION=!AWS_REGION!
) > .env.monitoring

echo [SUCCESS] Environment file created: .env.monitoring

REM Create deployment script
echo [INFO] Creating deployment script...

(
echo @echo off
echo REM Monitoring and Logging Deployment Script
echo.
echo setlocal enabledelayedexpansion
echo.
echo REM Load environment variables
echo if exist ".env.monitoring" ^(
echo     for /f "tokens=1,2 delims==" %%a in ^(.env.monitoring^) do ^(
echo         if not "%%a"=="#" if not "%%a"=="" set "%%a=%%b"
echo     ^)
echo ^)
echo.
echo REM Check if environment variables are set
echo if "!ENVIRONMENT!"=="" ^(
echo     echo Error: ENVIRONMENT not set. Please run setup-monitoring.bat first.
echo     pause
echo     exit /b 1
echo ^)
echo if "!AWS_REGION!"=="" ^(
echo     echo Error: AWS_REGION not set. Please run setup-monitoring.bat first.
echo     pause
echo     exit /b 1
echo ^)
echo if "!AWS_ACCOUNT_ID!"=="" ^(
echo     echo Error: AWS_ACCOUNT_ID not set. Please run setup-monitoring.bat first.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo Deploying monitoring and logging infrastructure for environment: !ENVIRONMENT!
echo.
echo REM Change to CDK directory
echo cd cdk
echo.
echo REM Install dependencies
echo echo Installing CDK dependencies...
echo npm install
echo.
echo REM Build CDK
echo echo Building CDK...
echo npm run build
echo.
echo REM Deploy monitoring stack
echo echo Deploying monitoring stack...
echo cdk deploy DemoProject-MonitoringStack --require-approval never
echo.
echo REM Deploy logging stack
echo echo Deploying logging stack...
echo cdk deploy DemoProject-LoggingStack --require-approval never
echo.
echo REM Deploy error tracking stack
echo echo Deploying error tracking stack...
echo cdk deploy DemoProject-ErrorTrackingStack --require-approval never
echo.
echo echo Monitoring and logging infrastructure deployed successfully!
echo echo.
echo echo Next steps:
echo echo 1. Check CloudWatch dashboards in AWS Console
echo echo 2. Verify SNS topics and subscriptions
echo echo 3. Test error reporting endpoints
echo echo 4. Configure external service integrations
echo.
echo pause
) > scripts\deploy-monitoring.bat

echo [SUCCESS] Deployment script created: scripts\deploy-monitoring.bat

REM Create monitoring configuration guide
echo [INFO] Creating monitoring configuration guide...

(
echo # Monitoring and Logging Setup Guide
echo.
echo ## Environment Configuration
echo.
echo Your monitoring and logging environment has been configured with the following settings:
echo.
echo - **Environment**: !ENVIRONMENT!
echo - **AWS Region**: !AWS_REGION!
echo - **AWS Account ID**: !AWS_ACCOUNT_ID!
echo - **Production Domain**: !PRODUCTION_DOMAIN!
echo - **Staging Domain**: !STAGING_DOMAIN!
echo.
echo ## External Service Integrations
echo.
echo ### Sentry
echo - **DSN**: !SENTRY_DSN!
echo - **Purpose**: Error tracking and performance monitoring
echo - **Setup**: Visit https://sentry.io to create a project and get your DSN
echo.
echo ### DataDog
echo - **API Key**: !DATADOG_API_KEY!
echo - **Purpose**: Application performance monitoring
echo - **Setup**: Visit https://datadoghq.com to create an account and get your API key
echo.
echo ### New Relic
echo - **License Key**: !NEW_RELIC_LICENSE_KEY!
echo - **Purpose**: Application performance monitoring
echo - **Setup**: Visit https://newrelic.com to create an account and get your license key
echo.
echo ## Deployment
echo.
echo To deploy the monitoring and logging infrastructure:
echo.
echo 1. **Set environment variables**:
echo    ```cmd
echo    for /f "tokens=1,2 delims==" %%a in (.env.monitoring) do set "%%a=%%b"
echo    ```
echo.
echo 2. **Deploy infrastructure**:
echo    ```cmd
echo    scripts\deploy-monitoring.bat
echo    ```
echo.
echo ## Post-Deployment Configuration
echo.
echo ### 1. CloudWatch Dashboards
echo - Application Dashboard: `DemoProject-Application-!ENVIRONMENT!`
echo - Infrastructure Dashboard: `DemoProject-Infrastructure-!ENVIRONMENT!`
echo - Security Dashboard: `DemoProject-Security-!ENVIRONMENT!`
echo - Error Dashboard: `DemoProject-Errors-!ENVIRONMENT!`
echo - Performance Dashboard: `DemoProject-Performance-!ENVIRONMENT!`
echo.
echo ### 2. SNS Topics
echo - Monitoring Topic: `DemoProject-Monitoring-!ENVIRONMENT!`
echo - Critical Alerts Topic: `DemoProject-CriticalAlerts-!ENVIRONMENT!`
echo - Error Tracking Topic: `DemoProject-ErrorTracking-!ENVIRONMENT!`
echo - Performance Monitoring Topic: `DemoProject-PerformanceMonitoring-!ENVIRONMENT!`
echo.
echo ### 3. Log Groups
echo - Central Log Group: `/DemoProject/Central/!ENVIRONMENT!`
echo - Application Log Group: `/DemoProject/Application/!ENVIRONMENT!`
echo - Database Log Group: `/DemoProject/Database/!ENVIRONMENT!`
echo - Security Log Group: `/DemoProject/Security/!ENVIRONMENT!`
echo - Performance Log Group: `/DemoProject/Performance/!ENVIRONMENT!`
echo.
echo ### 4. Lambda Functions
echo - Error Aggregator: `DemoProject-ErrorAggregator-!ENVIRONMENT!`
echo - Performance Analyzer: `DemoProject-PerformanceAnalyzer-!ENVIRONMENT!`
echo - Log Processor: `DemoProject-LogProcessor-!ENVIRONMENT!`
echo.
echo ## Testing
echo.
echo ### Test Error Reporting
echo ```cmd
echo REM Test error reporting endpoint
echo curl -X POST https://your-api-gateway-url/prod/errors ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"errorType\": \"ValidationError\", \"errorMessage\": \"Invalid input\", \"severity\": \"MEDIUM\", \"endpoint\": \"/api/test\", \"method\": \"POST\"}"
echo ```
echo.
echo ### Test Performance Monitoring
echo ```cmd
echo REM Test performance monitoring endpoint
echo curl -X POST https://your-api-gateway-url/prod/performance ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"endpoint\": \"/api/test\", \"method\": \"GET\", \"responseTime\": 150, \"statusCode\": 200}"
echo ```
echo.
echo ## Monitoring and Maintenance
echo.
echo ### Daily Tasks
echo - Review CloudWatch dashboards
echo - Check alarm status
echo - Monitor error rates and performance metrics
echo.
echo ### Weekly Tasks
echo - Review log insights queries
echo - Analyze performance trends
echo - Check S3 log archive lifecycle
echo.
echo ### Monthly Tasks
echo - Review and adjust alarm thresholds
echo - Analyze cost optimization opportunities
echo - Review external service integrations
echo.
echo ## Troubleshooting
echo.
echo ### Common Issues
echo.
echo 1. **High Error Rate**
echo    - Check application logs for specific errors
echo    - Review recent deployments
echo    - Check database connectivity
echo.
echo 2. **High Response Time**
echo    - Review database performance
echo    - Check ECS service health
echo    - Analyze API Gateway metrics
echo.
echo 3. **Log Processing Issues**
echo    - Check Kinesis stream status
echo    - Verify Firehose delivery
echo    - Check S3 bucket permissions
echo.
echo ### Debug Commands
echo.
echo ```cmd
echo REM Check CloudWatch logs
echo aws logs describe-log-groups --log-group-name-prefix "/DemoProject"
echo.
echo REM Check Kinesis stream status
echo aws kinesis describe-stream --stream-name DemoProject-LogProcessing-!ENVIRONMENT!
echo.
echo REM Check S3 log archive
echo aws s3 ls s3://demoproject-logs-!ENVIRONMENT!-!AWS_ACCOUNT_ID!/logs/
echo.
echo REM Check CloudWatch alarms
echo aws cloudwatch describe-alarms --alarm-names-prefix "DemoProject"
echo ```
echo.
echo ## Support
echo.
echo For issues or questions:
echo 1. Check CloudWatch logs and dashboards
echo 2. Review this documentation
echo 3. Check AWS documentation
echo 4. Contact the development team
echo.
echo ## Cost Optimization
echo.
echo ### Estimated Monthly Costs
echo - **CloudWatch Metrics**: ~$15-30/month
echo - **CloudWatch Logs**: ~$10-50/month (depending on log volume)
echo - **Kinesis**: ~$10-40/month
echo - **S3 Storage**: ~$5-20/month
echo - **Lambda**: ~$5-15/month
echo.
echo ### Optimization Tips
echo 1. Use appropriate log retention periods
echo 2. Implement log filtering and sampling
echo 3. Use metric aggregation
echo 4. Monitor and adjust resources based on usage
echo.
echo ---
echo.
echo *This guide was generated automatically by the monitoring setup script.*
) > MONITORING_SETUP_GUIDE.md

echo [SUCCESS] Monitoring configuration guide created: MONITORING_SETUP_GUIDE.md

REM Display next steps
echo [SUCCESS] Monitoring and logging setup completed successfully!
echo.
echo Next steps:
echo 1. Review the configuration in .env.monitoring
echo 2. Read MONITORING_SETUP_GUIDE.md for detailed instructions
echo 3. Deploy the infrastructure: scripts\deploy-monitoring.bat
echo 4. Configure external service integrations (Sentry, DataDog, New Relic)
echo 5. Test the monitoring and logging systems
echo.
echo Files created:
echo - .env.monitoring (environment configuration)
echo - scripts\deploy-monitoring.bat (deployment script)
echo - MONITORING_SETUP_GUIDE.md (setup guide)
echo.
echo To deploy the infrastructure:
echo for /f "tokens=1,2 delims==" %%a in (.env.monitoring) do set "%%a=%%b" ^&^& scripts\deploy-monitoring.bat
echo.
pause
