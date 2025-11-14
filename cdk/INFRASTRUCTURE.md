# DemoProject Infrastructure Documentation

## Architecture Overview

The DemoProject infrastructure is built using AWS CDK and follows a multi-tier architecture pattern with proper separation of concerns and security best practices.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                INTERNET                                    │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Application Load Balancer (ALB)                         │
│                              Port 80/443                                   │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Public Subnets (AZ1, AZ2)                              │
│                    - ALB Security Group                                   │
│                    - Internet Gateway                                      │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Private Subnets (AZ1, AZ2)                              │
│                   - ECS Fargate Tasks                                     │
│                   - App Security Group                                    │
│                   - NAT Gateway                                           │
└─────────────────────┬─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Isolated Subnets (AZ1, AZ2)                              │
│                  - RDS PostgreSQL                                         │
│                  - ElastiCache Redis                                       │
│                  - Database Security Groups                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Stack Dependencies

```
DemoProject-NetworkStack
         │
         ▼
DemoProject-DatabaseStack
         │
         ▼
DemoProject-ApplicationStack
```

## Resource Details

### NetworkStack Resources

| Resource Type | Name | Description | Configuration |
|---------------|------|-------------|---------------|
| VPC | DemoProjectVPC | Main VPC for the application | CIDR: 10.0.0.0/16, 2 AZs |
| Public Subnets | Public Subnets | Subnets for internet-facing resources | 2 subnets, /24 each |
| Private Subnets | Private Subnets | Subnets for application resources | 2 subnets, /24 each |
| Isolated Subnets | Isolated Subnets | Subnets for database resources | 2 subnets, /24 each |
| Internet Gateway | DemoProjectIGW | Internet connectivity for public subnets | Auto-attached to VPC |
| NAT Gateway | DemoProjectNAT | Internet access for private subnets | Single NAT to reduce costs |
| Security Groups | ALB, App, DB, Redis | Network access controls | Restrictive rules |

### DatabaseStack Resources

| Resource Type | Name | Description | Configuration |
|---------------|------|-------------|---------------|
| RDS Instance | DemoProjectDatabase | PostgreSQL database | T3.micro, 20GB GP3 |
| ElastiCache | DemoProjectRedis | Redis cache cluster | T3.micro, Redis 7 |
| Secrets Manager | DatabaseSecret | Database credentials | Auto-generated password |
| Parameter Group | DatabaseParameterGroup | PostgreSQL settings | Performance optimized |

### ApplicationStack Resources

| Resource Type | Name | Description | Configuration |
|---------------|------|-------------|---------------|
| ECS Cluster | DemoProjectCluster | Container orchestration | Fargate, Container Insights |
| ECR Repository | DemoProjectRepository | Docker image storage | Image scanning enabled |
| Task Definition | DemoProjectTaskDef | Container specification | 512MB RAM, 256 CPU units |
| Fargate Service | DemoProjectService | Application service | 2-10 tasks, auto-scaling |
| Load Balancer | DemoProjectALB | Traffic distribution | HTTP/80, health checks |
| Auto Scaling | CPU/Memory Scaling | Automatic scaling | 70% CPU, 80% Memory |

## Security Architecture

### Network Security
- **VPC Isolation**: All resources run within private VPC
- **Subnet Segmentation**: Public, private, and isolated subnets
- **Security Groups**: Restrictive access controls between tiers
- **NAT Gateway**: Controlled internet access for private resources

### Data Security
- **Encryption at Rest**: RDS and Redis encryption enabled
- **Encryption in Transit**: TLS for database connections
- **Secrets Management**: Credentials stored in AWS Secrets Manager
- **IAM Roles**: Least privilege access for ECS tasks

### Application Security
- **Container Security**: ECR image scanning enabled
- **Health Checks**: ALB health checks with custom endpoint
- **Logging**: Centralized CloudWatch logging
- **Monitoring**: Container Insights and Performance Insights

## Deployment Process

### 1. Prerequisites
```bash
# Install AWS CLI and configure credentials
aws configure

# Install CDK globally
npm install -g aws-cdk

# Install project dependencies
cd cdk
npm install
```

### 2. Bootstrap CDK
```bash
# First time only - creates CDK toolkit stack
cdk bootstrap
```

### 3. Build and Deploy
```bash
# Build the project
npm run build

# Deploy all stacks
cdk deploy --all

# Or deploy individually
cdk deploy DemoProject-NetworkStack
cdk deploy DemoProject-DatabaseStack
cdk deploy DemoProject-ApplicationStack
```

### 4. Verify Deployment
```bash
# List all stacks
cdk list

# Check stack outputs
cdk list-exports

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name DemoProject-NetworkStack
```

## Environment Variables

### Application Environment Variables
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
```

### CDK Environment Variables
```bash
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-1
```

## Monitoring and Observability

### CloudWatch Metrics
- **ECS Metrics**: CPU, Memory, Network, Storage
- **RDS Metrics**: CPU, Memory, Storage, Connections
- **ALB Metrics**: Request count, latency, error rates
- **Custom Metrics**: Application-specific business metrics

### Logging Strategy
- **ECS Logs**: Container logs in CloudWatch Logs
- **RDS Logs**: Database logs in CloudWatch Logs
- **ALB Logs**: Access logs in S3 (optional)
- **Application Logs**: Structured JSON logging

### Health Checks
- **ALB Health Checks**: HTTP GET /api/health
- **ECS Health Checks**: Container-level health monitoring
- **RDS Health Checks**: Database connectivity tests

## Cost Optimization

### Development Environment
- **Instance Types**: T3.micro for all resources
- **Storage**: 20GB GP3 for RDS, minimal Redis
- **Auto Scaling**: 2-10 ECS tasks
- **NAT Gateway**: Single NAT to reduce costs

### Production Environment
- **Instance Types**: T3.small or larger based on load
- **Storage**: Larger RDS storage with auto-scaling
- **Multi-AZ**: Enable for high availability
- **Reserved Instances**: Consider for predictable workloads

## Disaster Recovery

### Backup Strategy
- **RDS Backups**: Automated daily backups, 7-day retention
- **EBS Snapshots**: Point-in-time recovery capability
- **S3 Backups**: Application data backups (if applicable)

### Recovery Procedures
1. **Database Recovery**: Restore from RDS snapshot
2. **Application Recovery**: Redeploy from ECR images
3. **Infrastructure Recovery**: Redeploy CDK stacks
4. **Data Recovery**: Restore from S3 backups

## Compliance and Governance

### AWS Well-Architected Framework
- **Operational Excellence**: Automated deployments, monitoring
- **Security**: VPC isolation, encryption, IAM roles
- **Reliability**: Multi-AZ, auto-scaling, health checks
- **Performance Efficiency**: Load balancing, caching, optimization
- **Cost Optimization**: Right-sizing, auto-scaling, cost monitoring

### Security Best Practices
- **Principle of Least Privilege**: Minimal IAM permissions
- **Defense in Depth**: Multiple security layers
- **Secure by Default**: Encryption enabled, public access disabled
- **Regular Auditing**: CloudTrail, Config, Security Hub

## Troubleshooting Guide

### Common Issues

#### 1. CDK Bootstrap Issues
```bash
# Check if CDK is bootstrapped
aws cloudformation describe-stacks --stack-name CDKToolkit

# Bootstrap if needed
cdk bootstrap
```

#### 2. VPC Limits
```bash
# Check VPC limits
aws ec2 describe-account-attributes --attribute-names max-instances

# Request limit increase if needed
aws service-quotas request-service-quota-increase --service-code vpc --quota-code L-F678F1CE
```

#### 3. ECS Service Issues
```bash
# Check service status
aws ecs describe-services --cluster demoproject-cluster --services demoproject-service

# View service events
aws ecs describe-services --cluster demoproject-cluster --services demoproject-service --query 'services[0].events'
```

#### 4. Database Connection Issues
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier demoproject-database

# Test connectivity from ECS task
aws ecs execute-command --cluster demoproject-cluster --task <task-id> --container demoproject-app --command "/bin/bash" --interactive
```

### Debug Commands
```bash
# View CloudFormation template
cdk synth

# Check stack differences
cdk diff

# View stack outputs
cdk list-exports

# Monitor deployment
cdk deploy --all --require-approval never --progress events
```

## Future Enhancements

### Planned Improvements
1. **CI/CD Pipeline**: GitHub Actions or AWS CodePipeline
2. **Monitoring Dashboard**: CloudWatch custom dashboards
3. **Alerting**: SNS notifications for critical events
4. **Cost Monitoring**: AWS Cost Explorer integration
5. **Security Scanning**: AWS Security Hub integration

### Scalability Considerations
1. **Multi-Region**: Global load balancing with Route 53
2. **CDN**: CloudFront for static content delivery
3. **Microservices**: Break down into smaller services
4. **Event-Driven**: SQS, SNS, EventBridge integration
5. **Serverless**: Lambda functions for specific use cases

## Support and Maintenance

### Regular Maintenance Tasks
- **Security Updates**: Regular dependency updates
- **Monitoring Review**: Monthly performance analysis
- **Cost Review**: Monthly cost optimization review
- **Backup Testing**: Quarterly backup restoration tests
- **Security Auditing**: Quarterly security review

### Contact Information
- **Development Team**: [team@company.com]
- **DevOps Team**: [devops@company.com]
- **Security Team**: [security@company.com]
- **AWS Support**: [support case number]

---

*This document is maintained by the DevOps team and should be updated with any infrastructure changes.*
