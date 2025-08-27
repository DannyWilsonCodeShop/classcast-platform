# 🚀 AWS Production Deployment Guide for ClassCast

## 📋 Prerequisites

- ✅ Node.js v18+ (You have v24.6.0)
- ✅ npm (You have v11.5.1)
- ✅ AWS CDK v2 (You have v2.1025.0)
- 🔄 AWS CLI (Installation in progress)

## 🔧 Step 1: Complete AWS CLI Setup

### After restarting your terminal, verify AWS CLI:
```bash
aws --version
```

### Configure AWS credentials:
```bash
aws configure
```

**You'll need:**
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., `us-east-1`)
- Default output format (press Enter for `json`)

## 🔑 Step 2: Get AWS Credentials

1. **Go to [AWS Console](https://console.aws.amazon.com)**
2. **Navigate to IAM → Users**
3. **Create new user** or use existing one
4. **Attach policies:**
   - `AdministratorAccess` (for development)
   - Or create custom policy with required permissions
5. **Create Access Keys** and download CSV file
6. **Use these credentials** in `aws configure`

## 🚀 Step 3: Deploy Infrastructure

### Navigate to CDK directory:
```bash
cd cdk
```

### Install dependencies:
```bash
npm install
```

### Bootstrap CDK (first time only):
```bash
npm run bootstrap
```

### Deploy all infrastructure:
```bash
npm run deploy:all
```

## 🏗️ Infrastructure Components

Your CDK will deploy:

- **Network Stack**: VPC, subnets, security groups
- **Storage Stack**: S3 buckets for videos and assets
- **Auth Stack**: Cognito User Pools and Identity Pools
- **Database Stack**: RDS PostgreSQL database
- **API Gateway Stack**: REST API endpoints
- **Application Stack**: ECS Fargate containers
- **Monitoring Stack**: CloudWatch dashboards and alarms
- **Logging Stack**: Centralized logging with Kinesis

## 🔄 Step 4: Update Environment Variables

After deployment, update your `.env.local`:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_USER_POOL_ID=<from CDK output>
AWS_CLIENT_ID=<from CDK output>
AWS_IDENTITY_POOL_ID=<from CDK output>

# Database
DATABASE_URL=<from CDK output>

# S3
S3_BUCKET_NAME=<from CDK output>

# API Gateway
API_ENDPOINT=<from CDK output>
```

## 🧪 Step 5: Test Production Setup

### Switch from Mock to Cognito:
1. Update `src/contexts/AuthContext.tsx`
2. Replace mock service with `CognitoAuthService`
3. Update API routes to use Cognito

### Deploy to production:
```bash
npm run build
npm run start
```

## 🚨 Important Security Notes

- **Never commit** AWS credentials to Git
- **Use IAM roles** instead of access keys in production
- **Enable MFA** on your AWS account
- **Review security groups** and network access
- **Monitor costs** in AWS Cost Explorer

## 🔍 Troubleshooting

### Common Issues:

1. **CDK Bootstrap Error:**
   ```bash
   npm run bootstrap
   ```

2. **Permission Denied:**
   - Check IAM policies
   - Verify AWS credentials

3. **VPC Limits:**
   - Request limit increase in AWS Support

4. **Cost Monitoring:**
   - Set up billing alerts
   - Use AWS Cost Explorer

## 📞 Support

- **AWS Documentation**: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **CDK Documentation**: [docs.aws.amazon.com/cdk](https://docs.aws.amazon.com/cdk)
- **AWS Support**: Available in AWS Console

## 🎯 Next Steps

1. Complete AWS CLI setup
2. Get AWS credentials
3. Deploy infrastructure
4. Update environment variables
5. Test production authentication
6. Monitor and optimize

---

**Ready to deploy?** Follow the steps above and let me know if you encounter any issues! 🚀



