# CI/CD Pipeline Setup Guide

This document provides comprehensive instructions for setting up and managing the CI/CD pipeline for the DemoProject learning management system.

## 🚀 Overview

The CI/CD pipeline is built using GitHub Actions and provides:
- **Continuous Integration**: Automated testing, linting, and code quality checks
- **Continuous Deployment**: Automated deployment to staging and production environments
- **Infrastructure as Code**: AWS CDK deployment and management
- **Security Scanning**: Vulnerability detection and compliance checking
- **Monitoring & Alerting**: Health checks and performance monitoring
- **Rollback Capabilities**: Automatic and manual rollback procedures

## 📁 File Structure

```
.github/
├── workflows/
│   ├── ci.yml                           # Continuous Integration pipeline
│   ├── deploy-staging.yml               # Staging deployment workflow
│   ├── deploy-production.yml            # Production deployment workflow
│   └── infrastructure-maintenance.yml   # Infrastructure maintenance tasks
├── environments/
│   ├── staging.yml                      # Staging environment configuration
│   └── production.yml                   # Production environment configuration
└── ci-cd-config.yml                     # Centralized CI/CD configuration
```

## 🔧 Prerequisites

### 1. GitHub Repository Setup
- Repository with GitHub Actions enabled
- Branch protection rules configured
- Required secrets configured (see [Secrets Configuration](#secrets-configuration))

### 2. AWS Infrastructure
- AWS account with appropriate permissions
- CDK bootstrap completed in target regions
- ECR repositories created for container images
- ECS clusters and services configured

### 3. Required Tools
- Node.js 18+ and npm 9+
- AWS CLI configured with appropriate credentials
- Docker for container builds
- Playwright for E2E testing

## 🔐 Secrets Configuration

Configure the following secrets in your GitHub repository:

### AWS Credentials
```bash
AWS_ACCESS_KEY_ID          # AWS access key for deployment
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployment
AWS_ROLE_ARN              # AWS role ARN for cross-account access
```

### Security Tools
```bash
SNYK_TOKEN                 # Snyk API token for security scanning
```

### Notifications (Optional)
```bash
SLACK_WEBHOOK             # Slack webhook for deployment notifications
TEAMS_WEBHOOK             # Microsoft Teams webhook for notifications
```

## 🚀 Pipeline Workflows

### 1. Continuous Integration (CI)

**Trigger**: Every push and pull request to `main`, `develop`, and `staging` branches

**Jobs**:
- **Lint and Format**: Code quality and formatting checks
- **Unit Tests**: Jest-based unit testing with coverage reporting
- **E2E Tests**: Playwright-based end-to-end testing
- **Security Scan**: Vulnerability scanning with npm audit and Snyk
- **Build Verification**: Application build and Docker image verification
- **Infrastructure Validation**: CDK validation and diff checking
- **Performance Test**: Lighthouse-based performance testing (PR only)

### 2. Staging Deployment

**Trigger**: Push to `staging` branch or manual workflow dispatch

**Stages**:
1. **Infrastructure Deployment**: Deploy CDK stacks to staging
2. **Application Deployment**: Build and deploy Docker image to ECS
3. **Staging Tests**: Run E2E tests against staging environment
4. **Health Check**: Verify application health and monitoring

### 3. Production Deployment

**Trigger**: Push to `main` branch or manual workflow dispatch

**Stages**:
1. **Pre-deployment Checks**: Security scans and infrastructure validation
2. **Manual Approval**: Required approval for production deployments
3. **Infrastructure Deployment**: Deploy CDK stacks to production
4. **Application Deployment**: Build and deploy Docker image to ECS
5. **Smoke Tests**: Critical E2E tests against production
6. **Health Check**: Comprehensive health verification
7. **Rollback**: Automatic rollback if issues detected

### 4. Infrastructure Maintenance

**Trigger**: Weekly schedule (Sundays at 2 AM UTC) or manual dispatch

**Tasks**:
- Security updates and vulnerability scanning
- Dependency updates and automated PR creation
- Backup verification and data integrity checks
- Performance analysis and optimization recommendations
- Cost optimization and resource cleanup
- Infrastructure health monitoring

## 🌍 Environment Configuration

### Staging Environment
- **Branch**: `staging`
- **Auto-deploy**: ✅ Enabled
- **Required Reviews**: 1
- **URL**: `https://staging.yourdomain.com`
- **Protection**: Basic branch protection

### Production Environment
- **Branch**: `main`
- **Auto-deploy**: ❌ Disabled (manual approval required)
- **Required Reviews**: 2 + code owner approval
- **URL**: `https://yourdomain.com`
- **Protection**: Strict branch protection with rollback

## 🔄 Deployment Strategies

### Blue-Green Deployment
- Zero-downtime deployments
- Automatic rollback on failure
- Traffic shifting between versions
- Health check verification

### Rollback Procedures
- **Automatic Rollback**: Triggered by health check failures
- **Manual Rollback**: Available through GitHub Actions
- **Rollback Verification**: Health checks and smoke tests

## 📊 Monitoring and Alerting

### Health Checks
- Application health endpoint (`/api/health`)
- Database connectivity verification
- Infrastructure status monitoring

### Metrics
- Response time monitoring (threshold: 2000ms)
- Error rate tracking (threshold: 5%)
- Availability monitoring (threshold: 99.9%)

### Alerts
- Deployment failures (Slack/Teams)
- Health check failures (Critical priority)
- Performance degradation (Medium priority)

## 🛡️ Security Features

### Vulnerability Scanning
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Advanced security analysis
- **Trivy**: Container image scanning

### Security Policies
- Block deployment with high-severity vulnerabilities
- Secrets detection and prevention
- License compliance checking

### Access Control
- Role-based deployment permissions
- Environment-specific protection rules
- Manual approval for production deployments

## 📈 Performance Testing

### Lighthouse CI
- Performance score threshold: 90
- Accessibility score threshold: 95
- Best practices score threshold: 90
- SEO score threshold: 90

### Load Testing
- Automated performance testing on PRs
- Response time monitoring
- Resource utilization tracking

## 🔧 Customization

### Environment Variables
Modify environment-specific variables in the workflow files:
```yaml
env:
  NODE_VERSION: '18'
  AWS_REGION: 'us-east-1'
  STAGING_DOMAIN: 'staging.yourdomain.com'
  PRODUCTION_DOMAIN: 'yourdomain.com'
```

### Deployment Branches
Update branch protection rules in environment files:
```yaml
deployment_branches:
  - main
  - staging
  - develop
```

### Notification Channels
Configure notification webhooks in the CI/CD config:
```yaml
notifications:
  channels:
    - name: slack
      webhook: ${{ secrets.SLACK_WEBHOOK }}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Failures
- Check AWS credentials and permissions
- Verify CDK bootstrap status
- Review CloudWatch logs for ECS services

#### 2. Test Failures
- Ensure all dependencies are installed
- Check Playwright browser installation
- Verify test environment configuration

#### 3. Infrastructure Validation Errors
- Run `npm run validate` locally in the `cdk` directory
- Check CDK version compatibility
- Verify AWS region configuration

### Debug Mode
Run workflows with debug information:
```bash
# Enable debug logging
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

### Local Testing
Test workflows locally using [act](https://github.com/nektos/act):
```bash
# Install act
brew install act

# Run CI workflow locally
act push
```

## 📚 Best Practices

### 1. Branch Strategy
- Use feature branches for development
- Merge to `develop` for integration testing
- Promote to `staging` for pre-production testing
- Deploy to `production` from `main` only

### 2. Testing Strategy
- Maintain high test coverage (>80%)
- Run E2E tests in staging before production
- Use smoke tests for production validation
- Implement performance testing in CI

### 3. Security Practices
- Regular dependency updates
- Automated security scanning
- Principle of least privilege for AWS roles
- Regular security audits and reviews

### 4. Monitoring Strategy
- Comprehensive health checks
- Real-time alerting
- Performance metrics tracking
- Cost monitoring and optimization

## 🔄 Maintenance and Updates

### Regular Tasks
- **Weekly**: Infrastructure maintenance and security updates
- **Monthly**: Dependency updates and performance reviews
- **Quarterly**: Security audits and compliance checks

### Update Procedures
1. Test updates in development environment
2. Deploy to staging for validation
3. Schedule production deployment during maintenance windows
4. Monitor closely after deployment

## 📞 Support and Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)

### Tools
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [Docker Documentation](https://docs.docker.com/)

### Community
- GitHub Actions community discussions
- AWS CDK community forums
- Playwright community support

## 📝 Changelog

### Version 1.0.0
- Initial CI/CD pipeline setup
- GitHub Actions workflows
- AWS CDK integration
- Comprehensive testing suite
- Security scanning integration
- Monitoring and alerting setup

---

**Note**: This CI/CD pipeline is designed for production use but should be thoroughly tested in your specific environment before deployment. Always review and customize the configuration according to your organization's requirements and security policies.
