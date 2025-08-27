# DemoProject API Gateway

This document describes the API Gateway configuration with Lambda integration for DemoProject, providing a RESTful API for user management, file uploads, and course management.

## Overview

The API Gateway is configured with:
- **REST API**: RESTful endpoints for various services
- **Lambda Integration**: Serverless backend functions
- **Cognito Authorization**: JWT-based authentication
- **CORS Support**: Cross-origin resource sharing enabled
- **Request/Response Logging**: Comprehensive API monitoring

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App   │────│   API Gateway   │────│  Lambda        │
└─────────────────┘    └──────────────────┘    │  Functions     │
                                │              └─────────────────┘
                                ▼
                       ┌──────────────────┐
                       │  Cognito        │
                       │  Authorizer     │
                       └──────────────────┘
```

## API Endpoints

### Base URL
```
https://{api-id}.execute-api.{region}.amazonaws.com/prod
```

### 1. Health Check (Public)
**Endpoint**: `GET /health`

**Description**: Public health check endpoint to verify API status

**Response**:
```json
{
  "message": "DemoProject API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "region": "us-east-1"
}
```

### 2. User Management (Authenticated)

#### List Users
**Endpoint**: `GET /users`

**Description**: Retrieve list of all users (admin only)

**Headers**:
```
Authorization: Bearer {jwt-token}
```

**Response**:
```json
{
  "users": [
    {
      "userId": "john.doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "status": "CONFIRMED"
    }
  ]
}
```

#### Get User
**Endpoint**: `GET /users/{userId}`

**Description**: Retrieve specific user information

**Parameters**:
- `userId`: Username of the user

**Response**:
```json
{
  "user": {
    "userId": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "department": "ComputerScience",
    "status": "CONFIRMED"
  }
}
```

#### Create User
**Endpoint**: `POST /users`

**Description**: Create a new user account

**Request Body**:
```json
{
  "username": "jane.smith",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "instructor",
  "department": "Mathematics"
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "userId": "jane.smith"
}
```

#### Update User
**Endpoint**: `PUT /users/{userId}`

**Description**: Update user information

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Computer Science"
}
```

**Response**:
```json
{
  "message": "User updated successfully"
}
```

#### Delete User
**Endpoint**: `DELETE /users/{userId}`

**Description**: Delete a user account

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

### 3. File Upload (Authenticated)

#### Generate Upload URL
**Endpoint**: `POST /upload`

**Description**: Generate a presigned S3 URL for file upload

**Request Body**:
```json
{
  "fileName": "assignment.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "userId": "john.doe",
  "folder": "assignments"
}
```

**Response**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "key": "assignments/john.doe/assignment.pdf",
  "expiresIn": 3600
}
```

#### List User Files
**Endpoint**: `GET /upload?userId={userId}&folder={folder}`

**Description**: List files uploaded by a specific user

**Query Parameters**:
- `userId`: User ID (required)
- `folder`: Folder path (optional)

**Response**:
```json
{
  "files": [
    {
      "key": "assignments/john.doe/assignment.pdf",
      "size": 1024000,
      "lastModified": "2024-01-01T00:00:00.000Z",
      "fileName": "assignment.pdf"
    }
  ]
}
```

### 4. Course Management (Authenticated)

#### List Courses
**Endpoint**: `GET /courses`

**Description**: Retrieve list of all courses

**Response**:
```json
{
  "courses": [
    {
      "courseId": "course_1704067200000",
      "title": "Introduction to Computer Science",
      "description": "Basic concepts of programming",
      "instructorId": "prof.smith",
      "department": "Computer Science",
      "credits": 3,
      "startDate": "2024-01-15",
      "endDate": "2024-05-15",
      "status": "active"
    }
  ]
}
```

#### Get Course
**Endpoint**: `GET /courses/{courseId}`

**Description**: Retrieve specific course information

**Response**:
```json
{
  "course": {
    "courseId": "course_1704067200000",
    "title": "Introduction to Computer Science",
    "description": "Basic concepts of programming",
    "instructorId": "prof.smith",
    "department": "Computer Science",
    "credits": 3,
    "startDate": "2024-01-15",
    "endDate": "2024-05-15",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Create Course
**Endpoint**: `POST /courses`

**Description**: Create a new course

**Request Body**:
```json
{
  "title": "Advanced Algorithms",
  "description": "Complex algorithm design and analysis",
  "instructorId": "prof.smith",
  "department": "Computer Science",
  "credits": 4,
  "startDate": "2024-02-01",
  "endDate": "2024-06-01"
}
```

**Response**:
```json
{
  "message": "Course created successfully",
  "courseId": "course_1706745600000"
}
```

#### Update Course
**Endpoint**: `PUT /courses/{courseId}`

**Description**: Update course information

**Request Body**:
```json
{
  "title": "Advanced Algorithms and Data Structures",
  "description": "Complex algorithm design, analysis, and data structure implementation"
}
```

**Response**:
```json
{
  "message": "Course updated successfully"
}
```

#### Delete Course
**Endpoint**: `DELETE /courses/{courseId}`

**Description**: Delete a course

**Response**:
```json
{
  "message": "Course deleted successfully"
}
```

## Authentication

### Cognito JWT Token

All protected endpoints require a valid JWT token from Cognito User Pools.

**Header Format**:
```
Authorization: Bearer {jwt-token}
```

**Token Claims**:
```json
{
  "sub": "user-uuid",
  "custom:role": "student|instructor|admin",
  "custom:userId": "username",
  "custom:isStudent": "true|false",
  "custom:isInstructor": "true|false",
  "custom:isAdmin": "true|false",
  "exp": 1704067200
}
```

### Role-Based Access Control

- **Students**: Access to own user data, file uploads, and course viewing
- **Instructors**: Access to course management, student data, and file management
- **Administrators**: Full access to all endpoints and user management

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **405**: Method Not Allowed
- **500**: Internal Server Error

### Common Error Scenarios

#### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### Validation Errors
```json
{
  "error": "Bad Request",
  "message": "User ID is required"
}
```

#### Resource Not Found
```json
{
  "error": "Not Found",
  "message": "Course not found"
}
```

## CORS Configuration

The API Gateway is configured with CORS support for cross-origin requests.

**Allowed Headers**:
- Content-Type
- Authorization
- X-Amz-Date
- X-Api-Key
- X-Amz-Security-Token
- X-Amz-User-Agent

**Allowed Methods**:
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Origins**: All origins (*)

## Monitoring & Logging

### CloudWatch Logs
- **API Gateway Access Logs**: `/aws/apigateway/DemoProject/access-logs`
- **Lambda Function Logs**: `/aws/lambda/DemoProject-*`

### Metrics
- Request count
- Latency
- Error rates
- Cache hit/miss rates

### Tracing
- X-Ray tracing enabled
- Request/response correlation
- Performance analysis

## Rate Limiting

### Default Limits
- **API Gateway**: 10,000 requests per second
- **Lambda**: 1,000 concurrent executions
- **Cognito**: 5 requests per second per user

### Custom Limits
Can be configured per endpoint or API key if needed.

## Security Features

### Request Validation
- Input sanitization
- Parameter validation
- SQL injection prevention
- XSS protection

### Authorization
- JWT token validation
- Role-based access control
- Resource-level permissions
- Token expiration handling

### Data Protection
- HTTPS enforcement
- Sensitive data encryption
- Audit logging
- Access monitoring

## Testing the API

### Using cURL

#### Health Check
```bash
curl -X GET "https://{api-id}.execute-api.{region}.amazonaws.com/prod/health"
```

#### Authenticated Request
```bash
curl -X GET "https://{api-id}.execute-api.{region}.amazonaws.com/prod/users" \
  -H "Authorization: Bearer {jwt-token}"
```

#### Create User
```bash
curl -X POST "https://{api-id}.execute-api.{region}.amazonaws.com/prod/users" \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test.user",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'
```

### Using Postman

1. **Set Base URL**: `https://{api-id}.execute-api.{region}.amazonaws.com/prod`
2. **Add Authorization Header**: `Authorization: Bearer {jwt-token}`
3. **Set Content-Type**: `application/json`
4. **Test endpoints** using the provided examples

## Deployment

### Prerequisites
- AWS CLI configured
- CDK installed and configured
- Appropriate AWS permissions

### Deploy API Gateway Stack
```bash
cd cdk
npm install
npm run build
npm run deploy:api-gateway
```

### Deploy All Infrastructure
```bash
cd cdk
npm run deploy:all
```

## Environment Variables

### Lambda Functions
```env
NODE_ENV=production
LOG_LEVEL=INFO
USER_POOL_ID=your-user-pool-id
S3_BUCKET_NAME=your-s3-bucket-name
COURSES_TABLE_NAME=DemoProject-Courses
```

### Next.js Integration
```env
NEXT_PUBLIC_API_GATEWAY_URL=https://{api-id}.execute-api.{region}.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
```

## Integration Examples

### Next.js API Client
```typescript
import { useAuth } from '@/lib/auth';

const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const { getAccessToken } = useAuth();
    const token = await getAccessToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  // User management
  async getUsers() {
    return this.request('/users');
  },
  
  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // File upload
  async getUploadUrl(fileData: any) {
    return this.request('/upload', {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  },
  
  // Course management
  async getCourses() {
    return this.request('/courses');
  },
  
  async createCourse(courseData: any) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },
};

export default apiClient;
```

### React Hook Usage
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/api-client';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.getUsers()
        .then(setUsers)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  return { users, loading, error };
}
```

## Troubleshooting

### Common Issues

#### CORS Errors
- Verify CORS configuration in API Gateway
- Check preflight OPTIONS method
- Ensure proper headers in requests

#### Authentication Errors
- Verify JWT token validity
- Check token expiration
- Ensure proper Authorization header format

#### Lambda Timeout
- Check Lambda function timeout settings
- Monitor CloudWatch logs for performance issues
- Consider increasing memory allocation

#### Permission Denied
- Verify IAM role permissions
- Check Cognito group membership
- Review resource policies

### Debug Commands

#### Check API Gateway Status
```bash
aws apigateway get-rest-api --rest-api-id {api-id}
```

#### Test Lambda Functions
```bash
aws lambda invoke --function-name DemoProject-HealthCheckLambda --payload '{}' response.json
```

#### Check CloudWatch Logs
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway/DemoProject"
```

## Best Practices

### Development
1. Use environment-specific configurations
2. Implement proper error handling
3. Add request/response validation
4. Monitor API performance

### Production
1. Enable detailed logging
2. Set up CloudWatch alarms
3. Implement rate limiting
4. Use API keys for additional security

### Security
1. Validate all inputs
2. Implement proper authorization
3. Use HTTPS everywhere
4. Regular security audits

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Check AWS API Gateway documentation
4. Contact development team

## References

- [AWS API Gateway](https://docs.aws.amazon.com/apigateway/)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/)
- [CDK API Gateway](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html)
