# 🚀 AWS Quick Start - ClassCast Production

## ⚡ **5-Minute Setup Checklist**

### **1. Restart Terminal** (After AWS CLI install)
```bash
# Verify installations
aws --version
cdk --version
```

### **2. Configure AWS**
```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

### **3. Deploy Infrastructure**
```bash
# Option A: Use automated script
deploy-to-aws.bat

# Option B: Manual deployment
cd cdk
npm install
npm run bootstrap
npm run deploy:all
```

### **4. Setup Environment**
```bash
# Use automated script
setup-env.bat

# Or manually create .env.local with CDK outputs
```

### **5. Test Production**
```bash
npm run build
npm run start
```

## 🔑 **Required AWS Permissions**

- **AdministratorAccess** (for development)
- **Or custom policy** with:
  - CloudFormation
  - IAM
  - VPC
  - ECS
  - S3
  - RDS
  - Cognito
  - API Gateway
  - CloudWatch
  - Lambda

## 💰 **Estimated Costs (Monthly)**

- **VPC & Networking**: $0-5
- **ECS Fargate**: $15-30
- **RDS PostgreSQL**: $25-50
- **S3 Storage**: $0.023/GB
- **CloudWatch**: $0.50-2
- **API Gateway**: $3.50 + $0.0001/request
- **Cognito**: $0.0055/user/month

**Total: ~$50-100/month** (depending on usage)

## 🚨 **Critical Security Steps**

1. **Enable MFA** on AWS account
2. **Set up billing alerts**
3. **Review security groups**
4. **Monitor access logs**
5. **Regular security audits**

## 🔍 **Troubleshooting Commands**

```bash
# Check CDK status
cdk list

# View stack outputs
cdk list-exports

# Check AWS identity
aws sts get-caller-identity

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name <stack-name>
```

## 📞 **Need Help?**

- **AWS Support**: Available in console
- **CDK Docs**: [docs.aws.amazon.com/cdk](https://docs.aws.amazon.com/cdk)
- **Community**: AWS Developer Forums

---

**Ready to deploy?** Run `deploy-to-aws.bat` and follow the prompts! 🚀




