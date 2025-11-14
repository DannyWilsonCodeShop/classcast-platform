#!/bin/bash

# CI/CD Pipeline Setup Script
# This script helps configure the CI/CD pipeline for your project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate input
validate_input() {
    if [ -z "$1" ]; then
        print_error "This field is required. Please try again."
        return 1
    fi
    return 0
}

# Function to get user input with validation
get_input() {
    local prompt="$1"
    local default="$2"
    local required="$3"
    
    while true; do
        if [ -n "$default" ]; then
            read -p "$prompt [$default]: " input
            input=${input:-$default}
        else
            read -p "$prompt: " input
        fi
        
        if [ "$required" = "true" ]; then
            if validate_input "$input"; then
                break
            fi
        else
            break
        fi
    done
    
    echo "$input"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "This is not a git repository. Please run this script from a git repository."
        exit 1
    fi
    
    # Check if GitHub Actions is available
    if [ ! -d ".github" ]; then
        print_status "Creating .github directory..."
        mkdir -p .github
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to configure project settings
configure_project() {
    print_status "Configuring project settings..."
    
    echo
    echo "Please provide the following information for your project:"
    echo
    
    # Get project domain
    PRODUCTION_DOMAIN=$(get_input "Enter your production domain (e.g., yourdomain.com)" "" "true")
    STAGING_DOMAIN=$(get_input "Enter your staging domain (e.g., staging.yourdomain.com)" "staging.$PRODUCTION_DOMAIN" "false")
    
    # Get AWS region
    AWS_REGION=$(get_input "Enter your AWS region" "us-east-1" "false")
    
    # Get GitHub repository details
    GITHUB_REPO=$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')
    GITHUB_REPO=${GITHUB_REPO%.git}
    
    print_success "Project configuration completed!"
}

# Function to update configuration files
update_configurations() {
    print_status "Updating configuration files..."
    
    # Update staging workflow
    if [ -f ".github/workflows/deploy-staging.yml" ]; then
        sed -i.bak "s/staging\.yourdomain\.com/$STAGING_DOMAIN/g" .github/workflows/deploy-staging.yml
        sed -i.bak "s/us-east-1/$AWS_REGION/g" .github/workflows/deploy-staging.yml
        rm .github/workflows/deploy-staging.yml.bak
    fi
    
    # Update production workflow
    if [ -f ".github/workflows/deploy-production.yml" ]; then
        sed -i.bak "s/yourdomain\.com/$PRODUCTION_DOMAIN/g" .github/workflows/deploy-production.yml
        sed -i.bak "s/us-east-1/$AWS_REGION/g" .github/workflows/deploy-production.yml
        rm .github/workflows/deploy-production.yml.bak
    fi
    
    # Update environment configurations
    if [ -f ".github/environments/staging.yml" ]; then
        sed -i.bak "s/staging\.yourdomain\.com/$STAGING_DOMAIN/g" .github/environments/staging.yml
        rm .github/environments/staging.yml.bak
    fi
    
    if [ -f ".github/environments/production.yml" ]; then
        sed -i.bak "s/yourdomain\.com/$PRODUCTION_DOMAIN/g" .github/environments/production.yml
        rm .github/environments/production.yml.bak
    fi
    
    # Update CI/CD config
    if [ -f ".github/ci-cd-config.yml" ]; then
        sed -i.bak "s/yourdomain\.com/$PRODUCTION_DOMAIN/g" .github/ci-cd-config.yml
        sed -i.bak "s/staging\.yourdomain\.com/$STAGING_DOMAIN/g" .github/ci-cd-config.yml
        sed -i.bak "s/us-east-1/$AWS_REGION/g" .github/ci-cd-config.yml
        rm .github/ci-cd-config.yml.bak
    fi
    
    print_success "Configuration files updated!"
}

# Function to create GitHub secrets guide
create_secrets_guide() {
    print_status "Creating GitHub secrets configuration guide..."
    
    cat > GITHUB_SECRETS_SETUP.md << EOF
# GitHub Secrets Setup Guide

To complete the CI/CD pipeline setup, you need to configure the following secrets in your GitHub repository:

## Required Secrets

### AWS Credentials
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add the following secrets:

\`\`\`
AWS_ACCESS_KEY_ID
\`\`\`
- **Value**: Your AWS access key ID
- **Description**: AWS access key for deployment

\`\`\`
AWS_SECRET_ACCESS_KEY
\`\`\`
- **Value**: Your AWS secret access key
- **Description**: AWS secret key for deployment

\`\`\`
AWS_ROLE_ARN
\`\`\`
- **Value**: Your AWS role ARN (if using cross-account access)
- **Description**: AWS role ARN for cross-account deployment

### Security Tools
\`\`\`
SNYK_TOKEN
\`\`\`
- **Value**: Your Snyk API token
- **Description**: Snyk API token for security scanning

## Optional Secrets

### Notifications
\`\`\`
SLACK_WEBHOOK
\`\`\`
- **Value**: Your Slack webhook URL
- **Description**: Slack webhook for deployment notifications

\`\`\`
TEAMS_WEBHOOK
\`\`\`
- **Value**: Your Microsoft Teams webhook URL
- **Description**: Teams webhook for deployment notifications

## How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Enter the secret name and value
6. Click "Add secret"

## Security Notes

- Never commit secrets to your repository
- Use environment-specific secrets when possible
- Regularly rotate your AWS credentials
- Use least-privilege IAM policies for deployment

## Testing the Setup

After adding the secrets:

1. Push a change to the \`staging\` branch to trigger staging deployment
2. Check the Actions tab to monitor the workflow execution
3. Verify that the deployment completes successfully

## Troubleshooting

If you encounter issues:

1. Check the Actions tab for detailed error logs
2. Verify that all required secrets are configured
3. Ensure your AWS credentials have the necessary permissions
4. Check that your AWS region is correctly configured

For more help, refer to the CI_CD_SETUP_README.md file.
EOF
    
    print_success "GitHub secrets setup guide created!"
}

# Function to create branch protection guide
create_branch_protection_guide() {
    print_status "Creating branch protection setup guide..."
    
    cat > BRANCH_PROTECTION_SETUP.md << EOF
# Branch Protection Setup Guide

To ensure the security and stability of your deployments, configure branch protection rules for your main branches.

## Required Branch Protection Rules

### Main Branch (\`main\`)
1. Go to your GitHub repository
2. Navigate to Settings > Branches
3. Click "Add rule"
4. Enter \`main\` as the branch name pattern
5. Configure the following settings:

**Protect matching branches**
- ✅ Check "Require a pull request before merging"
- ✅ Check "Require approvals" (set to 2)
- ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
- ✅ Check "Require review from code owners"
- ✅ Check "Require status checks to pass before merging"
- ✅ Check "Require branches to be up to date before merging"

**Status checks that are required**
- CI - Continuous Integration
- lint-and-format
- unit-tests
- e2e-tests
- build-verification
- infrastructure-validation
- security-scan

**Restrict pushes that create files that match the specified glob patterns**
- Leave empty (no restrictions)

6. Click "Create"

### Staging Branch (\`staging\`)
1. Click "Add rule" again
2. Enter \`staging\` as the branch name pattern
3. Configure the following settings:

**Protect matching branches**
- ✅ Check "Require a pull request before merging"
- ✅ Check "Require approvals" (set to 1)
- ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
- ❌ Don't check "Require review from code owners"
- ✅ Check "Require status checks to pass before merging"
- ✅ Check "Require branches to be up to date before merging"

**Status checks that are required**
- CI - Continuous Integration
- lint-and-format
- unit-tests
- e2e-tests
- build-verification

**Restrict pushes that create files that match the specified glob patterns**
- Leave empty (no restrictions)

4. Click "Create"

### Develop Branch (\`develop\`)
1. Click "Add rule" again
2. Enter \`develop\` as the branch name pattern
3. Configure the following settings:

**Protect matching branches**
- ✅ Check "Require a pull request before merging"
- ✅ Check "Require approvals" (set to 1)
- ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
- ❌ Don't check "Require review from code owners"
- ✅ Check "Require status checks to pass before merging"
- ✅ Check "Require branches to be up to date before merging"

**Status checks that are required**
- CI - Continuous Integration
- lint-and-format
- unit-tests
- build-verification

**Restrict pushes that create files that match the specified glob patterns**
- Leave empty (no restrictions)

4. Click "Create"

## Code Owners Setup

To enable code owner reviews:

1. Create a \`.github/CODEOWNERS\` file in your repository
2. Add the following content:

\`\`\`
# Global code owners
* @your-username @your-team

# Specific file/directory owners
/src/ @frontend-team
/cdk/ @devops-team
/.github/ @devops-team
\`\`\`

3. Replace \`@your-username\` and \`@your-team\` with actual GitHub usernames or team names

## Verification

After setting up branch protection:

1. Try to push directly to a protected branch
2. Verify that the push is blocked
3. Create a pull request and verify that the required checks run
4. Verify that approvals are required before merging

## Best Practices

- Use descriptive branch names
- Require at least one approval for all branches
- Require more approvals for production branches
- Use code owners for critical parts of the codebase
- Regularly review and update protection rules
EOF
    
    print_success "Branch protection setup guide created!"
}

# Function to display next steps
display_next_steps() {
    print_success "CI/CD Pipeline setup completed!"
    
    echo
    echo "🎉 Your CI/CD pipeline is now configured!"
    echo
    echo "📋 Next steps:"
    echo "1. Configure GitHub secrets (see GITHUB_SECRETS_SETUP.md)"
    echo "2. Set up branch protection rules (see BRANCH_PROTECTION_SETUP.md)"
    echo "3. Push your changes to trigger the first CI run"
    echo "4. Test the staging deployment by pushing to the staging branch"
    echo
    echo "📚 Documentation:"
    echo "- CI_CD_SETUP_README.md - Complete setup and usage guide"
    echo "- GITHUB_SECRETS_SETUP.md - Secrets configuration guide"
    echo "- BRANCH_PROTECTION_SETUP.md - Branch protection setup guide"
    echo
    echo "🔧 Customization:"
    echo "- Review and modify the workflow files in .github/workflows/"
    echo "- Update environment configurations in .github/environments/"
    echo "- Customize the CI/CD configuration in .github/ci-cd-config.yml"
    echo
    echo "🚀 Happy deploying!"
}

# Main execution
main() {
    echo
    echo "🚀 CI/CD Pipeline Setup Script"
    echo "=============================="
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Configure project
    configure_project
    
    # Update configurations
    update_configurations
    
    # Create guides
    create_secrets_guide
    create_branch_protection_guide
    
    # Display next steps
    display_next_steps
}

# Run main function
main "$@"
