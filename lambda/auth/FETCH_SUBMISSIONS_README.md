# Fetch Submissions Lambda Function

## Overview

The `fetch-submissions.ts` Lambda function provides comprehensive retrieval of student submissions with advanced filtering, sorting, pagination, and temporary video URL generation capabilities. This function is designed to serve both students (viewing their own submissions) and instructors/admins (viewing course submissions) with appropriate access control.

## Key Features

### 🔐 **Role-Based Access Control**
- **Students**: Can only access their own submissions
- **Instructors**: Can access submissions for courses they teach
- **Admins**: Have full access to all submissions

### 🔍 **Advanced Filtering**
- **Student/Assignment/Course**: Filter by specific IDs
- **Status**: Filter by submission status (uploading, processing, completed, failed, rejected)
- **Multiple Statuses**: Filter by multiple statuses simultaneously
- **Grade Filtering**: Filter by grade existence and grade ranges
- **Date Ranges**: Filter by submission date ranges
- **Text Search**: Search across assignment titles, course names, and student names

### 📊 **Sorting & Pagination**
- **Sorting**: By submitted date, grade, status, or assignment title
- **Order**: Ascending or descending
- **Pagination**: Configurable page size with navigation metadata
- **Performance**: Efficient offset-based pagination

### 🎥 **Video URL Generation**
- **Temporary URLs**: Generate S3 presigned URLs for secure video access
- **Configurable Expiry**: Set custom expiration times (5 minutes to 1 hour)
- **Status-Based**: Only generate URLs for completed submissions
- **Security**: URLs expire automatically and are not stored permanently

## API Specification

### Endpoint
```
GET /submissions
```

### Authentication
```
Authorization: Bearer <JWT_TOKEN>
```

### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `studentId` | string | No | Filter by specific student ID | Current user (students) |
| `assignmentId` | string | No | Filter by specific assignment ID | All assignments |
| `courseId` | string | No | Filter by specific course ID | All courses |
| `status` | enum | No | Filter by submission status | All statuses |
| `statuses` | string | No | Comma-separated list of statuses | All statuses |
| `hasGrade` | boolean | No | Filter by grade existence | All submissions |
| `gradeRange.min` | number | No | Minimum grade (0-100) | No minimum |
| `gradeRange.max` | number | No | Maximum grade (0-100) | No maximum |
| `submittedAfter` | ISO date | No | Filter submissions after date | No limit |
| `submittedBefore` | ISO date | No | Filter submissions before date | No limit |
| `page` | number | No | Page number for pagination | 1 |
| `limit` | number | No | Items per page (1-100) | 20 |
| `sortBy` | enum | No | Sort field | `submittedAt` |
| `sortOrder` | enum | No | Sort direction | `desc` |
| `includeVideoUrls` | boolean | No | Generate temporary video URLs | `false` |
| `videoUrlExpiry` | number | No | Video URL expiry in seconds (300-3600) | 900 |

### Status Values
- `uploading`: Video is being uploaded
- `processing`: Video is being processed
- `completed`: Video processing completed successfully
- `failed`: Video processing failed
- `rejected`: Submission was rejected

### Sort Fields
- `submittedAt`: Submission timestamp
- `grade`: Assignment grade
- `status`: Submission status
- `assignmentTitle`: Assignment name

### Sort Orders
- `asc`: Ascending (oldest/lowest first)
- `desc`: Descending (newest/highest first)

## Request Examples

### Basic Student Submission Retrieval
```bash
GET /submissions?page=1&limit=10
Authorization: Bearer <student_jwt_token>
```

### Filter by Assignment and Status
```bash
GET /submissions?assignmentId=assignment123&status=completed&hasGrade=true
Authorization: Bearer <instructor_jwt_token>
```

### Grade Range Filtering
```bash
GET /submissions?gradeRange={"min":80,"max":100}&sortBy=grade&sortOrder=desc
Authorization: Bearer <instructor_jwt_token>
```

### Date Range with Video URLs
```bash
GET /submissions?submittedAfter=2024-01-01T00:00:00Z&includeVideoUrls=true&videoUrlExpiry=1800
Authorization: Bearer <instructor_jwt_token>
```

### Multiple Status Filtering
```bash
GET /submissions?statuses=completed,failed&courseId=CS101
Authorization: Bearer <instructor_jwt_token>
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "submissionId": "assignment123_student123",
        "assignmentId": "assignment123",
        "assignmentTitle": "Introduction to Programming",
        "courseId": "CS101",
        "courseName": "Computer Science 101",
        "studentId": "student123",
        "studentName": "John Student",
        "status": "completed",
        "submittedAt": "2024-01-01T00:00:00Z",
        "processedAt": "2024-01-01T01:00:00Z",
        "grade": 85,
        "feedback": "Good work!",
        "videoUrl": "https://s3.amazonaws.com/...",
        "videoUrlExpiry": "2024-01-01T01:15:00Z",
        "thumbnailUrls": ["https://example.com/thumb1.jpg"],
        "videoDuration": 120,
        "videoResolution": { "width": 1920, "height": 1080 },
        "processingDuration": 5000,
        "errorMessage": null,
        "retryCount": 0,
        "metadata": {
          "s3Key": "CS101/assignment123/student123/1704067200000_video.mp4"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "applied": {
        "status": "completed",
        "hasGrade": true,
        "sortBy": "submittedAt",
        "sortOrder": "desc"
      },
      "summary": "Status: completed | Has Grade: true"
    }
  },
  "requestId": "fetch_1704067200000_abc123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "message": "Students can only access their own submissions",
    "code": 403
  },
  "requestId": "fetch_1704067200000_abc123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Access Control Matrix

| User Role | Can Access | Restrictions |
|-----------|------------|--------------|
| **Student** | Own submissions only | `studentId` automatically set to current user |
| **Instructor** | Course submissions | Must have access to specified course |
| **Admin** | All submissions | No restrictions |

## DynamoDB Schema Requirements

### Submissions Table
```json
{
  "assignmentId": "string (partition key)",
  "userId": "string (sort key)",
  "courseId": "string",
  "status": "string",
  "submittedAt": "string (ISO date)",
  "processedAt": "string (ISO date)",
  "grade": "number",
  "feedback": "string",
  "thumbnailUrls": ["string"],
  "videoDuration": "number",
  "videoResolution": { "width": "number", "height": "number" },
  "processingDuration": "number",
  "errorMessage": "string",
  "retryCount": "number",
  "metadata": "object"
}
```

### Required Indexes
- **AssignmentUserIndex**: `assignmentId` (partition) + `userId` (sort)
- **CourseInstructorIndex**: `courseId` (partition) + `instructorId` (sort)

### Assignments Table
```json
{
  "assignmentId": "string (partition key)",
  "title": "string",
  "courseId": "string",
  "instructorId": "string"
}
```

### Users Table
```json
{
  "userId": "string (partition key)",
  "name": "string",
  "role": "string"
}
```

## Implementation Details

### Core Functions

#### `validateUserAccess(user, params, requestId)`
- Validates user permissions based on role
- Enforces student access restrictions
- Verifies instructor course access

#### `buildSubmissionQuery(params, user, requestId)`
- Constructs DynamoDB query parameters
- Builds key conditions and filter expressions
- Handles complex filtering logic

#### `enrichSubmissions(submissions, params, requestId)`
- Fetches assignment, course, and student details
- Enriches submission data with human-readable names
- Handles missing data gracefully

#### `generateTemporaryVideoUrls(submissions, expirySeconds, requestId)`
- Generates S3 presigned URLs for completed submissions
- Sets configurable expiration times
- Handles S3 errors gracefully

### Performance Optimizations

#### Query Efficiency
- Uses appropriate DynamoDB indexes
- Minimizes filter expressions
- Implements efficient pagination

#### Data Enrichment
- Parallel processing of enrichment requests
- Graceful fallbacks for missing data
- Continues processing on individual failures

#### Video URL Generation
- Only generates URLs when requested
- Processes URLs in parallel
- Continues on individual failures

## Error Handling

### Common Error Scenarios

#### Authentication Errors (401)
- Missing authorization header
- Invalid token format
- Expired or invalid JWT tokens

#### Authorization Errors (403)
- Students accessing other students' submissions
- Instructors accessing unauthorized courses
- Insufficient permissions

#### Validation Errors (400)
- Invalid query parameters
- Out-of-range values
- Malformed JSON in complex parameters

#### Server Errors (500)
- DynamoDB connection issues
- S3 service unavailability
- Unexpected processing errors

### Error Recovery
- **Graceful Degradation**: Continues processing on partial failures
- **Fallback Values**: Uses default values for missing data
- **Comprehensive Logging**: Detailed error tracking with request IDs
- **User-Friendly Messages**: Clear error descriptions for debugging

## Security Features

### JWT Token Validation
- Verifies token authenticity and expiration
- Extracts user role and permissions
- Prevents unauthorized access

### Role-Based Access Control
- Enforces strict permission boundaries
- Prevents privilege escalation
- Validates course access for instructors

### Temporary Video URLs
- Short-lived access tokens (5 minutes to 1 hour)
- No permanent URL storage
- Automatic expiration

### Input Validation
- Comprehensive parameter validation
- Type checking and range validation
- SQL injection prevention

## Monitoring & Logging

### Request Tracking
- Unique request ID for each call
- Timestamp logging
- User role and action tracking

### Performance Metrics
- Query execution time
- Data enrichment duration
- Video URL generation time

### Error Monitoring
- Detailed error logging
- Failure rate tracking
- Performance degradation alerts

## Testing

### Test Coverage
- **Authentication & Authorization**: 100% coverage
- **Parameter Validation**: All validation scenarios
- **Query Building**: All filter combinations
- **Data Enrichment**: Success and failure cases
- **Video URL Generation**: URL generation and error handling
- **Error Scenarios**: All error conditions
- **Edge Cases**: Empty results, missing data, etc.

### Test Categories
- Unit tests for individual functions
- Integration tests for DynamoDB operations
- Mock tests for external services
- Error handling validation
- Performance and edge case testing

## Deployment

### Environment Variables
```bash
SUBMISSIONS_TABLE=submissions
ASSIGNMENTS_TABLE=assignments
USERS_TABLE=users
VIDEO_BUCKET=demo-project-videos
```

### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/submissions",
        "arn:aws:dynamodb:*:*:table/assignments",
        "arn:aws:dynamodb:*:*:table/users"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::demo-project-videos/*"
    }
  ]
}
```

### Lambda Configuration
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB (adjustable based on load)
- **Timeout**: 30 seconds
- **Concurrency**: 1000 (adjustable)

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket support for live submission status
- **Advanced Analytics**: Submission statistics and trends
- **Bulk Operations**: Batch submission retrieval and updates
- **Caching Layer**: Redis integration for frequently accessed data
- **Search Optimization**: Elasticsearch integration for full-text search

### Performance Improvements
- **Connection Pooling**: Optimized DynamoDB connections
- **Response Compression**: Gzip compression for large responses
- **CDN Integration**: CloudFront for video delivery
- **Database Sharding**: Horizontal scaling for large datasets

## Troubleshooting

### Common Issues

#### Slow Response Times
- Check DynamoDB query performance
- Verify index usage
- Monitor data enrichment duration

#### Video URL Generation Failures
- Verify S3 bucket permissions
- Check video file existence
- Validate S3 key format

#### Access Control Issues
- Verify JWT token validity
- Check user role assignments
- Validate course access permissions

### Debug Steps
1. Check CloudWatch logs for request ID
2. Verify DynamoDB query parameters
3. Test individual function calls
4. Validate environment variables
5. Check IAM permissions

## Related Documentation

- [Video Upload URL Generation](../VIDEO_UPLOAD_URL_README.md)
- [Video Submission Processing](../PROCESS_VIDEO_SUBMISSION_README.md)
- [Assignment Creation](../create-assignment.ts)
- [Assignment Fetching](../FETCH_ASSIGNMENTS_README.md)
- [Instructor Access Control](../INSTRUCTOR_ACCESS_CONTROL_README.md)

