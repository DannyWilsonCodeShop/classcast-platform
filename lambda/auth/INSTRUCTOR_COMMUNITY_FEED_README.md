# Instructor Community Feed Lambda Function

## Overview

The Instructor Community Feed Lambda function provides instructors and administrators with a comprehensive view of student submissions, enabling efficient grading workflows and community engagement. This function supports both viewing submissions with enhanced details and performing bulk grading operations directly from the feed interface.

## Key Features

### 🔍 **Enhanced Viewing Capabilities**
- **Student Name Display**: Shows actual student names instead of just IDs
- **Assignment Details**: Displays assignment titles and course information
- **Video Integration**: Generates temporary video URLs for direct viewing
- **Rich Metadata**: Includes submission status, processing details, and grading information

### 📝 **Direct Grading Interface**
- **Inline Grading**: Grade submissions directly from the feed without navigation
- **Rubric Support**: Full rubric-based grading with detailed criteria
- **Feedback Management**: Rich feedback with grading notes and resubmission settings
- **Real-time Updates**: Immediate feedback on grading success/failure

### ⚡ **Bulk Operations**
- **Mass Grading**: Grade up to 50 submissions in a single operation
- **Efficiency Tools**: Common grading notes and settings across multiple submissions
- **Batch Processing**: Optimized for handling large numbers of submissions
- **Progress Tracking**: Detailed results and summary statistics

### 🎯 **Advanced Filtering & Sorting**
- **Multi-dimensional Filters**: By assignment, course, status, grade range, and date
- **Smart Sorting**: By submission time, grade, assignment title, or student name
- **Status Management**: Filter by pending, completed, failed, or graded submissions
- **Grade Analytics**: Filter by grade ranges and calculate statistics

## API Specification

### HTTP Methods

#### GET - Fetch Community Feed
Retrieves submissions with enhanced details, filtering, and pagination.

**Query Parameters:**
```typescript
{
  assignmentId?: string;           // Filter by specific assignment
  courseId?: string;               // Filter by specific course
  status?: 'pending' | 'completed' | 'failed' | 'graded';
  statuses?: string[];             // Multiple status filter
  hasGrade?: boolean;              // Filter by grading status
  gradeRange?: {
    min?: number;                  // Minimum grade (0-100)
    max?: number;                  // Maximum grade (0-100)
  };
  submittedAfter?: string;         // ISO datetime string
  submittedBefore?: string;        // ISO datetime string
  page?: number;                   // Page number (default: 1)
  limit?: number;                  // Items per page (default: 20, max: 100)
  sortBy?: 'submittedAt' | 'grade' | 'assignmentTitle' | 'studentName';
  sortOrder?: 'asc' | 'desc';     // Default: 'desc'
  includeVideoUrls?: boolean;      // Generate temporary video URLs
  videoUrlExpiry?: number;         // URL expiry in seconds (300-3600)
}
```

#### POST - Bulk Grading
Processes multiple submissions for grading in a single operation.

**Request Body:**
```typescript
{
  submissions: Array<{
    submissionId: string;
    assignmentId: string;
    studentId: string;
    grade: number;                 // 0-100
    feedback: string;              // 1-2000 characters
    rubricScores?: Array<{
      criterion: string;
      score: number;               // 0-100
      maxScore: number;            // Minimum 1
      comments?: string;
    }>;
    gradingNotes?: string;         // Max 1000 characters
    allowResubmission?: boolean;
    resubmissionDeadline?: string; // ISO datetime string
  }>;
  gradingNotes?: string;           // Common notes for all submissions
}
```

**Limits:**
- Maximum 50 submissions per bulk operation
- Grade range: 0-100
- Feedback length: 1-2000 characters
- Grading notes: Max 1000 characters

### Response Format

#### Success Response (200)
```typescript
{
  success: true;
  data: {
    submissions: SubmissionWithDetails[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      pageNumbers: number[];
      limit: number;
    };
    filters: {
      applied: Record<string, any>;
      available: {
        statuses: string[];
        gradeRanges: Array<{ min: number; max: number; label: string }>;
        dateRanges: Array<{ label: string; value: string }>;
      };
    };
    summary: {
      totalSubmissions: number;
      pendingGrading: number;
      completedGrading: number;
      averageGrade: number;
      gradeDistribution: Record<string, number>;
    };
  };
  requestId: string;
  timestamp: string;
}
```

#### Bulk Grading Response (200)
```typescript
{
  success: true;
  data: {
    results: Array<{
      submissionId: string;
      success: boolean;
      grade?: number;
      error?: string;
    }>;
    summary: {
      totalProcessed: number;
      successful: number;
      failed: number;
      averageGrade: number;
    };
  };
  requestId: string;
  timestamp: string;
}
```

#### Error Response (4xx/5xx)
```typescript
{
  success: false;
  error: {
    message: string;
    code: number;
  };
  requestId: string;
  timestamp: string;
}
```

## Data Models

### SubmissionWithDetails
```typescript
interface SubmissionWithDetails {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;             // Enriched from users table
  courseId: string;
  courseName: string;              // Enriched from courses table
  assignmentTitle: string;         // Enriched from assignments table
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  allowResubmission?: boolean;
  resubmissionDeadline?: string;
  videoUrl?: string;               // Temporary URL when requested
  videoUrlExpiry?: string;         // URL expiration timestamp
  metadata?: Record<string, any>;
}
```

## DynamoDB Schema Requirements

### Submissions Table
```typescript
{
  assignmentId: string;            // Partition key
  userId: string;                  // Sort key
  submissionId: string;
  courseId: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  allowResubmission?: boolean;
  resubmissionDeadline?: string;
  rubricScores?: Array<RubricScore>;
  gradingNotes?: string;
  metadata?: Record<string, any>;
  version?: number;                // For optimistic locking
  lastModified?: string;
}
```

### Global Secondary Indexes
```typescript
// StatusSubmittedAtIndex
{
  status: string;                  // Partition key
  submittedAt: string;             // Sort key
  assignmentId: string;
  userId: string;
  // Other attributes projected
}
```

### Users Table
```typescript
{
  userId: string;                  // Partition key
  name: string;
  role: string;
  email?: string;
  // Other user attributes
}
```

### Assignments Table
```typescript
{
  assignmentId: string;            // Partition key
  title: string;
  courseId: string;
  instructorId: string;
  // Other assignment attributes
}
```

## Implementation Details

### Core Functions

#### `handleFetchFeed()`
- Parses and validates query parameters
- Builds DynamoDB query with filters
- Executes query and applies additional filtering
- Enriches submissions with related data
- Generates video URLs if requested
- Builds comprehensive response with pagination and statistics

#### `handleBulkGrade()`
- Validates bulk grading request schema
- Processes each submission individually
- Validates submission state and permissions
- Updates submissions with grades and feedback
- Provides detailed results and summary statistics

#### `enrichSubmissions()`
- Fetches assignment details from assignments table
- Retrieves student information from users table
- Gets course information (placeholder implementation)
- Combines data into enriched submission objects

#### `buildSubmissionQuery()`
- Constructs DynamoDB query parameters
- Applies status-based key conditions
- Adds filter expressions for assignment, course, and date ranges
- Optimizes query performance with proper indexing

#### `applySubmissionPagination()`
- Implements offset-based pagination
- Generates smart page numbers for navigation
- Handles edge cases for large result sets
- Provides navigation metadata

### Filtering and Sorting

#### Status Filtering
- Primary filter using GSI partition key
- Support for multiple status values
- Efficient querying with status-based indexing

#### Grade Range Filtering
- Client-side filtering for grade-based criteria
- Support for minimum and maximum grade bounds
- Handles ungraded submissions appropriately

#### Date Range Filtering
- ISO datetime string validation
- DynamoDB filter expressions for date ranges
- Support for relative date filtering

#### Sorting Options
- **submittedAt**: Chronological ordering (default desc)
- **grade**: Numerical grade ordering
- **assignmentTitle**: Alphabetical ordering
- **studentName**: Student name ordering

### Bulk Grading Workflow

#### Validation Phase
1. Schema validation using Zod
2. Submission count limits (max 50)
3. Individual submission validation
4. Permission and access control

#### Processing Phase
1. Sequential processing for consistency
2. Submission state validation
3. Grade and feedback application
4. Error handling and rollback

#### Results Compilation
1. Success/failure tracking per submission
2. Summary statistics calculation
3. Error message aggregation
4. Response formatting

## Security Features

### Authentication & Authorization
- **JWT Token Verification**: Secure token-based authentication
- **Role-Based Access Control**: Only instructors and admins
- **Request Validation**: Comprehensive input sanitization
- **Audit Logging**: Request ID tracking and logging

### Data Protection
- **Parameter Validation**: Zod schema validation
- **SQL Injection Prevention**: DynamoDB parameterized queries
- **Input Sanitization**: Type checking and bounds validation
- **Error Message Sanitization**: No sensitive data exposure

### Access Control
- **User Role Verification**: Instructor/admin only
- **Assignment Ownership**: Instructor access validation
- **Submission Privacy**: Student data protection
- **Bulk Operation Limits**: Prevents abuse

## Performance Optimizations

### Database Efficiency
- **GSI Utilization**: Status-based querying for performance
- **Batch Operations**: Efficient bulk processing
- **Query Optimization**: Minimal filter expressions
- **Connection Pooling**: DynamoDB client reuse

### Caching Strategy
- **Video URL Generation**: Temporary URLs with configurable expiry
- **Metadata Caching**: Assignment and user data caching
- **Response Optimization**: Minimal data transfer
- **Pagination Efficiency**: Smart page number generation

### Scalability Features
- **Async Processing**: Non-blocking operations
- **Error Isolation**: Individual submission error handling
- **Resource Management**: Memory-efficient processing
- **Timeout Handling**: Configurable operation limits

## Monitoring & Logging

### Request Tracking
- **Unique Request IDs**: Format: `instructor_feed_{timestamp}_{random}`
- **Comprehensive Logging**: All major operations logged
- **Error Tracking**: Detailed error logging with context
- **Performance Metrics**: Operation timing and success rates

### CloudWatch Integration
- **Structured Logging**: JSON-formatted log entries
- **Error Aggregation**: Error pattern identification
- **Performance Monitoring**: Response time tracking
- **Resource Utilization**: Memory and execution time

### Alerting
- **Error Rate Thresholds**: Automatic alerting on failures
- **Performance Degradation**: Response time monitoring
- **Resource Limits**: Memory and timeout alerts
- **Security Events**: Authentication and authorization failures

## Testing Strategy

### Unit Testing
- **Comprehensive Coverage**: All functions and edge cases
- **Mock Integration**: AWS SDK and external dependencies
- **Error Scenarios**: Failure mode testing
- **Validation Testing**: Input parameter validation

### Integration Testing
- **DynamoDB Integration**: Real database operations
- **JWT Verification**: Token validation testing
- **Error Handling**: Database and network failures
- **Performance Testing**: Load and stress testing

### Test Categories
- **Authentication & Authorization**: Security testing
- **Feed Fetching**: GET operation testing
- **Bulk Grading**: POST operation testing
- **Error Handling**: Failure scenario testing
- **Response Format**: Output validation testing

## Deployment Considerations

### Environment Variables
```bash
SUBMISSIONS_TABLE=submissions
ASSIGNMENTS_TABLE=assignments
USERS_TABLE=users
VIDEO_BUCKET=video-submissions
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
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/submissions",
        "arn:aws:dynamodb:*:*:table/submissions/index/*",
        "arn:aws:dynamodb:*:*:table/assignments",
        "arn:aws:dynamodb:*:*:table/users"
      ]
    }
  ]
}
```

### Lambda Configuration
- **Memory**: 512 MB (recommended for bulk operations)
- **Timeout**: 30 seconds (bulk grading operations)
- **Concurrency**: 10 (prevent database overload)
- **Environment**: Node.js 18.x or later

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live feed
- **Advanced Analytics**: Grade distribution and trend analysis
- **Batch Export**: CSV/Excel export functionality
- **Notification System**: Email/SMS alerts for new submissions

### Performance Improvements
- **Redis Caching**: Frequently accessed data caching
- **Elasticsearch Integration**: Advanced search and filtering
- **CDN Integration**: Video content delivery optimization
- **Database Sharding**: Horizontal scaling for large datasets

### User Experience
- **Mobile Optimization**: Responsive design improvements
- **Keyboard Shortcuts**: Power user efficiency features
- **Drag & Drop**: Intuitive bulk operation interface
- **Progressive Web App**: Offline capability and push notifications

## Troubleshooting

### Common Issues

#### DynamoDB Query Errors
- **Symptom**: 500 errors with database connection messages
- **Cause**: GSI not created or incorrect table structure
- **Solution**: Verify table schema and GSI configuration

#### Bulk Grading Failures
- **Symptom**: Individual submissions failing in bulk operations
- **Cause**: Submission state validation or permission issues
- **Solution**: Check submission status and user permissions

#### Video URL Generation Issues
- **Symptom**: Video URLs not appearing in feed
- **Cause**: S3 bucket configuration or metadata issues
- **Solution**: Verify S3 bucket permissions and metadata structure

#### Pagination Problems
- **Symptom**: Incorrect page numbers or missing results
- **Cause**: Filter application order or pagination logic
- **Solution**: Check filter implementation and pagination calculations

### Debug Information
- **Request ID**: Use for tracing specific requests
- **CloudWatch Logs**: Detailed operation logging
- **Error Messages**: Specific error descriptions
- **Response Headers**: CORS and content type information

## Related Documentation

- [Grade Submission Lambda](./GRADE_SUBMISSION_README.md)
- [Fetch Submissions Lambda](./FETCH_SUBMISSIONS_README.md)
- [Video Upload URL Generation](./VIDEO_UPLOAD_URL_README.md)
- [JWT Verification Module](./jwt-verifier.md)

## Support & Maintenance

### Regular Maintenance
- **Log Rotation**: CloudWatch log management
- **Performance Monitoring**: Response time tracking
- **Error Rate Monitoring**: Failure pattern analysis
- **Resource Utilization**: Memory and execution monitoring

### Updates & Patches
- **Security Updates**: JWT library and dependency updates
- **Feature Enhancements**: New filtering and sorting options
- **Performance Improvements**: Query optimization and caching
- **Bug Fixes**: Error handling and validation improvements

### Contact Information
- **Development Team**: Lambda function maintainers
- **DevOps Team**: Deployment and infrastructure support
- **Security Team**: Authentication and authorization issues
- **Documentation**: API specification and usage examples

