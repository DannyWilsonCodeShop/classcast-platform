#!/bin/bash
# Monitoring and Logging Setup Script
# This script helps configure the monitoring and logging infrastructure

set -e

# Color codes for output
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
        print_error "Input cannot be empty"
        return 1
    fi
    return 0
}

# Function to get user input with validation
get_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        input=${input:-$default}
    else
        read -p "$prompt: " input
    fi
    
    if validate_input "$input"; then
        echo "$input"
    else
        get_input "$prompt" "$default"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        print_status "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command_exists cdk; then
        print_error "AWS CDK is not installed. Please install it first."
        print_status "Run: npm install -g aws-cdk"
        exit 1
    fi
    
    # Check if CDK is bootstrapped
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit >/dev/null 2>&1; then
        print_warning "CDK is not bootstrapped. This will be done during deployment."
    fi
    
    print_success "Prerequisites check passed"
}

# Function to configure environment
configure_environment() {
    print_status "Configuring monitoring and logging environment..."
    
    # Get environment type
    ENVIRONMENT=$(get_input "Enter environment type" "development")
    case $ENVIRONMENT in
        development|staging|production)
            print_success "Environment set to: $ENVIRONMENT"
            ;;
        *)
            print_error "Invalid environment. Must be development, staging, or production"
            exit 1
            ;;
    esac
    
    # Get AWS region
    AWS_REGION=$(get_input "Enter AWS region" "us-east-1")
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_status "AWS Account ID: $AWS_ACCOUNT_ID"
    
    # Get domain information
    if [ "$ENVIRONMENT" = "production" ]; then
        PRODUCTION_DOMAIN=$(get_input "Enter production domain (e.g., yourdomain.com)")
        STAGING_DOMAIN="staging.$PRODUCTION_DOMAIN"
    else
        STAGING_DOMAIN=$(get_input "Enter staging domain (e.g., staging.yourdomain.com)")
        PRODUCTION_DOMAIN=$(echo "$STAGING_DOMAIN" | sed 's/^staging\.//')
    fi
    
    # Get external service configurations
    print_status "External service configurations (optional):"
    
    SENTRY_DSN=$(get_input "Enter Sentry DSN (optional)" "")
    DATADOG_API_KEY=$(get_input "Enter DataDog API key (optional)" "")
    NEW_RELIC_LICENSE_KEY=$(get_input "Enter New Relic license key (optional)" "")
    
    # Create environment file
    create_environment_file
}

# Function to create environment file
create_environment_file() {
    print_status "Creating environment configuration file..."
    
    cat > .env.monitoring << EOF
# Monitoring and Logging Environment Configuration
# Generated on: $(date)

# Required Environment Variables
ENVIRONMENT=$ENVIRONMENT
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID

# Domain Configuration
PRODUCTION_DOMAIN=$PRODUCTION_DOMAIN
STAGING_DOMAIN=$STAGING_DOMAIN

# External Service Integrations
SENTRY_DSN=$SENTRY_DSN
DATADOG_API_KEY=$DATADOG_API_KEY
NEW_RELIC_LICENSE_KEY=$NEW_RELIC_LICENSE_KEY

# CDK Configuration
CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID
CDK_DEFAULT_REGION=$AWS_REGION
EOF
    
    print_success "Environment file created: .env.monitoring"
}

# Function to create deployment script
create_deployment_script() {
    print_status "Creating deployment script..."
    
    cat > scripts/deploy-monitoring.sh << 'EOF'
#!/bin/bash
# Monitoring and Logging Deployment Script

set -e

# Load environment variables
if [ -f .env.monitoring ]; then
    export $(cat .env.monitoring | grep -v '^#' | xargs)
fi

# Check if environment variables are set
if [ -z "$ENVIRONMENT" ] || [ -z "$AWS_REGION" ] || [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: Required environment variables not set. Please run setup-monitoring.sh first."
    exit 1
fi

echo "Deploying monitoring and logging infrastructure for environment: $ENVIRONMENT"

# Change to CDK directory
cd cdk

# Install dependencies
echo "Installing CDK dependencies..."
npm install

# Build CDK
echo "Building CDK..."
npm run build

# Deploy monitoring stack
echo "Deploying monitoring stack..."
cdk deploy DemoProject-MonitoringStack --require-approval never

# Deploy logging stack
echo "Deploying logging stack..."
cdk deploy DemoProject-LoggingStack --require-approval never

# Deploy error tracking stack
echo "Deploying error tracking stack..."
cdk deploy DemoProject-ErrorTrackingStack --require-approval never

echo "Monitoring and logging infrastructure deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Check CloudWatch dashboards in AWS Console"
echo "2. Verify SNS topics and subscriptions"
echo "3. Test error reporting endpoints"
echo "4. Configure external service integrations"
EOF
    
    chmod +x scripts/deploy-monitoring.sh
    print_success "Deployment script created: scripts/deploy-monitoring.sh"
}

# Function to create monitoring configuration guide
create_monitoring_guide() {
    print_status "Creating monitoring configuration guide..."
    
    cat > MONITORING_SETUP_GUIDE.md << EOF
# Monitoring and Logging Setup Guide

## Environment Configuration

Your monitoring and logging environment has been configured with the following settings:

- **Environment**: $ENVIRONMENT
- **AWS Region**: $AWS_REGION
- **AWS Account ID**: $AWS_ACCOUNT_ID
- **Production Domain**: $PRODUCTION_DOMAIN
- **Staging Domain**: $STAGING_DOMAIN

## External Service Integrations

### Sentry
- **DSN**: ${SENTRY_DSN:-Not configured}
- **Purpose**: Error tracking and performance monitoring
- **Setup**: Visit https://sentry.io to create a project and get your DSN

### DataDog
- **API Key**: ${DATADOG_API_KEY:-Not configured}
- **Purpose**: Application performance monitoring
- **Setup**: Visit https://datadoghq.com to create an account and get your API key

### New Relic
- **License Key**: ${NEW_RELIC_LICENSE_KEY:-Not configured}
- **Purpose**: Application performance monitoring
- **Setup**: Visit https://newrelic.com to create an account and get your license key

## Deployment

To deploy the monitoring and logging infrastructure:

1. **Set environment variables**:
   \`\`\`bash
   source .env.monitoring
   \`\`\`

2. **Deploy infrastructure**:
   \`\`\`bash
   ./scripts/deploy-monitoring.sh
   \`\`\`

## Post-Deployment Configuration

### 1. CloudWatch Dashboards
- Application Dashboard: \`DemoProject-Application-$ENVIRONMENT\`
- Infrastructure Dashboard: \`DemoProject-Infrastructure-$ENVIRONMENT\`
- Security Dashboard: \`DemoProject-Security-$ENVIRONMENT\`
- Error Dashboard: \`DemoProject-Errors-$ENVIRONMENT\`
- Performance Dashboard: \`DemoProject-Performance-$ENVIRONMENT\`

### 2. SNS Topics
- Monitoring Topic: \`DemoProject-Monitoring-$ENVIRONMENT\`
- Critical Alerts Topic: \`DemoProject-CriticalAlerts-$ENVIRONMENT\`
- Error Tracking Topic: \`DemoProject-ErrorTracking-$ENVIRONMENT\`
- Performance Monitoring Topic: \`DemoProject-PerformanceMonitoring-$ENVIRONMENT\`

### 3. Log Groups
- Central Log Group: \`/DemoProject/Central/$ENVIRONMENT\`
- Application Log Group: \`/DemoProject/Application/$ENVIRONMENT\`
- Database Log Group: \`/DemoProject/Database/$ENVIRONMENT\`
- Security Log Group: \`/DemoProject/Security/$ENVIRONMENT\`
- Performance Log Group: \`/DemoProject/Performance/$ENVIRONMENT\`

### 4. Lambda Functions
- Error Aggregator: \`DemoProject-ErrorAggregator-$ENVIRONMENT\`
- Performance Analyzer: \`DemoProject-PerformanceAnalyzer-$ENVIRONMENT\`
- Log Processor: \`DemoProject-LogProcessor-$ENVIRONMENT\`

## Testing

### Test Error Reporting
\`\`\`bash
# Test error reporting endpoint
curl -X POST https://your-api-gateway-url/prod/errors \\
  -H "Content-Type: application/json" \\
  -d '{
    "errorType": "ValidationError",
    "errorMessage": "Invalid input",
    "severity": "MEDIUM",
    "endpoint": "/api/test",
    "method": "POST"
  }'
\`\`\`

### Test Performance Monitoring
\`\`\`bash
# Test performance monitoring endpoint
curl -X POST https://your-api-gateway-url/prod/performance \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpoint": "/api/test",
    "method": "GET",
    "responseTime": 150,
    "statusCode": 200
  }'
\`\`\`

## Monitoring and Maintenance

### Daily Tasks
- Review CloudWatch dashboards
- Check alarm status
- Monitor error rates and performance metrics

### Weekly Tasks
- Review log insights queries
- Analyze performance trends
- Check S3 log archive lifecycle

### Monthly Tasks
- Review and adjust alarm thresholds
- Analyze cost optimization opportunities
- Review external service integrations

## Troubleshooting

### Common Issues

1. **High Error Rate**
   - Check application logs for specific errors
   - Review recent deployments
   - Check database connectivity

2. **High Response Time**
   - Review database performance
   - Check ECS service health
   - Analyze API Gateway metrics

3. **Log Processing Issues**
   - Check Kinesis stream status
   - Verify Firehose delivery
   - Check S3 bucket permissions

### Debug Commands

\`\`\`bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/DemoProject"

# Check Kinesis stream status
aws kinesis describe-stream --stream-name DemoProject-LogProcessing-$ENVIRONMENT

# Check S3 log archive
aws s3 ls s3://demoproject-logs-$ENVIRONMENT-$AWS_ACCOUNT_ID/logs/

# Check CloudWatch alarms
aws cloudwatch describe-alarms --alarm-names-prefix "DemoProject"
\`\`\`

## Support

For issues or questions:
1. Check CloudWatch logs and dashboards
2. Review this documentation
3. Check AWS documentation
4. Contact the development team

## Cost Optimization

### Estimated Monthly Costs
- **CloudWatch Metrics**: ~$15-30/month
- **CloudWatch Logs**: ~$10-50/month (depending on log volume)
- **Kinesis**: ~$10-40/month
- **S3 Storage**: ~$5-20/month
- **Lambda**: ~$5-15/month

### Optimization Tips
1. Use appropriate log retention periods
2. Implement log filtering and sampling
3. Use metric aggregation
4. Monitor and adjust resources based on usage

---

*This guide was generated automatically by the monitoring setup script.*
EOF
    
    print_success "Monitoring configuration guide created: MONITORING_SETUP_GUIDE.md"
}

# Function to display next steps
display_next_steps() {
    print_success "Monitoring and logging setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the configuration in .env.monitoring"
    echo "2. Read MONITORING_SETUP_GUIDE.md for detailed instructions"
    echo "3. Deploy the infrastructure: ./scripts/deploy-monitoring.sh"
    echo "4. Configure external service integrations (Sentry, DataDog, New Relic)"
    echo "5. Test the monitoring and logging systems"
    echo ""
    echo "Files created:"
    echo "- .env.monitoring (environment configuration)"
    echo "- scripts/deploy-monitoring.sh (deployment script)"
    echo "- MONITORING_SETUP_GUIDE.md (setup guide)"
    echo ""
    echo "To deploy the infrastructure:"
    echo "source .env.monitoring && ./scripts/deploy-monitoring.sh"
}

# Main function
main() {
    echo "=========================================="
    echo "  DemoProject Monitoring & Logging Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Configure environment
    configure_environment
    
    # Create deployment script
    create_deployment_script
    
    # Create monitoring guide
    create_monitoring_guide
    
    # Display next steps
    display_next_steps
}

# Run main function
main "$@"
