# DemoProject AWS CDK Infrastructure

This directory contains the AWS CDK (Cloud Development Kit) code for deploying the DemoProject infrastructure on AWS.

## Architecture Overview

The infrastructure is organized into three main stacks:

### 1. NetworkStack (`DemoProject-NetworkStack`)
- **VPC** with public, private, and isolated subnets across 2 AZs
- **Security Groups** for ALB, application servers, database, and Redis
- **NAT Gateway** for private subnet internet access
- **Route Tables** and **Internet Gateway** configuration

### 2. DatabaseStack (`DemoProject-DatabaseStack`)
- **RDS PostgreSQL** instance in isolated subnets
- **ElastiCache Redis** cluster for caching
- **Secrets Manager** for database credentials
- **Parameter Groups** with optimized PostgreSQL settings

### 3. ApplicationStack (`DemoProject-ApplicationStack`)
- **ECS Fargate** cluster for containerized Next.js application
- **Application Load Balancer** with health checks
- **ECR Repository** for Docker images
- **Auto Scaling** based on CPU and memory utilization
- **CloudWatch Logs** and **Container Insights**

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 18+ and **npm**
3. **AWS CDK CLI** installed globally: `npm install -g aws-cdk`
4. **Docker** for building and testing container images

## Setup Instructions

### 1. Install Dependencies
```bash
cd cdk
npm install
```

### 2. Bootstrap CDK (First time only)
```bash
cdk bootstrap
```

### 3. Build the Project
```bash
npm run build
```

### 4. Synthesize CloudFormation Templates
```bash
cdk synth
```

### 5. Deploy Infrastructure
```bash
# Deploy all stacks
cdk deploy --all

# Deploy specific stack
cdk deploy DemoProject-NetworkStack
cdk deploy DemoProject-DatabaseStack
cdk deploy DemoProject-ApplicationStack
```

## Environment Configuration

### Development
```bash
export CDK_DEFAULT_ACCOUNT=your-aws-account-id
export CDK_DEFAULT_REGION=us-east-1
```

### Production
```bash
export CDK_DEFAULT_ACCOUNT=your-production-account-id
export CDK_DEFAULT_REGION=us-west-2
```

## Useful Commands

```bash
# List all stacks
cdk list

# View stack differences
cdk diff

# Destroy infrastructure
cdk destroy --all

# View stack outputs
cdk list-exports

# Execute commands on ECS tasks
aws ecs execute-command --cluster demoproject-cluster --task <task-id> --container demoproject-app --command "/bin/bash" --interactive
```

## Security Features

- **VPC Isolation**: Application runs in private subnets
- **Security Groups**: Restrictive access controls
- **Encryption**: RDS and Redis encryption at rest and in transit
- **IAM Roles**: Least privilege access for ECS tasks
- **Secrets Management**: Database credentials stored in Secrets Manager

## Monitoring and Logging

- **CloudWatch Logs**: Centralized logging for all containers
- **Container Insights**: Enhanced monitoring for ECS
- **Performance Insights**: Database performance monitoring
- **Health Checks**: ALB health checks with custom endpoint

## Cost Optimization

- **NAT Gateway**: Single NAT Gateway to reduce costs
- **Instance Types**: T3.micro for development (upgrade for production)
- **Auto Scaling**: Scale down during low usage periods
- **Reserved Instances**: Consider for production workloads

## Production Considerations

1. **Multi-AZ**: Enable RDS Multi-AZ for high availability
2. **Backup Retention**: Increase backup retention period
3. **Deletion Protection**: Enable deletion protection for critical resources
4. **Monitoring**: Set up CloudWatch alarms and notifications
5. **Security**: Review and restrict IAM permissions
6. **Compliance**: Ensure infrastructure meets compliance requirements

## Troubleshooting

### Common Issues

1. **VPC Limits**: Check VPC and subnet limits in your AWS account
2. **IAM Permissions**: Ensure CDK execution role has sufficient permissions
3. **Docker Build**: Verify Dockerfile and image build process
4. **Health Checks**: Check ALB target group health status

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster demoproject-cluster --services demoproject-service

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /ecs/demoproject

# Check RDS status
aws rds describe-db-instances --db-instance-identifier demoproject-database
```

## Contributing

1. Follow the existing code structure
2. Add appropriate tests for new constructs
3. Update documentation for any changes
4. Use meaningful commit messages
5. Test changes in development environment first

## License

This project is licensed under the MIT License.
