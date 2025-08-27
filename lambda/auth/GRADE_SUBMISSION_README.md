# Grade Submission Lambda Function

## Overview
The Grade Submission Lambda function allows instructors and administrators to submit grades and feedback for student video submissions. This function implements comprehensive validation, access control, and optimistic locking to ensure data integrity in concurrent grading scenarios.

## Key Features

### ✅ **Completed Features**
- **Role-Based Access Control**: Only instructors and administrators can grade submissions
- **Comprehensive Input Validation**: Zod schema validation for all input parameters
- **Business Logic Validation**: Ensures submissions are in gradable state and not already graded
- **Rubric-Based Scoring**: Supports detailed criterion-based grading with score alignment validation
- **Resubmission Controls**: Optional resubmission allowance with deadline validation
- **Audit Logging**: Comprehensive logging of all grading activities
- **CORS Support**: Full CORS headers for web application integration
- **Request Tracking**: Unique request IDs for debugging and monitoring
- **Optimistic Locking**: Prevents concurrent grading conflicts with version-based locking
- **Retry Logic**: Automatic retry for transient DynamoDB errors
- **Performance Optimization**: Exponential backoff for retry attempts

### 🔄 **Optimistic Locking Implementation**
The function now implements robust optimistic locking to prevent race conditions when multiple instructors attempt to grade the same submission simultaneously:

- **Version Tracking**: Each submission maintains a version counter
- **Conditional Updates**: DynamoDB updates include version checks
- **Conflict Detection**: Automatically detects when submissions are modified by other processes
- **Retry Logic**: Implements exponential backoff retry for version conflicts
- **Throughput Handling**: Special handling for DynamoDB throughput exceeded errors
- **Race Condition Prevention**: Ensures only one grading operation succeeds per submission

### 📊 **Retry Strategy**
- **Version Conflicts**: Up to 3 retries with exponential backoff (1s, 2s, 4s)
- **Throughput Errors**: Up to 3 retries with exponential backoff (2s, 4s, 8s)
- **Other Errors**: No retry (immediate failure)
- **Maximum Delays**: Capped at 5s for version conflicts, 10s for throughput errors

## API Specification

### Request Format
```typescript
{
  submissionId: string;           // Required: Unique submission identifier
  assignmentId: string;           // Required: Assignment identifier
  studentId: string;              // Required: Student identifier
  grade: number;                  // Required: Grade (0-100)
  feedback: string;               // Required: Feedback text (1-2000 chars)
  rubricScores?: Array<{          // Optional: Detailed rubric scoring
    criterion: string;            // Criterion name
    score: number;                // Score (0-100)
    maxScore: number;             // Maximum possible score
    comments?: string;            // Optional comments
  }>;
  gradingNotes?: string;          // Optional: Internal grading notes (max 1000 chars)
  gradedAt?: string;              // Optional: Custom grading timestamp
  allowResubmission?: boolean;    // Optional: Allow student to resubmit
  resubmissionDeadline?: string;  // Optional: Resubmission deadline (future date)
}
```

### Response Format
```typescript
{
  success: boolean;
  data?: {
    submissionId: string;
    assignmentId: string;
    studentId: string;
    grade: number;
    feedback: string;
    rubricScores?: Array<RubricScore>;
    gradingNotes?: string;
    gradedAt: string;
    gradedBy: string;
    allowResubmission: boolean;
    resubmissionDeadline?: string;
    totalRubricScore?: number;
    maxRubricScore?: number;
  };
  error?: {
    code: number;
    message: string;
  };
  requestId: string;
  timestamp: string;
}
```

## Access Control Matrix

| User Role | Can Grade | Can Access All Assignments | Notes |
|-----------|-----------|---------------------------|-------|
| Student | ❌ | ❌ | Cannot grade submissions |
| Instructor | ✅ | ❌ | Can only grade their own assignments |
| Administrator | ✅ | ✅ | Can grade any submission |

## DynamoDB Schema Requirements

### Submissions Table
```typescript
{
  assignmentId: string;           // Partition key
  userId: string;                 // Sort key (student ID)
  status: string;                 // Must be 'completed' for grading
  grade?: number;                 // Added during grading
  feedback?: string;              // Added during grading
  gradedAt?: string;              // Added during grading
  gradedBy?: string;              // Added during grading
  rubricScores?: Array<RubricScore>; // Added during grading
  gradingNotes?: string;          // Added during grading
  allowResubmission?: boolean;    // Added during grading
  resubmissionDeadline?: string;  // Added during grading
  version?: number;               // Optimistic locking version
  lastModified?: string;          // Last modification timestamp
  // ... other existing fields
}
```

### Optimistic Locking Fields
- **`version`**: Incremental counter for conflict detection
- **`lastModified`**: ISO timestamp of last modification
- **Condition Expression**: `attribute_not_exists(grade) AND (attribute_not_exists(version) OR version = :currentVersion)`

## Implementation Details

### Core Functions

#### `handler(event: APIGatewayProxyEvent)`
Main entry point that orchestrates the grading process:
1. JWT token verification
2. Request body parsing and validation
3. User access validation
4. Submission validation
5. Rubric score calculation
6. DynamoDB update with optimistic locking
7. Audit logging

#### `validateGradingAccess(user, params, requestId)`
Validates user permissions and assignment access:
- Role-based access control
- Assignment ownership verification
- Course enrollment validation

#### `validateSubmissionForGrading(params, requestId)`
Ensures submission is in gradable state:
- Submission existence check
- Status validation (must be 'completed')
- Duplicate grading prevention
- Resubmission deadline validation

#### `updateSubmissionGrade(gradingData, requestId)`
Implements optimistic locking with retry logic:
- Version conflict detection and retry
- Throughput error handling
- Exponential backoff strategy
- Comprehensive error handling

### Error Handling Strategy

#### Retryable Errors
- **`ConditionalCheckFailedException`**: Version conflicts (retry with backoff)
- **`ProvisionedThroughputExceededException`**: DynamoDB capacity issues (retry with backoff)

#### Non-Retryable Errors
- **`ResourceNotFoundException`**: Table or item not found
- **`ValidationException`**: Schema validation failures
- **`AccessDeniedException`**: Permission issues

#### Error Response Format
```typescript
{
  success: false,
  error: {
    code: number;        // HTTP status code
    message: string;     // Human-readable error message
  },
  requestId: string;     // For debugging and support
  timestamp: string;     // ISO timestamp
}
```

## Security Features

### Authentication & Authorization
- JWT token verification for all requests
- Role-based access control (RBAC)
- Assignment ownership validation
- Course enrollment verification

### Input Validation
- Comprehensive Zod schema validation
- Grade range validation (0-100)
- String length limits and sanitization
- Date validation for resubmission deadlines

### Data Integrity
- Optimistic locking prevents race conditions
- Version tracking for conflict detection
- Conditional updates ensure data consistency
- Audit logging for compliance

## Performance Optimizations

### DynamoDB Operations
- Conditional updates with optimistic locking
- Exponential backoff retry strategy
- Efficient query patterns
- Batch operation support for future enhancements

### Caching Strategy
- JWT token verification caching (future enhancement)
- Assignment metadata caching (future enhancement)
- User permission caching (future enhancement)

### Monitoring & Metrics
- Request ID tracking for debugging
- Comprehensive error logging
- Performance timing metrics
- Retry attempt tracking

## Testing

### Test Coverage
The function includes comprehensive unit tests covering:
- Authentication and authorization scenarios
- Input validation edge cases
- Business logic validation
- Optimistic locking and retry logic
- DynamoDB error handling
- Response format validation

### Test Categories
1. **Authentication & Authorization**: 8 test cases
2. **Input Validation**: 8 test cases  
3. **Submission Validation**: 3 test cases
4. **Successful Grading**: 3 test cases
5. **Optimistic Locking & DynamoDB**: 7 test cases
6. **Response Format**: 2 test cases

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="grade-submission.test.ts"

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Deployment

### Environment Variables
```bash
SUBMISSIONS_TABLE=submissions-table-name
ASSIGNMENTS_TABLE=assignments-table-name
```

### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/submissions-table",
        "arn:aws:dynamodb:*:*:table/assignments-table"
      ]
    }
  ]
}
```

### CloudWatch Logs
- Request ID tracking for debugging
- Error logging with context
- Performance metrics
- Audit trail logging

## Future Enhancements

### Planned Features
- **Batch Grading**: Grade multiple submissions simultaneously
- **Grade Templates**: Predefined grading rubrics
- **Grade History**: Track grade changes over time
- **Notification System**: Alert students of graded submissions
- **Analytics Dashboard**: Grading performance metrics

### Performance Improvements
- **Connection Pooling**: Optimize DynamoDB connections
- **Async Processing**: Background grade calculation
- **Caching Layer**: Redis-based caching for metadata
- **CDN Integration**: Optimize response delivery

### Security Enhancements
- **Rate Limiting**: Prevent abuse and DoS attacks
- **IP Whitelisting**: Restrict access to specific networks
- **Audit Trail**: Enhanced compliance logging
- **Encryption**: Field-level encryption for sensitive data

## Troubleshooting

### Common Issues

#### Version Conflict Errors
```
Error: Submission was modified by another process. Please refresh and try again.
```
**Cause**: Another process modified the submission while grading
**Solution**: Refresh the submission data and retry

#### Throughput Exceeded Errors
```
Error: Database temporarily unavailable. Please try again later.
```
**Cause**: DynamoDB capacity limits reached
**Solution**: Wait and retry, or contact administrators

#### Access Denied Errors
```
Error: Only instructors and admins can grade submissions
```
**Cause**: User lacks required permissions
**Solution**: Verify user role and assignment access

### Debug Information
- **Request ID**: Unique identifier for each request
- **Timestamp**: Exact time of request processing
- **User Context**: Role and permissions information
- **Error Details**: Specific error codes and messages

### Support Contacts
- **Technical Issues**: DevOps team
- **Permission Issues**: System administrators
- **Business Logic**: Course instructors
- **Emergency**: On-call engineer

## Related Documentation
- [Assignment Management README](./CREATE_ASSIGNMENT_README.md)
- [Submission Processing README](./PROCESS_VIDEO_SUBMISSION_README.md)
- [Submission Retrieval README](./FETCH_SUBMISSIONS_README.md)
- [JWT Verification Guide](./JWT_VERIFIER_README.md)
- [DynamoDB Operations Guide](./DYNAMODB_WRITE_OPERATIONS_README.md)

## Support & Maintenance

### Regular Maintenance
- **Log Rotation**: Monthly log cleanup
- **Performance Monitoring**: Weekly performance reviews
- **Security Updates**: Monthly security assessments
- **Backup Verification**: Weekly backup testing

### Monitoring Alerts
- **Error Rate**: Alert when error rate exceeds 5%
- **Response Time**: Alert when average response time exceeds 2 seconds
- **Retry Rate**: Alert when retry rate exceeds 20%
- **Throughput**: Alert when DynamoDB capacity utilization exceeds 80%

### Performance Metrics
- **Average Response Time**: Target < 500ms
- **Error Rate**: Target < 1%
- **Retry Success Rate**: Target > 95%
- **Concurrent Users**: Support up to 100 concurrent grading operations
