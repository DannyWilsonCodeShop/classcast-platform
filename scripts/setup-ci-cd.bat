@echo off
REM CI/CD Pipeline Setup Script for Windows
REM This script helps configure the CI/CD pipeline for your project

setlocal enabledelayedexpansion

echo.
echo 🚀 CI/CD Pipeline Setup Script
echo ==============================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This is not a git repository. Please run this script from a git repository.
    pause
    exit /b 1
)

REM Check if GitHub Actions is available
if not exist ".github" (
    echo [INFO] Creating .github directory...
    mkdir .github
)

echo [SUCCESS] Prerequisites check passed!

REM Configure project settings
echo.
echo [INFO] Configuring project settings...
echo.
echo Please provide the following information for your project:
echo.

REM Get project domain
set /p PRODUCTION_DOMAIN="Enter your production domain (e.g., yourdomain.com): "
if "!PRODUCTION_DOMAIN!"=="" (
    echo [ERROR] Production domain is required.
    pause
    exit /b 1
)

set /p STAGING_DOMAIN="Enter your staging domain (e.g., staging.yourdomain.com) [staging.!PRODUCTION_DOMAIN!]: "
if "!STAGING_DOMAIN!"=="" set STAGING_DOMAIN=staging.!PRODUCTION_DOMAIN!

REM Get AWS region
set /p AWS_REGION="Enter your AWS region [us-east-1]: "
if "!AWS_REGION!"=="" set AWS_REGION=us-east-1

echo [SUCCESS] Project configuration completed!

REM Update configuration files
echo.
echo [INFO] Updating configuration files...

REM Update staging workflow
if exist ".github\workflows\deploy-staging.yml" (
    powershell -Command "(Get-Content '.github\workflows\deploy-staging.yml') -replace 'staging\.yourdomain\.com', '!STAGING_DOMAIN!' -replace 'us-east-1', '!AWS_REGION!' | Set-Content '.github\workflows\deploy-staging.yml'"
)

REM Update production workflow
if exist ".github\workflows\deploy-production.yml" (
    powershell -Command "(Get-Content '.github\workflows\deploy-production.yml') -replace 'yourdomain\.com', '!PRODUCTION_DOMAIN!' -replace 'us-east-1', '!AWS_REGION!' | Set-Content '.github\workflows\deploy-production.yml'"
)

REM Update environment configurations
if exist ".github\environments\staging.yml" (
    powershell -Command "(Get-Content '.github\environments\staging.yml') -replace 'staging\.yourdomain\.com', '!STAGING_DOMAIN!' | Set-Content '.github\environments\staging.yml'"
)

if exist ".github\environments\production.yml" (
    powershell -Command "(Get-Content '.github\environments\production.yml') -replace 'yourdomain\.com', '!PRODUCTION_DOMAIN!' | Set-Content '.github\environments\production.yml'"
)

REM Update CI/CD config
if exist ".github\ci-cd-config.yml" (
    powershell -Command "(Get-Content '.github\ci-cd-config.yml') -replace 'yourdomain\.com', '!PRODUCTION_DOMAIN!' -replace 'staging\.yourdomain\.com', '!STAGING_DOMAIN!' -replace 'us-east-1', '!AWS_REGION!' | Set-Content '.github\ci-cd-config.yml'"
)

echo [SUCCESS] Configuration files updated!

REM Create GitHub secrets guide
echo.
echo [INFO] Creating GitHub secrets configuration guide...

(
echo # GitHub Secrets Setup Guide
echo.
echo To complete the CI/CD pipeline setup, you need to configure the following secrets in your GitHub repository:
echo.
echo ## Required Secrets
echo.
echo ### AWS Credentials
echo 1. Go to your GitHub repository
echo 2. Navigate to Settings ^> Secrets and variables ^> Actions
echo 3. Click "New repository secret"
echo 4. Add the following secrets:
echo.
echo ```bash
echo AWS_ACCESS_KEY_ID
echo ```
echo - **Value**: Your AWS access key ID
echo - **Description**: AWS access key for deployment
echo.
echo ```bash
echo AWS_SECRET_ACCESS_KEY
echo ```
echo - **Value**: Your AWS secret access key
echo - **Description**: AWS secret key for deployment
echo.
echo ```bash
echo AWS_ROLE_ARN
echo ```
echo - **Value**: Your AWS role ARN (if using cross-account access)
echo - **Description**: AWS role ARN for cross-account deployment
echo.
echo ### Security Tools
echo ```bash
echo SNYK_TOKEN
echo ```
echo - **Value**: Your Snyk API token
echo - **Description**: Snyk API token for security scanning
echo.
echo ## Optional Secrets
echo.
echo ### Notifications
echo ```bash
echo SLACK_WEBHOOK
echo ```
echo - **Value**: Your Slack webhook URL
echo - **Description**: Slack webhook for deployment notifications
echo.
echo ```bash
echo TEAMS_WEBHOOK
echo ```
echo - **Value**: Your Microsoft Teams webhook URL
echo - **Description**: Teams webhook for deployment notifications
echo.
echo ## How to Add Secrets
echo.
echo 1. Go to your GitHub repository
echo 2. Click on "Settings"
echo 3. In the left sidebar, click "Secrets and variables" ^> "Actions"
echo 4. Click "New repository secret"
echo 5. Enter the secret name and value
echo 6. Click "Add secret"
echo.
echo ## Security Notes
echo.
echo - Never commit secrets to your repository
echo - Use environment-specific secrets when possible
echo - Regularly rotate your AWS credentials
echo - Use least-privilege IAM policies for deployment
echo.
echo ## Testing the Setup
echo.
echo After adding the secrets:
echo.
echo 1. Push a change to the `staging` branch to trigger staging deployment
echo 2. Check the Actions tab to monitor the workflow execution
echo 3. Verify that the deployment completes successfully
echo.
echo ## Troubleshooting
echo.
echo If you encounter issues:
echo.
echo 1. Check the Actions tab for detailed error logs
echo 2. Verify that all required secrets are configured
echo 3. Ensure your AWS credentials have the necessary permissions
echo 4. Check that your AWS region is correctly configured
echo.
echo For more help, refer to the CI_CD_SETUP_README.md file.
) > GITHUB_SECRETS_SETUP.md

echo [SUCCESS] GitHub secrets setup guide created!

REM Create branch protection guide
echo.
echo [INFO] Creating branch protection setup guide...

(
echo # Branch Protection Setup Guide
echo.
echo To ensure the security and stability of your deployments, configure branch protection rules for your main branches.
echo.
echo ## Required Branch Protection Rules
echo.
echo ### Main Branch (`main`)
echo 1. Go to your GitHub repository
echo 2. Navigate to Settings ^> Branches
echo 3. Click "Add rule"
echo 4. Enter `main` as the branch name pattern
echo 5. Configure the following settings:
echo.
echo **Protect matching branches**
echo - ✅ Check "Require a pull request before merging"
echo - ✅ Check "Require approvals" (set to 2)
echo - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
echo - ✅ Check "Require review from code owners"
echo - ✅ Check "Require status checks to pass before merging"
echo - ✅ Check "Require branches to be up to date before merging"
echo.
echo **Status checks that are required**
echo - CI - Continuous Integration
echo - lint-and-format
echo - unit-tests
echo - e2e-tests
echo - build-verification
echo - infrastructure-validation
echo - security-scan
echo.
echo **Restrict pushes that create files that match the specified glob patterns**
echo - Leave empty (no restrictions)
echo.
echo 6. Click "Create"
echo.
echo ### Staging Branch (`staging`)
echo 1. Click "Add rule" again
echo 2. Enter `staging` as the branch name pattern
echo 3. Configure the following settings:
echo.
echo **Protect matching branches**
echo - ✅ Check "Require a pull request before merging"
echo - ✅ Check "Require approvals" (set to 1)
echo - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
echo - ❌ Don't check "Require review from code owners"
echo - ✅ Check "Require status checks to pass before merging"
echo - ✅ Check "Require branches to be up to date before merging"
echo.
echo **Status checks that are required**
echo - CI - Continuous Integration
echo - lint-and-format
echo - unit-tests
echo - e2e-tests
echo - build-verification
echo.
echo **Restrict pushes that create files that match the specified glob patterns**
echo - Leave empty (no restrictions)
echo.
echo 4. Click "Create"
echo.
echo ### Develop Branch (`develop`)
echo 1. Click "Add rule" again
echo 2. Enter `develop` as the branch name pattern
echo 3. Configure the following settings:
echo.
echo **Protect matching branches**
echo - ✅ Check "Require a pull request before merging"
echo - ✅ Check "Require approvals" (set to 1)
echo - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
echo - ❌ Don't check "Require review from code owners"
echo - ✅ Check "Require status checks to pass before merging"
echo - ✅ Check "Require branches to be up to date before merging"
echo.
echo **Status checks that are required**
echo - CI - Continuous Integration
echo - lint-and-format
echo - unit-tests
echo - build-verification
echo.
echo **Restrict pushes that create files that match the specified glob patterns**
echo - Leave empty (no restrictions)
echo.
echo 4. Click "Create"
echo.
echo ## Code Owners Setup
echo.
echo To enable code owner reviews:
echo.
echo 1. Create a `.github/CODEOWNERS` file in your repository
echo 2. Add the following content:
echo.
echo ```
echo # Global code owners
echo * @your-username @your-team
echo.
echo # Specific file/directory owners
echo /src/ @frontend-team
echo /cdk/ @devops-team
echo /.github/ @devops-team
echo ```
echo.
echo 3. Replace `@your-username` and `@your-team` with actual GitHub usernames or team names
echo.
echo ## Verification
echo.
echo After setting up branch protection:
echo.
echo 1. Try to push directly to a protected branch
echo 2. Verify that the push is blocked
echo 3. Create a pull request and verify that the required checks run
echo 4. Verify that approvals are required before merging
echo.
echo ## Best Practices
echo.
echo - Use descriptive branch names
echo - Require at least one approval for all branches
echo - Require more approvals for production branches
echo - Use code owners for critical parts of the codebase
echo - Regularly review and update protection rules
) > BRANCH_PROTECTION_SETUP.md

echo [SUCCESS] Branch protection setup guide created!

REM Display next steps
echo.
echo [SUCCESS] CI/CD Pipeline setup completed!
echo.
echo 🎉 Your CI/CD pipeline is now configured!
echo.
echo 📋 Next steps:
echo 1. Configure GitHub secrets (see GITHUB_SECRETS_SETUP.md)
echo 2. Set up branch protection rules (see BRANCH_PROTECTION_SETUP.md)
echo 3. Push your changes to trigger the first CI run
echo 4. Test the staging deployment by pushing to the staging branch
echo.
echo 📚 Documentation:
echo - CI_CD_SETUP_README.md - Complete setup and usage guide
echo - GITHUB_SECRETS_SETUP.md - Secrets configuration guide
echo - BRANCH_PROTECTION_SETUP.md - Branch protection setup guide
echo.
echo 🔧 Customization:
echo - Review and modify the workflow files in .github/workflows/
echo - Update environment configurations in .github/environments/
echo - Customize the CI/CD configuration in .github/ci-cd-config.yml
echo.
echo 🚀 Happy deploying!
echo.
pause
