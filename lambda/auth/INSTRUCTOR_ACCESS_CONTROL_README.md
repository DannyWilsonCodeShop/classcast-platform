# Instructor Access Control System

## Overview

The Instructor Access Control System is a comprehensive security layer that ensures only authorized instructors and administrators can create assignments. It implements multiple validation layers, role-based access control, and continuous monitoring to maintain system security and integrity.

## 🔐 Security Architecture

### Multi-Layer Validation
1. **Authentication Layer** - JWT token verification
2. **Authorization Layer** - Role-based access control
3. **Permission Layer** - Instructor-specific validations
4. **Status Layer** - Account health monitoring
5. **Business Layer** - Operational constraints

### Access Control Flow
```
Request → JWT Verification → Role Check → Instructor Validation → Status Check → Course Access → Assignment Creation
```

## 🎯 Access Control Levels

### 1. Basic Role Validation
- **Students**: ❌ No access
- **Instructors**: ✅ Conditional access (with additional validations)
- **Administrators**: ✅ Full access (bypass instructor validations)

### 2. Account Status Validation
- **CONFIRMED**: ✅ Active accounts
- **UNCONFIRMED**: ❌ Pending email verification
- **ARCHIVED**: ❌ Deactivated accounts
- **COMPROMISED**: ❌ Security flagged accounts
- **RESET_REQUIRED**: ❌ Password reset pending

### 3. Instructor-Specific Validations
- **Instructor ID**: Must be present and valid
- **Department**: Must be assigned
- **Account Status**: Must be active and enabled
- **Course Access**: Must have at least one active course
- **Assignment Limits**: Monthly creation limits enforced
- **Review Status**: Account monitoring and warnings

## 🚨 Access Denial Scenarios

### Immediate Denial
| Scenario | Error Code | Reason |
|----------|------------|---------|
| Student role | `INSUFFICIENT_ROLE` | Only instructors and administrators can create assignments |
| Unconfirmed account | `ACCOUNT_INACTIVE` | Account must be confirmed and active |
| Archived account | `ACCOUNT_INACTIVE` | Account has been deactivated |
| Compromised account | `ACCOUNT_INACTIVE` | Account flagged for security reasons |

### Instructor-Specific Denial
| Scenario | Error Code | Reason |
|----------|------------|---------|
| Missing instructor ID | `MISSING_INSTRUCTOR_ID` | Instructor ID not found in system |
| Missing department | `MISSING_DEPARTMENT` | Department not assigned |
| Suspended account | `INSTRUCTOR_INACTIVE` | Account suspended by administration |
| Pending approval | `INSTRUCTOR_INACTIVE` | Account awaiting administrative approval |
| No active courses | `NO_ACTIVE_COURSES` | Must have at least one active course |

### Validation Errors
| Scenario | Error Code | Reason |
|----------|------------|---------|
| Database connection | `VALIDATION_ERROR` | Error validating access permissions |
| Permission check | `PERMISSION_VALIDATION_ERROR` | Error validating instructor permissions |

## 📊 Monitoring and Restrictions

### Assignment Creation Limits
- **Monthly Limit**: 50 assignments per instructor
- **Monitoring**: Real-time tracking of creation count
- **Enforcement**: Soft limit with warnings, hard limit with restrictions

### Account Health Monitoring
- **Review Status**: Automatic flagging for administrative review
- **Warning System**: Cumulative warning count tracking
- **Suspension Triggers**: Automatic suspension for repeated violations

### Course Access Requirements
- **Minimum Courses**: At least one active course required
- **Course Status**: Only active courses count toward access
- **Department Alignment**: Course department must match instructor

## 🔍 Validation Functions

### `validateInstructorAccess(user, requestId)`
Main access control function that orchestrates all validations.

**Parameters:**
- `user`: AuthenticatedUser object with role and permissions
- `requestId`: Unique request identifier for logging

**Returns:**
```typescript
{
  hasAccess: boolean;
  reason?: string;
  code?: string;
  restrictions?: string[];
}
```

**Validation Steps:**
1. Basic role check (instructor/admin)
2. Account status validation
3. Instructor-specific permission validation
4. Logging and audit trail

### `validateInstructorPermissions(user, requestId)`
Validates instructor-specific requirements and constraints.

**Validation Checks:**
- Instructor ID presence
- Department assignment
- Account status verification
- Assignment creation limits
- Active course requirements
- Review status monitoring

### `checkInstructorStatus(instructorId, requestId)`
Verifies instructor account health and status.

**Status Checks:**
- Account confirmation status
- Account enabled/disabled state
- Instructor-specific status (ACTIVE, SUSPENDED, PENDING_APPROVAL)
- System integration status

### `checkAssignmentCreationLimits(instructorId, requestId)`
Monitors and enforces assignment creation limits.

**Features:**
- Monthly rolling window calculation
- Real-time count tracking
- Configurable limits (default: 50/month)
- Graceful error handling

### `checkActiveCourses(instructorId, requestId)`
Ensures instructor has active courses for assignment creation.

**Requirements:**
- Minimum 1 active course
- Course status validation
- Department alignment verification

### `checkInstructorReviewStatus(instructorId, requestId)`
Monitors account health and administrative review status.

**Monitoring:**
- Review status flags
- Warning count tracking
- Administrative review triggers
- Suspension indicators

## 📝 Error Response Format

### Access Denied Response
```json
{
  "success": false,
  "error": "Forbidden",
  "details": {
    "error": "Instructor account is suspended",
    "code": "INSTRUCTOR_INACTIVE",
    "requestId": "req_1234567890_abc123def"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Error Codes Reference
| Code | Description | Action Required |
|------|-------------|-----------------|
| `INSUFFICIENT_ROLE` | User role doesn't have permission | Contact administration for role upgrade |
| `ACCOUNT_INACTIVE` | Account not confirmed or disabled | Complete email verification or contact support |
| `MISSING_INSTRUCTOR_ID` | Instructor ID not found | Contact administration for account setup |
| `MISSING_DEPARTMENT` | Department not assigned | Contact administration for department assignment |
| `INSTRUCTOR_INACTIVE` | Account suspended or pending | Contact administration for account review |
| `NO_ACTIVE_COURSES` | No active courses found | Enroll in or activate courses first |
| `VALIDATION_ERROR` | System validation error | Contact technical support |
| `PERMISSION_VALIDATION_ERROR` | Permission check failed | Contact technical support |

## 🛡️ Security Features

### Request Tracking
- **Unique Request IDs**: Every request gets a unique identifier
- **Audit Logging**: Comprehensive logging of all access attempts
- **Performance Monitoring**: Response time and success rate tracking

### Database Security
- **Indexed Queries**: Efficient database operations with proper indexing
- **Connection Pooling**: Optimized database connections
- **Error Handling**: Graceful degradation on database failures

### Rate Limiting
- **Monthly Limits**: Prevents assignment spam
- **Soft Enforcement**: Warnings before hard limits
- **Configurable Thresholds**: Adjustable limits per institution

## 🔧 Configuration

### Environment Variables
```bash
# Database Tables
ASSIGNMENTS_TABLE=DemoProject-Assignments
COURSES_TABLE=DemoProject-Courses
USERS_TABLE=DemoProject-Users

# Limits and Thresholds
MONTHLY_ASSIGNMENT_LIMIT=50
WARNING_THRESHOLD=3
REVIEW_FLAG_THRESHOLD=5
```

### Database Indexes Required
```sql
-- For efficient instructor status checks
CREATE INDEX InstructorStatusIndex ON Users(instructorId, status);

-- For assignment limit monitoring
CREATE INDEX InstructorCreatedIndex ON Assignments(instructorId, createdAt);

-- For course access validation
CREATE INDEX InstructorStatusIndex ON Courses(instructorId, status);
```

## 📈 Monitoring and Analytics

### Key Metrics
- **Access Success Rate**: Percentage of successful access attempts
- **Denial Reasons**: Distribution of access denial causes
- **Instructor Performance**: Assignment creation patterns
- **System Health**: Database performance and error rates

### Alerting
- **High Denial Rates**: Unusual access patterns
- **System Errors**: Database connection issues
- **Limit Exceeded**: Instructors approaching limits
- **Account Issues**: Suspended or flagged accounts

## 🚀 Performance Considerations

### Optimization Strategies
- **Caching**: User permission caching for repeated requests
- **Batch Operations**: Efficient database queries
- **Async Processing**: Non-blocking validation operations
- **Connection Reuse**: Database connection optimization

### Scalability
- **Horizontal Scaling**: Multiple Lambda instances
- **Database Sharding**: Partitioned data storage
- **CDN Integration**: Global content delivery
- **Load Balancing**: Request distribution

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual function validation
- **Integration Tests**: End-to-end workflow testing
- **Security Tests**: Access control validation
- **Performance Tests**: Load and stress testing

### Test Scenarios
- Valid instructor access
- Invalid role access
- Account status variations
- Database error handling
- Limit enforcement
- Review status monitoring

## 🔄 Maintenance and Updates

### Regular Tasks
- **Limit Adjustments**: Monthly assignment limit reviews
- **Account Cleanup**: Inactive account management
- **Performance Monitoring**: System health checks
- **Security Updates**: Vulnerability assessments

### Update Procedures
- **Schema Changes**: Database structure updates
- **Code Deployments**: Lambda function updates
- **Configuration Updates**: Environment variable changes
- **Index Management**: Database index optimization

## 🆘 Troubleshooting

### Common Issues

#### Access Denied Errors
1. **Check User Role**: Verify user has instructor or admin role
2. **Account Status**: Confirm account is confirmed and enabled
3. **Course Access**: Ensure user has active courses
4. **Department Assignment**: Verify department is assigned

#### Database Connection Issues
1. **Table Permissions**: Check DynamoDB table access
2. **Index Availability**: Verify required indexes exist
3. **Connection Limits**: Monitor connection pool usage
4. **Error Logs**: Review CloudWatch logs for details

#### Performance Issues
1. **Index Usage**: Verify proper index utilization
2. **Query Optimization**: Review database query patterns
3. **Caching**: Implement permission caching
4. **Monitoring**: Track response times and throughput

### Debug Information
- **Request IDs**: Unique identifiers for request tracking
- **Error Codes**: Specific error categorization
- **CloudWatch Logs**: Detailed execution logs
- **Performance Metrics**: Response time and success rates

## 🔮 Future Enhancements

### Planned Features
- **Real-time Monitoring**: Live dashboard for access control
- **Advanced Analytics**: Machine learning for anomaly detection
- **Automated Responses**: AI-powered access decisions
- **Integration APIs**: Third-party system integration

### Performance Improvements
- **Redis Caching**: High-performance permission caching
- **GraphQL**: Efficient data querying
- **WebSocket**: Real-time status updates
- **Edge Computing**: Global performance optimization

## 📚 Additional Resources

### Documentation
- [Assignment Creation Handler](./ASSIGNMENT_HANDLER_README.md)
- [Authentication System](./AUTHENTICATION_README.md)
- [Database Design](./DYNAMODB_DESIGN.md)
- [API Reference](./API_GATEWAY_README.md)

### Support
- **Technical Issues**: Contact development team
- **Access Requests**: Contact system administrators
- **Documentation**: Review troubleshooting guides
- **Training**: Request system training sessions

---

*This access control system ensures the highest level of security while maintaining system performance and user experience. Regular monitoring and updates ensure continued protection against unauthorized access.*

