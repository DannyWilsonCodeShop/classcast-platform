# Content Moderation System

## Overview

The ClassCast platform includes a comprehensive AI-powered content moderation system that automatically scans both video and written content for appropriateness. This system helps maintain a safe, educational environment by detecting inappropriate content before it's published.

## Features

### 🤖 AI-Powered Analysis
- **Text Content Moderation**: Analyzes written content for appropriateness
- **Video Content Moderation**: Scans video metadata and descriptions
- **Real-time Processing**: Instant content analysis and feedback
- **Multi-category Detection**: Identifies various types of inappropriate content

### 📊 Risk Categories
The system analyzes content across multiple risk categories:
- **Violence**: Potential for violent content
- **Hate Speech**: Discriminatory or hateful language
- **Harassment**: Bullying or harassment
- **Sexual Content**: Inappropriate sexual material
- **Self-Harm**: Content promoting dangerous activities
- **Spam**: Irrelevant or promotional content
- **Misinformation**: False or misleading information

### 🎯 Integration Points
- **Assignment Submissions**: Both text and video submissions
- **Forum Posts**: Community discussions and comments
- **User Profiles**: Bio and status updates
- **Course Content**: Instructor-created materials

## Technical Implementation

### Backend Services

#### Content Moderation Service (`src/lib/contentModeration.ts`)
```typescript
// Text content moderation
const result = await contentModerationService.moderateText(
  "Your content here",
  "assignment submission"
);

// Video content moderation
const result = await contentModerationService.moderateVideo(
  "https://video-url.com",
  { title: "Video Title", duration: 120 }
);
```

#### API Endpoints
- `POST /api/moderation/text` - Moderate text content
- `POST /api/moderation/video` - Moderate video content
- `POST /api/moderation/submission` - Moderate assignment submissions

#### Lambda Function
- **Function Name**: `classcast-content-moderation`
- **Runtime**: Node.js 18.x
- **Memory**: 512MB
- **Timeout**: 30 seconds

### Frontend Components

#### ContentModerationChecker
```tsx
<ContentModerationChecker
  content={userContent}
  type="text" // or "video"
  onModerationComplete={(result) => {
    // Handle moderation result
  }}
  context={{
    assignmentId: "assignment-123",
    courseId: "course-456",
    userId: "user-789"
  }}
  autoCheck={true}
  showGuidelines={true}
/>
```

#### ContentModerationAlert
```tsx
<ContentModerationAlert
  result={moderationResult}
  onDismiss={() => setShowAlert(false)}
  onAppeal={() => handleAppeal()}
  showDetails={true}
/>
```

### Database Schema

#### Content Moderation Logs Table
```json
{
  "TableName": "classcast-content-moderation",
  "KeySchema": [
    {
      "AttributeName": "moderationId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "moderationId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "userId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "timestamp",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "userId-timestamp-index",
      "KeySchema": [
        {
          "AttributeName": "userId",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "timestamp",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

## Usage Examples

### Text Assignment Submission
```tsx
import TextSubmissionForm from '@/components/student/TextSubmissionForm';

<TextSubmissionForm
  assignmentId="assignment-123"
  courseId="course-456"
  onSubmissionComplete={(data) => {
    console.log('Submission completed:', data);
  }}
  onSubmissionError={(error) => {
    console.error('Submission failed:', error);
  }}
  maxLength={5000}
  placeholder="Enter your essay response..."
/>
```

### Video Assignment Submission
```tsx
import VideoSubmission from '@/components/student/VideoSubmission';

<VideoSubmission
  assignmentId="assignment-123"
  courseId="course-456"
  onSubmissionComplete={(data) => {
    console.log('Video submitted:', data);
  }}
  maxFileSize={100 * 1024 * 1024} // 100MB
  allowedVideoTypes={['video/mp4', 'video/webm']}
  maxDuration={300} // 5 minutes
/>
```

## Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
MODERATION_TABLE=classcast-content-moderation
```

### Content Guidelines
The system enforces these content guidelines:
1. Content should be appropriate for educational environments
2. No hate speech, harassment, or discriminatory language
3. No violent, graphic, or disturbing content
4. No inappropriate sexual content
5. No content promoting self-harm or dangerous activities
6. No spam, irrelevant, or off-topic content
7. No false or misleading information
8. Respectful communication and constructive feedback
9. Content should add value to the learning community
10. Follow platform terms of service and community guidelines

## Deployment

### 1. Deploy Lambda Function
```bash
cd lambda-deploy
./deploy-content-moderation.sh
```

### 2. Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name classcast-content-moderation \
  --attribute-definitions \
    AttributeName=moderationId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=moderationId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=userId-timestamp-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST
```

### 3. Update API Gateway
Add the content moderation endpoints to your API Gateway configuration.

### 4. Set Environment Variables
```bash
# In AWS Lambda console or via CLI
aws lambda update-function-configuration \
  --function-name classcast-content-moderation \
  --environment Variables='{
    "OPENAI_API_KEY":"your_key_here",
    "MODERATION_TABLE":"classcast-content-moderation"
  }'
```

## Monitoring and Analytics

### CloudWatch Metrics
- **Invocations**: Number of moderation requests
- **Duration**: Processing time per request
- **Errors**: Failed moderation attempts
- **Throttles**: Rate limiting events

### Moderation Logs
All moderation results are logged to DynamoDB with:
- User ID and content ID
- Moderation result and confidence score
- Risk category scores
- Timestamp and context information
- 30-day TTL for automatic cleanup

### Dashboard Metrics
- Total content moderated
- Inappropriate content detection rate
- Average processing time
- User compliance rates
- Risk category distribution

## Security and Privacy

### Data Protection
- Content is processed securely through OpenAI's API
- No content is stored permanently (30-day TTL)
- User data is anonymized in logs
- All API calls are encrypted in transit

### Access Control
- Moderation results are only visible to:
  - Content creators (for their own content)
  - Instructors (for their course content)
  - Administrators (for system oversight)

### Compliance
- GDPR compliant data handling
- FERPA compliant for educational data
- SOC 2 Type II security standards
- Regular security audits and updates

## Troubleshooting

### Common Issues

#### 1. OpenAI API Key Not Configured
**Error**: "OpenAI API key not configured"
**Solution**: Set the `OPENAI_API_KEY` environment variable

#### 2. Content Too Long
**Error**: "Content is too long"
**Solution**: Text content is limited to 10,000 characters

#### 3. Invalid Video URL
**Error**: "Invalid video URL format"
**Solution**: Ensure video URL starts with http:// or https://

#### 4. Moderation Service Unavailable
**Error**: "Content moderation service is not available"
**Solution**: Check Lambda function status and API Gateway configuration

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=content-moderation
```

### Testing
```bash
# Test text moderation
curl -X POST https://your-api-gateway-url/moderation/text \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test message",
    "context": "assignment submission",
    "userId": "user-123"
  }'

# Test video moderation
curl -X POST https://your-api-gateway-url/moderation/video \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "metadata": {
      "title": "Test Video",
      "duration": 120
    },
    "userId": "user-123"
  }'
```

## Future Enhancements

### Planned Features
- **Real-time Video Analysis**: Frame-by-frame video content analysis
- **Audio Transcription**: Automatic speech-to-text for video content
- **Multi-language Support**: Content moderation in multiple languages
- **Custom Guidelines**: Institution-specific content policies
- **Appeal System**: User appeal process for moderation decisions
- **Advanced Analytics**: Detailed reporting and insights
- **Integration APIs**: Third-party content moderation services

### Performance Optimizations
- **Caching**: Redis cache for repeated content analysis
- **Batch Processing**: Bulk content moderation for efficiency
- **Edge Computing**: Regional processing for faster response times
- **CDN Integration**: Content delivery optimization

## Support

For technical support or questions about the content moderation system:
- **Documentation**: This README and inline code comments
- **API Reference**: OpenAPI specification in `/docs`
- **Issue Tracking**: GitHub issues for bug reports
- **Community Forum**: ClassCast community discussions

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: ClassCast Development Team
