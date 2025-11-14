# Fetch Assignments Handler

## Overview

The Fetch Assignments Handler is a comprehensive Lambda function that provides secure, filtered, and paginated access to assignments for both students and instructors. It implements role-based access control, advanced filtering capabilities, and efficient DynamoDB querying with proper error handling.

## 🔐 Access Control

### User Roles and Permissions

| Role | Access Level | Restrictions |
|------|-------------|--------------|
| **Students** | Limited | Can only view published assignments for enrolled courses |
| **Instructors** | Course-based | Can view assignments for their courses and department courses |
| **Administrators** | Full | Can view all assignments without restrictions |

### Access Control Rules

#### Students
- **Course ID Required**: Must specify `courseId` parameter
- **Status Restriction**: Only see published/active assignments
- **Enrollment Check**: Must be enrolled in the specified course
- **No Cross-Course Access**: Cannot view assignments from other courses

#### Instructors
- **Own Courses**: Full access to assignments they created
- **Department Courses**: Access to courses within their department
- **Self-Restriction**: Cannot view other instructors' assignments
- **Status Visibility**: Can see all statuses (draft, published, active, etc.)

#### Administrators
- **Full Access**: No restrictions on assignment viewing
- **All Statuses**: Can view assignments in any status
- **Cross-Department**: Access to assignments across all departments

## 🚀 API Endpoint

```
GET /assignments
```

### Authentication
- **Required**: JWT token in Authorization header
- **Format**: `Bearer <token>`

### Query Parameters

#### Basic Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `courseId` | string | Filter by specific course | `?courseId=CS101` |
| `instructorId` | string | Filter by instructor | `?instructorId=inst123` |
| `status` | enum | Filter by assignment status | `?status=published` |
| `type` | enum | Filter by assignment type | `?type=essay` |

#### Advanced Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `dueDateFrom` | ISO date | Filter assignments due after date | `?dueDateFrom=2024-01-01T00:00:00Z` |
| `dueDateTo` | ISO date | Filter assignments due before date | `?dueDateTo=2024-12-31T23:59:59Z` |
| `difficulty` | enum | Filter by difficulty level | `?difficulty=medium` |
| `submissionType` | enum | Filter by submission type | `?submissionType=individual` |
| `gradingType` | enum | Filter by grading method | `?gradingType=auto` |
| `tags` | comma-separated | Filter by tags | `?tags=essay,writing,academic` |
| `search` | string | Full-text search | `?search=programming` |

#### Sorting and Pagination
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `sortBy` | enum | Sort field | `dueDate` | `?sortBy=title` |
| `sortOrder` | enum | Sort direction | `asc` | `?sortOrder=desc` |
| `page` | number | Page number | `1` | `?page=2` |
| `limit` | number | Items per page | `20` | `?limit=50` |

#### Data Enrichment
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `includeStats` | boolean | Include submission statistics | `false` | `?includeStats=true` |
| `includeSubmissions` | boolean | Include submission info | `false` | `?includeSubmissions=true` |

### Parameter Values

#### Status Values
- `draft` - Assignment is in draft mode
- `published` - Assignment is published and visible
- `active` - Assignment is currently active
- `completed` - Assignment period has ended
- `archived` - Assignment is archived

#### Type Values
- `essay` - Written assignment
- `quiz` - Multiple choice or short answer
- `project` - Long-term project
- `presentation` - Oral presentation
- `lab` - Laboratory work
- `discussion` - Discussion participation
- `other` - Other assignment types

#### Difficulty Values
- `easy` - 1-50 points
- `medium` - 51-100 points
- `hard` - 101+ points

#### Submission Type Values
- `individual` - Individual submissions
- `group` - Group submissions

#### Grading Type Values
- `auto` - Automatic grading
- `peer` - Peer review grading
- `rubric` - Rubric-based grading
- `manual` - Manual grading

#### Sort Fields
- `dueDate` - Assignment due date
- `createdAt` - Assignment creation date
- `title` - Assignment title
- `points` - Assignment point value
- `status` - Assignment status

## 📊 Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": {
    "assignments": [
      {
        "assignmentId": "assignment_123",
        "title": "Introduction to Programming",
        "description": "Basic programming concepts and exercises",
        "courseId": "CS101",
        "instructorId": "inst123",
        "type": "project",
        "status": "published",
        "points": 100,
        "weight": 15,
        "dueDate": "2024-12-15T23:59:59.000Z",
        "startDate": "2024-11-01T00:00:00.000Z",
        "durationDays": 45,
        "allowLateSubmission": true,
        "latePenalty": 10,
        "maxSubmissions": 3,
        "allowedFileTypes": ["pdf", "docx", "zip"],
        "maxFileSize": 10485760,
        "individualSubmission": true,
        "autoGrade": false,
        "peerReview": true,
        "rubric": {
          "criteria": [
            {
              "name": "Code Quality",
              "description": "Clean, readable code",
              "maxPoints": 40,
              "weight": 40
            }
          ],
          "totalPoints": 100
        },
        "requirements": [
          "Submit working code",
          "Include documentation",
          "Test all functionality"
        ],
        "instructions": "Create a simple calculator application...",
        "attachments": [],
        "createdAt": "2024-11-01T10:00:00.000Z",
        "updatedAt": "2024-11-01T10:00:00.000Z",
        "createdBy": "inst123",
        "department": "Computer Science",
        "totalSubmissions": 0,
        "averageScore": 0,
        "completionRate": 0,
        "version": 1,
        "isActive": true,
        "searchableText": "introduction to programming basic concepts exercises",
        "tags": ["type:project", "difficulty:hard", "submission:individual", "grading:rubric"],
        "lastModifiedBy": "inst123",
        "lastModifiedAt": "2024-11-01T10:00:00.000Z",
        "courseInfo": {
          "courseId": "CS101",
          "courseName": "Introduction to Computer Science",
          "department": "Computer Science",
          "instructorName": "Dr. Smith"
        },
        "statistics": {
          "totalSubmissions": 25,
          "averageScore": 87,
          "completionRate": 92,
          "onTimeSubmissions": 22,
          "lateSubmissions": 3
        },
        "submissionInfo": {
          "submissionCount": 25,
          "lastSubmissionDate": "2024-12-10T15:30:00.000Z",
          "gradingStatus": "completed"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalCount": 100,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPage": 2,
      "previousPage": null
    },
    "filters": {
      "courseId": "CS101",
      "status": "published",
      "type": "project",
      "sortBy": "dueDate",
      "sortOrder": "asc"
    },
    "totalCount": 100
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705312200000_abc123def"
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "Forbidden",
  "details": {
    "error": "You are not enrolled in this course",
    "code": "NOT_ENROLLED",
    "requestId": "req_1705312200000_abc123def"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Filtering Logic

### Filter Application Order
1. **Primary Query**: DynamoDB index-based filtering
2. **Secondary Filtering**: In-memory filtering for complex criteria
3. **Sorting**: Applied to filtered results
4. **Pagination**: Applied to sorted results

### Filter Combinations
- **Course + Status**: Uses `CourseStatusIndex` for efficient querying
- **Instructor**: Uses `InstructorCreatedIndex` for instructor-specific queries
- **General Queries**: Falls back to scan with status filtering for students

### Search Implementation
- **Full-text Search**: Searches across title, description, and searchableText
- **Case-insensitive**: All search terms are converted to lowercase
- **Partial Matching**: Supports partial word matching

## 📈 Performance Considerations

### DynamoDB Indexes Required
```yaml
# CourseStatusIndex
PartitionKey: courseId
SortKey: status

# InstructorCreatedIndex
PartitionKey: instructorId
SortKey: createdAt

# CourseTitleIndex (for duplicate checking)
PartitionKey: courseId
SortKey: title
```

### Query Optimization
- **Index Selection**: Automatic index selection based on query parameters
- **Pagination**: Efficient handling of large result sets
- **Batch Processing**: Handles LastEvaluatedKey for seamless pagination
- **Result Limiting**: Safety limit of 10,000 items to prevent infinite loops

### Caching Strategy
- **User Permissions**: Cache user role and permissions
- **Course Access**: Cache course access validation results
- **Statistics**: Cache assignment statistics for performance

## 🛡️ Security Features

### Input Validation
- **Schema Validation**: Zod schema validation for all query parameters
- **Type Safety**: Strict type checking for all parameters
- **Range Validation**: Ensures pagination parameters are within bounds
- **Enum Validation**: Restricts parameter values to predefined options

### Access Control
- **JWT Verification**: Secure token-based authentication
- **Role-based Access**: Different permissions for different user types
- **Course Validation**: Ensures users can only access appropriate courses
- **Instructor Isolation**: Prevents cross-instructor data access

### Data Sanitization
- **SQL Injection Prevention**: Parameterized DynamoDB queries
- **XSS Prevention**: Proper response encoding
- **Input Sanitization**: Clean and validate all user inputs

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflow testing
- **Access Control Tests**: Permission validation testing
- **Error Handling Tests**: Failure scenario testing
- **Performance Tests**: Load and stress testing

### Test Scenarios
- **Authentication**: Valid/invalid JWT tokens
- **Authorization**: Different user roles and permissions
- **Filtering**: All filter combinations and edge cases
- **Pagination**: Various page sizes and navigation
- **Error Handling**: Database errors, validation failures
- **Performance**: Large datasets, concurrent requests

## 🔧 Configuration

### Environment Variables
```bash
# Database Tables
ASSIGNMENTS_TABLE=DemoProject-Assignments
COURSES_TABLE=DemoProject-Courses
USERS_TABLE=DemoProject-Users

# Optional Configuration
AUDIT_TABLE=DemoProject-AuditLogs
MAX_QUERY_RESULTS=10000
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### DynamoDB Configuration
- **Read Capacity**: Configure based on expected query volume
- **Indexes**: Ensure all required GSIs are created
- **TTL**: Configure automatic cleanup for old assignments
- **Backup**: Enable point-in-time recovery

## 📊 Monitoring and Logging

### Log Levels
- **INFO**: Successful operations, pagination details
- **WARN**: Non-critical failures, retry attempts
- **ERROR**: Critical failures, access denied, validation errors

### Metrics to Monitor
- **Response Time**: Average and percentile response times
- **Error Rates**: 4xx and 5xx error percentages
- **Query Performance**: DynamoDB query execution times
- **Access Patterns**: User role distribution and access patterns
- **Filter Usage**: Most commonly used filter combinations

### CloudWatch Alarms
- **High Error Rate**: Alert when error rate exceeds threshold
- **Slow Response Time**: Alert when response time is too high
- **Access Denied**: Monitor for unusual access patterns
- **Database Errors**: Alert on DynamoDB failures

## 🚨 Error Handling

### Error Categories
| Category | HTTP Status | Description | Action Required |
|----------|-------------|-------------|-----------------|
| **Authentication** | 401 | Invalid or missing JWT token | Provide valid token |
| **Authorization** | 403 | Insufficient permissions | Check user role and access |
| **Validation** | 400 | Invalid query parameters | Review parameter values |
| **Not Found** | 404 | Resource not found | Check resource existence |
| **Server Error** | 500 | Internal system error | Contact support |

### Error Codes
| Code | Description | Resolution |
|------|-------------|------------|
| `NOT_ENROLLED` | Student not enrolled in course | Verify course enrollment |
| `COURSE_ID_REQUIRED` | Course ID missing for student | Provide course ID parameter |
| `COURSE_ACCESS_DENIED` | Instructor cannot access course | Check course permissions |
| `INSTRUCTOR_MISMATCH` | Instructor ID mismatch | Use own instructor ID |
| `VALIDATION_ERROR` | Query parameter validation failed | Review parameter values |
| `RESOURCE_NOT_FOUND` | DynamoDB table not found | Check table configuration |
| `ACCESS_DENIED` | DynamoDB access denied | Check IAM permissions |

## 🔄 API Examples

### Student Viewing Course Assignments
```bash
GET /assignments?courseId=CS101&status=published&sortBy=dueDate&sortOrder=asc
```

### Instructor Viewing Their Assignments
```bash
GET /assignments?instructorId=inst123&includeStats=true&includeSubmissions=true
```

### Admin Viewing All Assignments
```bash
GET /assignments?status=active&type=project&page=1&limit=50
```

### Advanced Filtering
```bash
GET /assignments?courseId=CS101&type=essay&difficulty=medium&dueDateFrom=2024-01-01T00:00:00Z&tags=writing,academic&search=programming&sortBy=points&sortOrder=desc&page=2&limit=25&includeStats=true
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket support for live assignment updates
- **Advanced Search**: Elasticsearch integration for full-text search
- **Caching Layer**: Redis caching for frequently accessed data
- **Analytics Dashboard**: Assignment usage and performance metrics
- **Bulk Operations**: Support for bulk assignment retrieval

### Performance Improvements
- **Connection Pooling**: Optimize DynamoDB connection management
- **Parallel Processing**: Concurrent data enrichment operations
- **Smart Caching**: Intelligent cache invalidation strategies
- **Query Optimization**: Advanced DynamoDB query patterns

## 📚 Additional Resources

### Related Documentation
- [Assignment Creation Handler](./ASSIGNMENT_HANDLER_README.md)
- [Instructor Access Control](./INSTRUCTOR_ACCESS_CONTROL_README.md)
- [DynamoDB Write Operations](./DYNAMODB_WRITE_OPERATIONS_README.md)
- [JWT Authentication](./JWT_AUTHENTICATION_README.md)

### AWS Resources
- [DynamoDB Query Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Performance Optimization](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

### Support
- **Technical Issues**: Contact development team
- **Performance Issues**: Review CloudWatch metrics
- **Configuration Issues**: Check environment variables
- **Training**: Request system training sessions

---

*This comprehensive fetch assignments handler provides secure, efficient, and feature-rich access to assignment data with proper access control and error handling.*

