# Assignment Creation Handler

## Overview

The Assignment Creation Handler is a comprehensive AWS Lambda function that allows instructors and administrators to create new assignments with extensive validation, business logic checks, and metadata generation.

## Features

### 🔐 Authentication & Authorization
- JWT token verification
- Role-based access control (instructors and admins only)
- Course access validation
- Department-level permissions

### ✅ Comprehensive Validation
- Input sanitization and trimming
- Schema validation using Zod
- Business rule validation
- Duplicate prevention
- Date constraint validation

### 📊 Enhanced Metadata
- Automatic tag generation
- Searchable text indexing
- Duration calculations
- Version tracking
- Audit trail

### 🚀 Performance & Reliability
- Request ID tracking
- Comprehensive error handling
- Graceful fallbacks
- TTL for automatic cleanup

## API Endpoint

```
POST /assignments
```

## Request Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Request Body Schema

### Required Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | string | 3-200 chars, no whitespace-only | Assignment title |
| `description` | string | 10-2000 chars, no whitespace-only | Assignment description |
| `courseId` | string | 1-50 chars, alphanumeric + underscore/hyphen | Course identifier |
| `type` | enum | essay, quiz, project, presentation, lab, discussion, other | Assignment type |
| `points` | number | 1-1000, integer | Maximum points possible |
| `weight` | number | 0.1-100 | Weight percentage in course |
| `dueDate` | string | Future date, max 2 years | Assignment due date |
| `startDate` | string | Valid date, max 1 year ago | Assignment start date |
| `maxSubmissions` | number | 1-10, integer | Maximum submission attempts |
| `allowedFileTypes` | string[] | 1-20 types, valid MIME/extensions | Allowed file types |
| `maxFileSize` | number | 1KB-100MB (instructors: 50MB max) | Maximum file size |
| `individualSubmission` | boolean | true/false | Individual vs group submission |
| `autoGrade` | boolean | true/false | Enable automatic grading |
| `peerReview` | boolean | true/false | Enable peer review |
| `requirements` | string[] | 1-50 items, 5-500 chars each | Assignment requirements |

### Optional Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `allowLateSubmission` | boolean | true/false | Allow late submissions |
| `latePenalty` | number | 0-100 | Late penalty percentage |
| `rubric` | object | See rubric schema below | Grading rubric |
| `instructions` | string | 10-5000 chars | Additional instructions |
| `attachments` | object[] | Max 10 items | Reference attachments |

### Rubric Schema

```typescript
{
  criteria: [
    {
      name: string,           // 1-100 chars
      description: string,    // 1-500 chars
      maxPoints: number,      // 0.1-1000
      weight: number          // 0.1-100, must sum to 100%
    }
  ],
  totalPoints: number         // Must match sum of criteria points
}
```

## Validation Rules

### Input Sanitization
- All string fields are automatically trimmed
- Whitespace-only strings are rejected
- File types are validated for valid MIME types or extensions

### Date Constraints
- Start date must be before due date
- Due date must be in the future
- Start date cannot be more than 1 year in the past
- Due date cannot be more than 2 years in the future

### Business Logic
- Late penalty must be specified when late submission is allowed
- Rubric criteria weights must sum to 100%
- Rubric total points must match sum of criteria points
- File size limits based on user role (instructors: 50MB, admins: 100MB)
- Group submissions typically allow only 1 submission per group

### Duplicate Prevention
- Assignment titles must be unique within the same course
- Automatic duplicate detection with helpful suggestions

## Response Format

### Success Response (201)

```json
{
  "success": true,
  "data": {
    "message": "Assignment created successfully",
    "assignment": {
      "assignmentId": "assignment_1234567890_abc123def",
      "title": "Introduction to Algorithms",
      "description": "A comprehensive introduction...",
      "courseId": "CS101",
      "type": "project",
      "points": 100,
      "weight": 15,
      "status": "draft",
      "visibility": "private",
      "startDate": "2024-01-15T00:00:00.000Z",
      "dueDate": "2024-01-22T23:59:59.000Z",
      "durationDays": 7,
      "maxSubmissions": 3,
      "allowedFileTypes": ["pdf", "docx", "zip"],
      "maxFileSize": 10485760,
      "individualSubmission": true,
      "autoGrade": false,
      "peerReview": true,
      "requirements": [
        "Implement at least 3 sorting algorithms",
        "Provide time complexity analysis",
        "Include unit tests for all functions"
      ],
      "instructions": "Create a comprehensive implementation...",
      "rubric": {
        "criteria": [
          {
            "name": "Implementation",
            "description": "Correct implementation of algorithms",
            "maxPoints": 40,
            "weight": 40
          },
          {
            "name": "Documentation",
            "description": "Clear and comprehensive documentation",
            "maxPoints": 30,
            "weight": 30
          },
          {
            "name": "Testing",
            "description": "Thorough unit test coverage",
            "maxPoints": 30,
            "weight": 30
          }
        ],
        "totalPoints": 100
      },
      "attachments": [],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "createdBy": "user123",
      "department": "Computer Science",
      "totalSubmissions": 0,
      "averageScore": 0,
      "completionRate": 0,
      "version": 1,
      "isActive": true,
      "searchableText": "introduction to algorithms a comprehensive introduction...",
      "tags": [
        "type:project",
        "difficulty:hard",
        "submission:individual",
        "grading:peer",
        "grading:rubric",
        "timing:soon"
      ],
      "lastModifiedBy": "user123",
      "lastModifiedAt": "2024-01-15T10:00:00.000Z",
      "ttl": 1735689600
    },
    "assignmentId": "assignment_1234567890_abc123def",
    "requestId": "req_1234567890_abc123def"
  },
  "message": "Assignment has been created and is ready for use",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Error Response (400, 401, 403, 409, 500)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "errors": [
      {
        "field": "title",
        "message": "Title cannot be only whitespace",
        "received": "   "
      },
      {
        "field": "dueDate",
        "message": "Due date must be a valid future date",
        "received": "2023-01-01T00:00:00.000Z"
      }
    ],
    "message": "Please check your input and try again"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Validation failed, malformed JSON |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions or course access denied |
| 409 | Conflict | Duplicate assignment title in course |
| 500 | Internal Server Error | Database error or unexpected failure |

## Usage Examples

### Basic Assignment Creation

```bash
curl -X POST https://api.example.com/assignments \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Final Project",
    "description": "Comprehensive project demonstrating course concepts",
    "courseId": "CS101",
    "type": "project",
    "points": 200,
    "weight": 25,
    "dueDate": "2024-05-15T23:59:59.000Z",
    "startDate": "2024-04-01T00:00:00.000Z",
    "maxSubmissions": 2,
    "allowedFileTypes": ["pdf", "zip"],
    "maxFileSize": 52428800,
    "individualSubmission": false,
    "autoGrade": false,
    "peerReview": true,
    "requirements": [
      "Implement all required features",
      "Include comprehensive documentation",
      "Provide test cases"
    ]
  }'
```

### Assignment with Rubric

```bash
curl -X POST https://api.example.com/assignments \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Research Paper",
    "description": "Write a research paper on a chosen topic",
    "courseId": "ENG201",
    "type": "essay",
    "points": 150,
    "weight": 30,
    "dueDate": "2024-04-30T23:59:59.000Z",
    "startDate": "2024-03-15T00:00:00.000Z",
    "maxSubmissions": 1,
    "allowedFileTypes": ["pdf", "docx"],
    "maxFileSize": 10485760,
    "individualSubmission": true,
    "autoGrade": false,
    "peerReview": false,
    "requirements": [
      "Minimum 2000 words",
      "Include at least 5 sources",
      "Follow APA format"
    ],
    "rubric": {
      "criteria": [
        {
          "name": "Content Quality",
          "description": "Depth and relevance of research",
          "maxPoints": 60,
          "weight": 40
        },
        {
          "name": "Writing Style",
          "description": "Clarity and coherence",
          "maxPoints": 45,
          "weight": 30
        },
        {
          "name": "Citations",
          "description": "Proper source attribution",
          "maxPoints": 45,
          "weight": 30
        }
      ],
      "totalPoints": 150
    }
  }'
```

## Database Schema

### DynamoDB Table: Assignments

| Attribute | Type | Description |
|-----------|------|-------------|
| `assignmentId` | String (Partition Key) | Unique identifier |
| `courseId` | String | Course reference |
| `instructorId` | String | Instructor reference |
| `title` | String | Assignment title |
| `description` | String | Assignment description |
| `type` | String | Assignment type |
| `status` | String | Current status |
| `visibility` | String | Visibility setting |
| `points` | Number | Maximum points |
| `weight` | Number | Course weight percentage |
| `startDate` | String | Start date (ISO) |
| `dueDate` | String | Due date (ISO) |
| `durationDays` | Number | Calculated duration |
| `maxSubmissions` | Number | Max submission attempts |
| `allowedFileTypes` | String Set | Allowed file types |
| `maxFileSize` | Number | Max file size in bytes |
| `individualSubmission` | Boolean | Individual vs group |
| `autoGrade` | Boolean | Auto-grading enabled |
| `peerReview` | Boolean | Peer review enabled |
| `requirements` | String List | Assignment requirements |
| `instructions` | String | Additional instructions |
| `rubric` | Map | Grading rubric |
| `attachments` | List | Reference attachments |
| `createdAt` | String | Creation timestamp |
| `updatedAt` | String | Last update timestamp |
| `createdBy` | String | Creator user ID |
| `department` | String | Department |
| `totalSubmissions` | Number | Submission count |
| `averageScore` | Number | Average score |
| `completionRate` | Number | Completion percentage |
| `version` | Number | Version number |
| `isActive` | Boolean | Active status |
| `searchableText` | String | Search index |
| `tags` | String List | Auto-generated tags |
| `lastModifiedBy` | String | Last modifier |
| `lastModifiedAt` | String | Last modification time |
| `ttl` | Number | Expiration timestamp |

### Global Secondary Indexes

#### CourseTitleIndex
- Partition Key: `courseId`
- Sort Key: `title`
- Purpose: Duplicate detection and course-based queries

#### DepartmentTypeIndex
- Partition Key: `department`
- Sort Key: `type`
- Purpose: Department-based assignment queries

#### StatusDueDateIndex
- Partition Key: `status`
- Sort Key: `dueDate`
- Purpose: Status-based queries and scheduling

## Security Considerations

### Authentication
- JWT tokens required for all requests
- Token expiration and refresh handling
- Secure token storage and transmission

### Authorization
- Role-based access control (RBAC)
- Course-level permissions
- Department-level restrictions

### Input Validation
- Comprehensive input sanitization
- SQL injection prevention
- XSS protection through proper encoding

### Data Protection
- Sensitive data encryption at rest
- Secure transmission (HTTPS)
- Audit logging for compliance

## Performance Optimizations

### Database
- Efficient indexing strategy
- Query optimization
- Connection pooling

### Caching
- Response caching for static data
- User permission caching
- Course access caching

### Monitoring
- Request ID tracking
- Performance metrics
- Error rate monitoring

## Testing

### Unit Tests
- Comprehensive test coverage
- Mock dependencies
- Edge case testing

### Integration Tests
- API endpoint testing
- Database integration
- Authentication flow

### Load Testing
- Performance under load
- Concurrent user handling
- Database performance

## Deployment

### Environment Variables
```bash
ASSIGNMENTS_TABLE=DemoProject-Assignments
COURSES_TABLE=DemoProject-Courses
USERS_TABLE=DemoProject-Users
```

### Infrastructure
- AWS Lambda function
- DynamoDB tables
- API Gateway integration
- CloudWatch monitoring

## Troubleshooting

### Common Issues

1. **Validation Errors**
   - Check field requirements and constraints
   - Verify date formats and ranges
   - Ensure rubric consistency

2. **Permission Denied**
   - Verify user role (instructor/admin)
   - Check course access permissions
   - Validate JWT token

3. **Duplicate Assignment**
   - Use unique titles within courses
   - Check existing assignments
   - Consider version numbering

4. **Database Errors**
   - Verify table permissions
   - Check connection limits
   - Monitor DynamoDB capacity

### Debug Information
- Request ID in all responses
- Detailed error messages
- CloudWatch logs
- Performance metrics

## Future Enhancements

### Planned Features
- Bulk assignment creation
- Template-based assignments
- Advanced scheduling options
- Integration with LMS systems

### Performance Improvements
- GraphQL support
- Real-time updates
- Advanced caching strategies
- Database optimization

## Support

For technical support or questions:
- Check the troubleshooting section
- Review CloudWatch logs
- Contact the development team
- Submit issues through the project repository
