# 🛡️ AWS Services Recovery & Prevention Guide

## Current Status: ✅ HEALTHY
- **DynamoDB**: 5/5 tables ACTIVE
- **S3 Bucket**: Accessible
- **Environment Variables**: Correctly configured
- **Cognito**: User Pool active

---

## 🚨 Common Causes of AWS Service Disconnections

### 1. **Environment Variable Changes**
- **Cause**: `.env.local` file gets overwritten or deleted
- **Prevention**: Keep backup of configuration
- **Recovery**: Run `node update-cognito-env.js`

### 2. **AWS Credentials Expiration**
- **Cause**: AWS CLI credentials expire or are revoked
- **Prevention**: Use IAM roles instead of access keys
- **Recovery**: Reconfigure AWS credentials

### 3. **Resource Deletion**
- **Cause**: Someone accidentally deletes AWS resources
- **Prevention**: Enable deletion protection on critical resources
- **Recovery**: Restore from backups or recreate resources

### 4. **Region/Account Changes**
- **Cause**: AWS region or account changes
- **Prevention**: Document all resource locations
- **Recovery**: Update configuration to match new region/account

---

## 🔧 Quick Recovery Commands

### Check Service Health
```bash
node connection-safeguards.js
```

### Fix Environment Variables
```bash
node update-cognito-env.js
```

### Verify DynamoDB Tables
```bash
aws dynamodb list-tables --query 'TableNames[?contains(@, `classcast`)]'
```

### Check Cognito User Pool
```bash
aws cognito-idp describe-user-pool --user-pool-id us-east-1_uK50qBrap
```

### Verify S3 Bucket
```bash
aws s3 ls s3://classcast-videos-463470937777-us-east-1/
```

---

## 🛡️ Prevention Measures

### 1. **Configuration Backup**
- Keep `aws-config-backup.json` updated
- Store critical configuration in version control
- Document all AWS resource IDs

### 2. **Regular Health Checks**
- Run `node connection-safeguards.js` weekly
- Set up CloudWatch alarms for critical services
- Monitor AWS service status pages

### 3. **Access Control**
- Use IAM roles instead of access keys
- Implement least-privilege access
- Enable MFA for AWS console access

### 4. **Resource Protection**
- Enable deletion protection on critical resources
- Use AWS Config for compliance monitoring
- Set up CloudTrail for audit logging

---

## 📋 Critical Configuration Values

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_uK50qBrap
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=7tbaq74itv3gdda1bt25iqafvh
AWS_REGION=us-east-1
```

### DynamoDB Tables
- `classcast-users`
- `classcast-assignments`
- `classcast-courses`
- `classcast-submissions`
- `classcast-content-moderation`

### S3 Bucket
- `classcast-videos-463470937777-us-east-1`

### Cognito User Pool
- ID: `us-east-1_uK50qBrap`
- Client ID: `7tbaq74itv3gdda1bt25iqafvh`

---

## 🚀 Emergency Recovery Procedure

### Step 1: Check Current Status
```bash
node connection-safeguards.js
```

### Step 2: Fix Environment Variables
```bash
node update-cognito-env.js
```

### Step 3: Verify AWS Resources
```bash
# Check if resources still exist
aws dynamodb describe-table --table-name classcast-users
aws cognito-idp describe-user-pool --user-pool-id us-east-1_uK50qBrap
aws s3 ls s3://classcast-videos-463470937777-us-east-1/
```

### Step 4: Redeploy if Necessary
```bash
# If resources are missing, redeploy CDK stack
cd cdk
npm run deploy
```

### Step 5: Test Application
```bash
# Test authentication
node test-auth-flow.js

# Test data storage
node test-all-storage.js
```

---

## 📞 Support Contacts

- **AWS Support**: AWS Console → Support Center
- **Documentation**: This file (`aws-recovery-guide.md`)
- **Health Check**: `node connection-safeguards.js`

---

## 🔄 Maintenance Schedule

### Daily
- Check application logs for errors
- Monitor AWS service status

### Weekly
- Run `node connection-safeguards.js`
- Review AWS billing and usage

### Monthly
- Update AWS SDK packages
- Review and rotate access keys
- Test disaster recovery procedures

---

*Last Updated: $(date)*
*Health Status: 3/4 services healthy*
