# Video Interactions Production Deployment Guide

## 🚀 Overview

This guide covers deploying the complete video interaction system to production AWS environment, including all components for liking, commenting, graded responses, and sharing functionality.

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- CDK CLI installed (`npm install -g aws-cdk`)
- Production AWS account access
- Domain name configured (optional)

## 🏗️ Architecture Components

### 1. **DynamoDB Tables**
- `ClassCastVideos` - Video metadata and engagement data
- `ClassCastComments` - Comment system with threading
- `ClassCastResponses` - Graded response submissions
- `ClassCastShares` - Video sharing records

### 2. **S3 Storage**
- Video file storage with lifecycle policies
- Thumbnail generation and storage
- CORS configuration for web uploads

### 3. **Lambda Functions**
- Video processing (thumbnails, metadata)
- Comment moderation (content filtering)
- Grading notifications (instructor alerts)

### 4. **SNS Notifications**
- Real-time sharing notifications
- Grading queue alerts
- System notifications

### 5. **API Endpoints**
- `/api/videos/[id]/like` - Like/unlike videos
- `/api/videos/[id]/comments` - Comment management
- `/api/videos/[id]/responses` - Graded responses
- `/api/videos/[id]/share` - Video sharing

## 🚀 Deployment Steps

### Step 1: Deploy AWS Infrastructure

```bash
# Navigate to CDK directory
cd cdk

# Install dependencies
npm install

# Bootstrap CDK (if first time)
npx cdk bootstrap

# Deploy video interactions stack
npx cdk deploy DemoProject-VideoInteractionsStack --require-approval never
```

### Step 2: Configure Environment Variables

After deployment, get the stack outputs and update your environment:

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name DemoProject-VideoInteractionsStack \
  --query 'Stacks[0].Outputs'

# Update .env.local with the outputs
cat > .env.local << EOF
VIDEOS_TABLE_NAME=ClassCastVideos
COMMENTS_TABLE_NAME=ClassCastComments
RESPONSES_TABLE_NAME=ClassCastResponses
SHARES_TABLE_NAME=ClassCastShares
VIDEO_BUCKET_NAME=classcast-videos-your-account-us-east-1
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:your-account:ClassCastNotifications
AWS_REGION=us-east-1
EOF
```

### Step 3: Deploy Application

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# For Vercel:
vercel --prod

# For AWS Amplify:
amplify publish

# For custom deployment:
# Follow your existing deployment process
```

## 🔧 Configuration

### DynamoDB Table Structure

#### Videos Table
```json
{
  "videoId": "string (PK)",
  "createdAt": "string (SK)",
  "userId": "string",
  "assignmentId": "string",
  "title": "string",
  "description": "string",
  "videoUrl": "string",
  "thumbnailUrl": "string",
  "likes": "number",
  "likedBy": "array",
  "comments": "number",
  "views": "number",
  "status": "string",
  "isPublic": "boolean"
}
```

#### Comments Table
```json
{
  "videoId": "string (PK)",
  "commentId": "string (SK)",
  "userId": "string",
  "content": "string",
  "parentCommentId": "string",
  "likes": "number",
  "likedBy": "array",
  "moderationStatus": "string",
  "createdAt": "string"
}
```

### S3 Bucket Configuration

#### Video Storage Structure
```
classcast-videos-{account}-{region}/
├── videos/
│   └── {videoId}/
│       ├── video.mp4
│       └── thumbnail.jpg
└── thumbnails/
    └── {videoId}/
        └── thumb.jpg
```

#### CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## 🔐 Security Configuration

### IAM Permissions

#### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/ClassCast*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::classcast-videos-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:*:*:ClassCastNotifications"
      ]
    }
  ]
}
```

### API Gateway Security
- CORS enabled for web clients
- Authentication via Cognito (if using)
- Rate limiting configured
- Request validation enabled

## 📊 Monitoring & Logging

### CloudWatch Dashboards
- Video upload metrics
- Comment activity tracking
- Response submission rates
- Share engagement metrics

### Alarms
- High error rates
- Lambda timeout alerts
- DynamoDB throttling
- S3 storage costs

### Log Groups
- `/aws/lambda/ClassCastVideoProcessing`
- `/aws/lambda/ClassCastCommentModeration`
- `/aws/lambda/ClassCastGradingNotification`

## 🧪 Testing

### API Testing
```bash
# Test like endpoint
curl -X POST https://your-api.com/api/videos/video-123/like \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "isLiked": true}'

# Test comment endpoint
curl -X POST https://your-api.com/api/videos/video-123/comments \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "content": "Great video!"}'
```

### Load Testing
- Use tools like Artillery or k6
- Test concurrent video interactions
- Monitor DynamoDB performance
- Validate S3 upload limits

## 🔄 Maintenance

### Regular Tasks
- Monitor DynamoDB costs and performance
- Review S3 storage usage
- Check Lambda error rates
- Update security policies

### Scaling Considerations
- DynamoDB auto-scaling enabled
- Lambda concurrency limits
- S3 transfer acceleration
- CloudFront for video delivery

## 🚨 Troubleshooting

### Common Issues

#### DynamoDB Throttling
```bash
# Check table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=ClassCastVideos
```

#### Lambda Timeouts
- Increase timeout in CDK configuration
- Optimize function code
- Check external API calls

#### S3 Upload Failures
- Verify CORS configuration
- Check bucket permissions
- Validate file size limits

## 📈 Performance Optimization

### DynamoDB
- Use appropriate partition keys
- Implement caching with ElastiCache
- Optimize query patterns

### S3
- Enable transfer acceleration
- Use CloudFront for video delivery
- Implement lifecycle policies

### Lambda
- Use provisioned concurrency for critical functions
- Optimize cold start times
- Monitor memory usage

## 🔐 Security Best Practices

1. **Encryption at Rest**
   - DynamoDB encryption enabled
   - S3 server-side encryption
   - Lambda environment variables encrypted

2. **Encryption in Transit**
   - HTTPS for all API calls
   - S3 presigned URLs for uploads
   - VPC endpoints for internal traffic

3. **Access Control**
   - Least privilege IAM policies
   - Resource-based policies
   - Regular access reviews

## 📞 Support

For deployment issues:
1. Check CloudWatch logs
2. Review CDK deployment status
3. Validate environment variables
4. Test API endpoints individually

## 🎉 Success Criteria

Deployment is successful when:
- ✅ All DynamoDB tables created
- ✅ S3 buckets accessible
- ✅ Lambda functions deployed
- ✅ API endpoints responding
- ✅ Video uploads working
- ✅ Comments system functional
- ✅ Sharing notifications sent
- ✅ Graded responses submitted

---

**Next Steps**: After successful deployment, configure monitoring dashboards and set up automated testing pipelines.
