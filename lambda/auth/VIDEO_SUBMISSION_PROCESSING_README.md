# Video Submission Processing Lambda Function

## Overview

The `process-video-submission.ts` Lambda function is triggered by S3 upload events and handles post-upload video processing for the assignment management system. This function processes video submissions automatically when they are uploaded to S3, performing validation, processing, and database updates.

## Architecture

### Trigger
- **S3 Event Trigger**: Automatically triggered when videos are uploaded to the configured S3 bucket
- **Event Types**: `ObjectCreated:Put` and `ObjectCreated:CompleteMultipartUpload`
- **Bucket Filtering**: Only processes events from the configured video bucket

### Processing Flow
1. **Event Validation**: Validates S3 event format using Zod schemas
2. **S3 Key Parsing**: Extracts submission information from S3 object keys
3. **Metadata Retrieval**: Fetches object metadata and custom metadata from S3
4. **Video Validation**: Validates file size, content type, and required metadata
5. **Video Processing**: Generates thumbnails and extracts video metadata
6. **Database Updates**: Updates submission records with processing results
7. **Status Management**: Manages submission status throughout the process

## Key Features

### 🔒 **Security & Validation**
- **File Size Limits**: Enforces maximum file size (500MB default)
- **Content Type Validation**: Only processes supported video formats
- **Metadata Validation**: Ensures required metadata is present
- **S3 Key Parsing**: Validates S3 key format and structure

### 📹 **Video Processing**
- **Thumbnail Generation**: Creates thumbnails at configurable intervals
- **Metadata Extraction**: Extracts video duration and resolution
- **Processing Tracking**: Monitors processing duration and performance
- **Error Handling**: Graceful handling of processing failures

### 🗄️ **Database Integration**
- **Status Updates**: Real-time submission status tracking
- **Processing Results**: Stores thumbnails, duration, and resolution
- **Error Tracking**: Records error messages and retry counts
- **Audit Trail**: Timestamps for all status changes

### ⚡ **Performance & Reliability**
- **Batch Processing**: Handles multiple S3 records concurrently
- **Fault Tolerance**: Continues processing other records if one fails
- **Retry Logic**: Increments retry count for failed submissions
- **Non-blocking Operations**: Database errors don't fail the entire process

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ASSIGNMENTS_TABLE` | `assignments` | DynamoDB table for assignment data |
| `SUBMISSIONS_TABLE` | `submissions` | DynamoDB table for submission records |
| `USERS_TABLE` | `users` | DynamoDB table for user data |
| `VIDEO_BUCKET` | `demo-project-videos` | S3 bucket for video uploads |
| `THUMBNAIL_BUCKET` | `demo-project-thumbnails` | S3 bucket for generated thumbnails |

### Video Processing Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| `MAX_PROCESSING_TIME_MS` | 300000 (5 min) | Maximum allowed processing time |
| `THUMBNAIL_INTERVAL_SECONDS` | 10 | Seconds between thumbnail generation |
| `PROCESSABLE_VIDEO_TYPES` | MP4, AVI, MOV, WebM | Supported video formats |

## S3 Key Structure

The function expects S3 keys in the following format:
```
{courseId}/{assignmentId}/{userId}/{timestamp}_{filename}.{extension}
```

### Example
```
CS101/assignment123/user123/1704067200000_presentation.mp4
```

### Components
- **courseId**: Course identifier (e.g., "CS101")
- **assignmentId**: Assignment identifier (e.g., "assignment123")
- **userId**: User identifier (e.g., "user123")
- **timestamp**: Unix timestamp in milliseconds
- **filename**: Original filename with extension

## Required S3 Metadata

Each uploaded video must include the following metadata:

| Key | Description | Example |
|-----|-------------|---------|
| `assignment-id` | Assignment identifier | `assignment123` |
| `course-id` | Course identifier | `CS101` |
| `upload-type` | Type of upload | `assignment`, `lecture`, `presentation` |
| `user-id` | User identifier | `user123` |

## Submission Status Flow

```
uploading → processing → completed
    ↓           ↓          ↓
  failed    failed     (final)
    ↓
  retry_count++
```

### Status Values
- **`uploading`**: Initial upload in progress
- **`processing`**: Video processing in progress
- **`completed`**: Processing completed successfully
- **`failed`**: Processing failed with error
- **`rejected`**: Video rejected during validation

## Database Schema

### Submissions Table Structure

```typescript
interface SubmissionRecord {
  submissionId: string;
  userId: string;
  assignmentId: string;
  courseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  s3Bucket: string;
  uploadType: 'assignment' | 'lecture' | 'presentation' | 'demo' | 'other';
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'rejected';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processingDuration?: number;
  thumbnailUrls?: string[];
  videoDuration?: number;
  videoResolution?: {
    width: number;
    height: number;
  };
  errorMessage?: string;
  retryCount: number;
}
```

## Error Handling

### Validation Errors
- **File Size**: Exceeds maximum allowed size
- **Content Type**: Unsupported video format
- **Metadata**: Missing required metadata fields
- **S3 Key**: Invalid key format or structure

### Processing Errors
- **S3 Access**: Unable to retrieve object metadata
- **Video Processing**: Thumbnail generation failures
- **Database**: DynamoDB update failures
- **Timeout**: Processing exceeds time limits

### Error Recovery
- **Status Updates**: Failed submissions marked with error details
- **Retry Tracking**: Increments retry count for failed operations
- **Graceful Degradation**: Continues processing other submissions
- **Logging**: Comprehensive error logging with request IDs

## Monitoring & Logging

### Request Tracking
- **Request ID**: Unique identifier for each processing request
- **Timestamps**: Detailed timing for each processing stage
- **Status Updates**: Real-time status change logging
- **Error Details**: Comprehensive error information

### Performance Metrics
- **Processing Duration**: Time taken for video processing
- **Thumbnail Count**: Number of thumbnails generated
- **Success Rate**: Percentage of successful processing
- **Error Rates**: Frequency of different error types

## Deployment

### AWS Lambda Configuration
- **Runtime**: Node.js 18.x or later
- **Memory**: 512MB (adjustable based on video sizes)
- **Timeout**: 5 minutes (configurable)
- **Concurrency**: Configure based on expected load

### S3 Event Configuration
```yaml
Resources:
  VideoBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: demo-project-videos
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt ProcessVideoSubmissionFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: .mp4
```

### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::demo-project-videos/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/submissions"
    }
  ]
}
```

## Testing

### Unit Tests
Run the comprehensive test suite:
```bash
npm test -- --testPathPattern="process-video-submission.test.ts"
```

### Test Coverage
- **S3 Event Handling**: Event validation and filtering
- **Video Validation**: File size, type, and metadata validation
- **Video Processing**: Thumbnail generation and metadata extraction
- **Database Operations**: Status updates and result storage
- **Error Handling**: Various failure scenarios and recovery
- **Configuration**: Environment variable usage

### Integration Testing
- **S3 Upload Simulation**: Test with real S3 events
- **Database Integration**: Verify DynamoDB updates
- **Error Scenarios**: Test various failure conditions
- **Performance Testing**: Large file processing and concurrency

## Future Enhancements

### Video Processing
- **AWS MediaConvert Integration**: Professional video transcoding
- **Multiple Format Support**: Additional video and audio formats
- **Quality Presets**: Different quality levels for different use cases
- **Batch Processing**: Process multiple videos concurrently

### Analytics & Monitoring
- **CloudWatch Metrics**: Detailed performance monitoring
- **Processing Analytics**: Success rates and failure analysis
- **Cost Optimization**: Processing time and resource usage tracking
- **Alerting**: Automated notifications for failures

### Advanced Features
- **Content Moderation**: AI-powered content filtering
- **Automatic Captioning**: Speech-to-text transcription
- **Video Compression**: Optimize file sizes automatically
- **CDN Integration**: Global content distribution

## Troubleshooting

### Common Issues

#### S3 Event Not Triggering
- Verify S3 bucket notification configuration
- Check Lambda function permissions
- Ensure event types are correctly configured

#### Video Processing Failures
- Review CloudWatch logs for error details
- Check file size and format requirements
- Verify required metadata is present

#### Database Update Errors
- Check DynamoDB table permissions
- Verify table names and structure
- Review IAM role configuration

### Debug Mode
Enable detailed logging by setting log level:
```bash
export LOG_LEVEL=debug
```

### Performance Issues
- **Memory**: Increase Lambda memory allocation
- **Timeout**: Extend processing timeout for large files
- **Concurrency**: Adjust concurrent execution limits
- **Batch Size**: Optimize S3 record processing

## Related Documentation

- [Video Upload URL Generation](./VIDEO_UPLOAD_URL_README.md)
- [Assignment Management](./FETCH_ASSIGNMENTS_README.md)
- [DynamoDB Operations](./DYNAMODB_WRITE_OPERATIONS_README.md)
- [Access Control](./INSTRUCTOR_ACCESS_CONTROL_README.md)

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error information
2. Review this documentation for configuration details
3. Run unit tests to verify functionality
4. Check AWS Lambda and S3 service status

