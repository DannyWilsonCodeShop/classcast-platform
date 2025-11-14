# Fetch Grades Lambda Function

## Overview
The Fetch Grades Lambda function provides comprehensive grade retrieval capabilities for students, instructors, and administrators. This function implements advanced filtering, sorting, pagination, and aggregation features to support both individual grade viewing and instructor dashboard analytics.

## Key Features

### ✅ **Core Functionality**
- **Role-Based Access Control**: Students can only view their own grades, instructors view their course grades, admins have full access
- **Comprehensive Filtering**: Multiple filter types including course, assignment, grade range, date ranges, and status
- **Advanced Sorting**: Sort by grade, dates, titles, and names in ascending or descending order
- **Smart Pagination**: Efficient pagination with page-based navigation and metadata
- **Data Enrichment**: Automatic inclusion of assignment, course, and instructor details
- **Aggregation Support**: Built-in analytics for instructor dashboards and reporting

### 🔍 **Advanced Filtering Capabilities**
- **Basic Filters**: Course ID, assignment ID, student ID
- **Date Range Filters**: Graded after/before, submitted after/before
- **Grade Range Filters**: Min/max grades, predefined grade categories (excellent, good, average, below_average, failing)
- **Status Filters**: Feedback presence, rubric scores, resubmission allowance
- **Search Filters**: Text search across feedback and grading notes
- **Dynamic Filtering**: Role-based available filter options

### 📊 **Aggregation & Analytics**
- **Grade Distribution**: Breakdown by grade ranges (90-100, 80-89, 70-79, 60-69, 0-59)
- **Course Breakdown**: Average grades and submission counts per course
- **Assignment Breakdown**: Performance metrics per assignment
- **Weekly Breakdown**: Temporal analysis with ISO week calculations
- **Statistical Summary**: Total submissions, average grades, distribution percentages

## API Specification

### Request Format (Query Parameters)
```typescript
{
  // Basic filters
  studentId?: string;           // Optional: Specific student ID
  assignmentId?: string;        // Optional: Specific assignment ID
  courseId?: string;            // Optional: Specific course ID
  
  // Date range filters
  gradedAfter?: string;         // Optional: ISO datetime (graded after this date)
  gradedBefore?: string;        // Optional: ISO datetime (graded before this date)
  submittedAfter?: string;      // Optional: ISO datetime (submitted after this date)
  submittedBefore?: string;     // Optional: ISO datetime (submitted before this date)
  
  // Grade range filters
  minGrade?: number;            // Optional: Minimum grade (0-100)
  maxGrade?: number;            // Optional: Maximum grade (0-100)
  gradeRange?: 'excellent' | 'good' | 'average' | 'below_average' | 'failing';
  
  // Status and feedback filters
  hasFeedback?: boolean;        // Optional: Has feedback text
  hasRubricScores?: boolean;    // Optional: Has detailed rubric scores
  allowResubmission?: boolean;  // Optional: Allows resubmission
  
  // Search filters
  searchTerm?: string;          // Optional: Search in feedback/notes (max 100 chars)
  
  // Pagination
  page?: number;                // Optional: Page number (default: 1, min: 1)
  limit?: number;               // Optional: Items per page (default: 20, max: 100)
  
  // Sorting
  sortBy?: 'grade' | 'gradedAt' | 'submittedAt' | 'assignmentTitle' | 'courseName' | 'instructorName';
  sortOrder?: 'asc' | 'desc';   // Optional: Sort order (default: 'desc')
  
  // Aggregation options
  includeAggregates?: boolean;  // Optional: Include analytics (default: false)
  groupBy?: 'course' | 'assignment' | 'instructor' | 'week'; // Optional: Grouping for breakdowns
  
  // Response options
  includeAssignmentDetails?: boolean;  // Optional: Include assignment info (default: true)
  includeCourseDetails?: boolean;      // Optional: Include course info (default: true)
  includeInstructorDetails?: boolean;  // Optional: Include instructor info (default: false)
}
```

### Response Format
```typescript
{
  success: boolean;
  data: {
    grades: Array<GradeRecord>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    aggregates?: GradeAggregates;
    filters: {
      applied: Record<string, any>;
      available: {
        courses: Array<{ id: string; name: string }>;
        assignments: Array<{ id: string; title: string; courseId: string }>;
        instructors: Array<{ id: string; name: string }>;
      };
    };
  };
  error?: {
    code: number;
    message: string;
  };
  requestId: string;
  timestamp: string;
}
```

### Grade Record Structure
```typescript
interface GradeRecord {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName?: string;
  grade: number;
  feedback: string;
  gradedAt: string;
  gradedBy: string;
  instructorName?: string;
  submittedAt: string;
  allowResubmission: boolean;
  resubmissionDeadline?: string;
  rubricScores?: Array<{
    criterion: string;
    score: number;
    maxScore: number;
    comments?: string;
  }>;
  totalRubricScore?: number;
  maxRubricScore?: number;
  gradingNotes?: string;
}
```

### Aggregates Structure
```typescript
interface GradeAggregates {
  totalSubmissions: number;
  averageGrade: number;
  gradeDistribution: {
    excellent: number;    // 90-100
    good: number;         // 80-89
    average: number;      // 70-79
    below_average: number; // 60-69
    failing: number;      // 0-59
  };
  courseBreakdown?: Array<{
    courseId: string;
    courseName: string;
    count: number;
    averageGrade: number;
  }>;
  assignmentBreakdown?: Array<{
    assignmentId: string;
    assignmentTitle: string;
    count: number;
    averageGrade: number;
  }>;
  weeklyBreakdown?: Array<{
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    count: number;
    averageGrade: number;
  }>;
}
```

## Access Control Matrix

| User Role | Can View | Scope | Available Filters | Aggregates |
|-----------|----------|-------|-------------------|------------|
| **Student** | Own grades only | Personal submissions | Limited (own data) | Basic (own stats) |
| **Instructor** | Course grades | Assigned courses | Full (courses/assignments) | Full analytics |
| **Administrator** | All grades | System-wide | Full (all options) | Full analytics |

### Student Access Restrictions
- **Automatic Filtering**: `studentId` is automatically set to current user
- **No Cross-Student Access**: Cannot view other students' grades
- **Limited Filter Options**: Only sees available courses and assignments

### Instructor Access Restrictions
- **Course-Based Access**: Limited to courses they teach
- **Assignment Filtering**: Can only view grades for their assignments
- **Student Privacy**: Can view all student grades within their courses

### Administrator Access
- **Full System Access**: Can view all grades across all courses
- **Complete Analytics**: Access to system-wide statistics and breakdowns
- **Unrestricted Filtering**: All filter options available

## Filtering Examples

### Basic Grade Range Filtering
```bash
GET /fetch-grades?minGrade=80&maxGrade=95
```
Returns grades between 80 and 95 (inclusive).

### Grade Category Filtering
```bash
GET /fetch-grades?gradeRange=excellent
```
Returns only grades 90-100.

### Date Range Filtering
```bash
GET /fetch-grades?gradedAfter=2024-01-01T00:00:00Z&gradedBefore=2024-01-31T23:59:59Z
```
Returns grades assigned in January 2024.

### Course-Specific Filtering
```bash
GET /fetch-grades?courseId=CS101&includeAggregates=true&groupBy=assignment
```
Returns all grades for CS101 with assignment breakdown analytics.

### Advanced Combined Filtering
```bash
GET /fetch-grades?courseId=CS101&minGrade=70&hasFeedback=true&sortBy=grade&sortOrder=desc&page=1&limit=10
```
Returns top 10 grades for CS101 (70+) with feedback, sorted by grade descending.

## Aggregation Examples

### Basic Analytics
```bash
GET /fetch-grades?includeAggregates=true
```
Returns overall statistics including total submissions, average grade, and grade distribution.

### Course Breakdown
```bash
GET /fetch-grades?includeAggregates=true&groupBy=course
```
Returns analytics grouped by course with per-course averages and counts.

### Weekly Performance Analysis
```bash
GET /fetch-grades?includeAggregates=true&groupBy=week&gradedAfter=2024-01-01T00:00:00Z
```
Returns weekly performance breakdown for 2024 with week numbers and date ranges.

### Assignment Performance
```bash
GET /fetch-grades?includeAggregates=true&groupBy=assignment&courseId=CS101
```
Returns assignment-specific analytics for CS101 course.

## DynamoDB Schema Requirements

### Submissions Table (with GSI)
```typescript
{
  // Primary Key
  assignmentId: string;           // Partition key
  userId: string;                 // Sort key (student ID)
  
  // Grade Information
  grade: number;                  // 0-100 grade value
  feedback: string;               // Instructor feedback
  gradedAt: string;              // ISO datetime when graded
  gradedBy: string;              // Instructor ID who graded
  
  // Submission Information
  courseId: string;               // Course identifier
  submittedAt: string;            // ISO datetime when submitted
  status: string;                 // Submission status
  
  // Additional Grade Data
  rubricScores?: Array<RubricScore>;
  totalRubricScore?: number;
  maxRubricScore?: number;
  gradingNotes?: string;
  allowResubmission: boolean;
  resubmissionDeadline?: string;
  
  // Metadata
  version?: number;               // Optimistic locking version
  lastModified?: string;          // Last modification timestamp
}
```

### Required Global Secondary Indexes
```typescript
// GradeIndex - For efficient grade queries
{
  IndexName: 'GradeIndex',
  KeySchema: [
    { AttributeName: 'gradeStatus', KeyType: 'HASH' },    // 'graded' for all graded submissions
    { AttributeName: 'gradedAt', KeyType: 'RANGE' }       // For date-based queries
  ],
  Projection: {
    ProjectionType: 'INCLUDE',
    NonKeyAttributes: ['assignmentId', 'userId', 'courseId', 'grade', 'feedback', 'gradedBy', 'submittedAt', 'allowResubmission', 'resubmissionDeadline', 'rubricScores', 'totalRubricScore', 'maxRubricScore', 'gradingNotes']
  }
}

// CourseIndex - For course-based queries
{
  IndexName: 'CourseIndex',
  KeySchema: [
    { AttributeName: 'courseId', KeyType: 'HASH' },
    { AttributeName: 'gradedAt', KeyType: 'RANGE' }
  ],
  Projection: {
    ProjectionType: 'INCLUDE',
    NonKeyAttributes: ['assignmentId', 'userId', 'grade', 'feedback', 'gradedBy', 'submittedAt']
  }
}
```

## Implementation Details

### Core Functions

#### `handler(event: APIGatewayProxyEvent)`
Main entry point that orchestrates the grade retrieval process:
1. JWT token verification and user authentication
2. Query parameter parsing and validation
3. User access validation and permission checking
4. DynamoDB query execution with role-based filtering
5. Result filtering, sorting, and pagination
6. Data enrichment with assignment/course details
7. Aggregation calculation (if requested)
8. Response building with metadata

#### `validateGradeAccess(user, params, requestId)`
Validates user permissions and enforces access controls:
- **Student Access**: Forces `studentId` to current user, prevents cross-student access
- **Instructor Access**: Validates course ownership and assignment access
- **Admin Access**: Full system access with no restrictions

#### `executeGradeQuery(user, params, requestId)`
Executes the main DynamoDB query with role-based filtering:
- **Student Queries**: Automatically filters by `userId`
- **Instructor Queries**: Filters by instructor's courses
- **Admin Queries**: No additional filtering restrictions

#### `applyGradeFilters(grades, params, requestId)`
Applies client-side filtering for complex criteria:
- **Date Range Filtering**: ISO datetime comparison
- **Grade Range Filtering**: Numeric and categorical filtering
- **Status Filtering**: Boolean and presence checks
- **Search Filtering**: Text-based filtering across multiple fields

#### `sortGradeResults(grades, sortBy, sortOrder)`
Implements multi-field sorting with fallback logic:
- **Grade Sorting**: Numeric sorting with proper handling
- **Date Sorting**: ISO datetime sorting
- **Text Sorting**: String-based sorting with null handling
- **Default Sorting**: Falls back to `gradedAt` descending

#### `calculateGradeAggregates(grades, groupBy)`
Calculates comprehensive analytics and breakdowns:
- **Basic Statistics**: Total count, averages, distributions
- **Course Breakdown**: Per-course performance metrics
- **Assignment Breakdown**: Per-assignment statistics
- **Weekly Breakdown**: Temporal analysis with ISO week calculations

### Performance Optimizations

#### Query Efficiency
- **GSI Usage**: Leverages Global Secondary Indexes for efficient queries
- **Projection**: Only retrieves required fields to minimize data transfer
- **Filtering**: Combines database-level and application-level filtering
- **Pagination**: Implements efficient offset-based pagination

#### Caching Strategy
- **Assignment Metadata**: Caches assignment details during enrichment
- **Course Metadata**: Caches course information for repeated access
- **User Permissions**: Caches instructor course assignments

#### Memory Management
- **Streaming Processing**: Processes large result sets in chunks
- **Object Reuse**: Minimizes object creation during processing
- **Efficient Filtering**: Uses native array methods for client-side filtering

## Testing Strategy

### Test Coverage
The function includes comprehensive unit tests covering:
- **Authentication & Authorization**: 6 test cases
- **Input Validation**: 5 test cases
- **Filtering Functionality**: 9 test cases
- **Sorting Functionality**: 4 test cases
- **Pagination Functionality**: 3 test cases
- **Data Enrichment**: 3 test cases
- **Aggregation Functionality**: 4 test cases
- **Available Filters**: 3 test cases
- **Error Handling**: 3 test cases
- **Response Format**: 3 test cases

### Test Categories
1. **Unit Tests**: Individual function testing with mocked dependencies
2. **Integration Tests**: End-to-end handler testing with mock events
3. **Edge Case Testing**: Boundary conditions and error scenarios
4. **Performance Testing**: Large dataset handling and pagination
5. **Security Testing**: Access control and permission validation

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="fetch-grades.test.ts"

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
COURSES_TABLE=courses-table-name
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
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/submissions-table",
        "arn:aws:dynamodb:*:*:table/submissions-table/index/*",
        "arn:aws:dynamodb:*:*:table/assignments-table",
        "arn:aws:dynamodb:*:*:table/courses-table"
      ]
    }
  ]
}
```

### CloudWatch Logs
- **Request ID Tracking**: Unique identifier for each request
- **Performance Metrics**: Query execution time and result counts
- **Error Logging**: Comprehensive error context and stack traces
- **Access Logging**: User authentication and permission checks

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Statistical analysis (median, standard deviation, percentiles)
- **Export Functionality**: CSV/Excel export for grade reports
- **Real-time Updates**: WebSocket support for live grade updates
- **Grade Trends**: Historical performance tracking and visualization
- **Custom Aggregations**: User-defined grouping and calculation rules

### Performance Improvements
- **Connection Pooling**: Optimize DynamoDB connection management
- **Result Caching**: Redis-based caching for frequently accessed data
- **Async Processing**: Background aggregation for large datasets
- **CDN Integration**: Optimize response delivery for global users

### Security Enhancements
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Audit Logging**: Enhanced compliance and security monitoring
- **Field-Level Encryption**: Encrypt sensitive grade information
- **IP Whitelisting**: Restrict access to specific networks

## Troubleshooting

### Common Issues

#### Performance Issues
```
Error: DynamoDB query timeout
```
**Cause**: Large result sets or inefficient queries
**Solution**: Implement pagination, use appropriate GSIs, optimize filter expressions

#### Access Control Issues
```
Error: Students can only view their own grades
```
**Cause**: Student attempting to access other students' grades
**Solution**: Verify user role and ensure proper access control implementation

#### Filter Validation Issues
```
Error: Invalid parameters: Number must be greater than or equal to 0
```
**Cause**: Invalid grade range values
**Solution**: Validate input parameters and provide clear error messages

### Debug Information
- **Request ID**: Unique identifier for each request
- **User Context**: Role, permissions, and access level
- **Query Parameters**: Applied filters and search criteria
- **Performance Metrics**: Query execution time and result counts

### Support Contacts
- **Technical Issues**: DevOps team
- **Access Control**: System administrators
- **Business Logic**: Course instructors
- **Emergency**: On-call engineer

## Related Documentation

- [Grade Submission README](./GRADE_SUBMISSION_README.md) - Grade creation and management
- [Assignment Management README](./CREATE_ASSIGNMENT_README.md) - Assignment lifecycle
- [Submission Processing README](./PROCESS_VIDEO_SUBMISSION_README.md) - Video submission workflow
- [JWT Verification Guide](./JWT_VERIFIER_README.md) - Authentication implementation
- [DynamoDB Operations Guide](./DYNAMODB_WRITE_OPERATIONS_README.md) - Database patterns

## Support & Maintenance

### Regular Maintenance
- **Performance Monitoring**: Weekly query performance reviews
- **Access Control Audits**: Monthly permission validation
- **Data Quality Checks**: Weekly grade data integrity verification
- **Index Optimization**: Monthly GSI performance analysis

### Monitoring Alerts
- **Response Time**: Alert when average response time exceeds 1 second
- **Error Rate**: Alert when error rate exceeds 2%
- **Query Performance**: Alert when DynamoDB query time exceeds 500ms
- **Memory Usage**: Alert when Lambda memory utilization exceeds 80%

### Performance Metrics
- **Average Response Time**: Target < 500ms
- **Error Rate**: Target < 1%
- **Query Efficiency**: Target < 200ms for DynamoDB operations
- **Concurrent Users**: Support up to 200 simultaneous grade retrieval requests

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team

