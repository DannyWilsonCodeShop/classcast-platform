# DemoProject Authentication System

This document describes the Cognito User Pool authentication system for DemoProject, which provides role-based access control for students and instructors.

## Overview

The authentication system is built using AWS Cognito User Pools and includes:

- **User Pool**: Centralized user directory with custom attributes
- **User Groups**: Role-based access control (students, instructors, admins)
- **Lambda Triggers**: Custom authentication flows and user management
- **Identity Pool**: AWS resource access control
- **OAuth Integration**: Web application authentication flows

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │────│  Cognito Client  │────│  User Pool     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Identity Pool  │    │  Lambda        │
                       └──────────────────┘    │  Triggers      │
                                │              └─────────────────┘
                                ▼
                       ┌──────────────────┐
                       │  IAM Roles      │
                       │  (Student/      │
                       │   Instructor/   │
                       │   Admin)        │
                       └──────────────────┘
```

## User Roles & Permissions

### 1. Students
- **Access Level**: Limited
- **S3 Access**: Personal files only (`/students/{userId}/*`)
- **DynamoDB Access**: Read/Write own data
- **Features**: View assignments, submit work, access course materials

### 2. Instructors
- **Access Level**: Elevated
- **S3 Access**: Course materials, personal files, public content
- **DynamoDB Access**: Read/Write course data, student submissions
- **Features**: Create assignments, grade submissions, manage courses

### 3. Administrators
- **Access Level**: Full
- **Access**: All resources and operations
- **Features**: User management, system configuration, analytics

## User Attributes

### Standard Attributes
- `email` (required, mutable)
- `given_name` (required, mutable)
- `family_name` (required, mutable)
- `phone_number` (optional, mutable)

### Custom Attributes
- `custom:role` - User role (student/instructor/admin)
- `custom:studentId` - Student identifier
- `custom:instructorId` - Instructor identifier
- `custom:department` - Academic department
- `custom:bio` - User biography
- `custom:avatar` - Profile picture URL
- `custom:lastLogin` - Last login timestamp
- `custom:preferences` - User preferences (JSON)

## Authentication Flow

### 1. User Registration
```
User Sign Up → Email Verification → Post-Confirmation Lambda → Group Assignment → Profile Creation
```

### 2. User Login
```
User Login → Pre-Authentication Check → Authentication → Pre-Token Generation → Token Issuance
```

### 3. Token Claims
JWT tokens include custom claims:
- `custom:role` - User role
- `custom:userId` - User identifier
- `custom:isStudent` - Boolean flag
- `custom:isInstructor` - Boolean flag
- `custom:isAdmin` - Boolean flag

## Lambda Triggers

### 1. Pre-Token Generation
- Adds custom claims to JWT tokens
- Includes role and group information
- Sets user-specific attributes

### 2. Post-Confirmation
- Automatically assigns users to appropriate groups
- Creates user profiles in DynamoDB
- Sets default preferences

### 3. Pre-Authentication
- Checks account status (locked/suspended)
- Updates last login timestamp
- Enforces security policies

### 4. Custom Message
- Customizes email templates
- Supports admin-created users
- Handles verification code resends

## Deployment

### Prerequisites
- AWS CLI configured
- CDK installed and configured
- Appropriate AWS permissions

### Deploy Authentication Stack
```bash
cd cdk
npm install
npm run build
npm run deploy:auth
```

### Deploy All Infrastructure
```bash
cd cdk
npm run deploy:all
```

## User Management

### Using the Management Script

The `manage-users.ps1` script provides easy user management:

#### Create a Student
```powershell
.\manage-users.ps1 -Action create-student `
  -UserPoolId "your-user-pool-id" `
  -ClientId "your-client-id" `
  -Username "john.doe" `
  -Email "john@example.com" `
  -FirstName "John" `
  -LastName "Doe" `
  -Department "ComputerScience" `
  -StudentId "CS001"
```

#### Create an Instructor
```powershell
.\manage-users.ps1 -Action create-instructor `
  -UserPoolId "your-user-pool-id" `
  -ClientId "your-client-id" `
  -Username "prof.smith" `
  -Email "prof@example.com" `
  -FirstName "Jane" `
  -LastName "Smith" `
  -Department "Mathematics" `
  -InstructorId "MATH001"
```

#### List Users in a Group
```powershell
.\manage-users.ps1 -Action list-users-in-group `
  -UserPoolId "your-user-pool-id" `
  -ClientId "your-client-id" `
  -GroupName "students"
```

### Manual AWS CLI Commands

#### Create User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username username \
  --user-attributes \
    Name=email,Value=user@example.com \
    Name=given_name,Value=FirstName \
    Name=family_name,Value=LastName \
    Name=custom:role,Value=student
```

#### Add User to Group
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username username \
  --group-name students
```

#### List Users
```bash
aws cognito-idp list-users --user-pool-id YOUR_USER_POOL_ID
```

## Integration with Next.js

### Environment Variables
```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
NEXT_PUBLIC_COGNITO_REGION=your-region
```

### Authentication Hook
```typescript
import { useAuth } from '@/lib/auth';

export default function MyComponent() {
  const { user, signIn, signOut, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.attributes?.given_name}!</p>
        <p>Role: {user?.attributes?.['custom:role']}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }
  
  return <button onClick={() => signIn()}>Sign In</button>;
}
```

## Security Features

### Password Policy
- Minimum length: 8 characters
- Requires: lowercase, uppercase, digits, symbols
- Temporary password validity: 7 days

### Multi-Factor Authentication
- Optional MFA support
- SMS and OTP options
- Advanced security mode enabled

### Account Security
- Email verification required
- Account recovery via email
- Advanced security monitoring
- User existence error prevention

## Monitoring & Logging

### CloudWatch Logs
- Lambda function execution logs
- User authentication events
- Error tracking and debugging

### Metrics
- User sign-up/sign-in rates
- Authentication failures
- Group membership changes

## Troubleshooting

### Common Issues

#### User Cannot Sign In
1. Check if user account is confirmed
2. Verify user is not locked/suspended
3. Check group membership
4. Review Lambda trigger logs

#### Permission Denied
1. Verify IAM role assignments
2. Check group membership
3. Review resource policies
4. Validate token claims

#### Lambda Trigger Errors
1. Check CloudWatch logs
2. Verify DynamoDB table permissions
3. Review environment variables
4. Check IAM role permissions

### Debug Commands
```bash
# Check user status
aws cognito-idp admin-get-user --user-pool-id YOUR_POOL_ID --username USERNAME

# List user groups
aws cognito-idp admin-list-groups-for-user --user-pool-id YOUR_POOL_ID --username USERNAME

# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/DemoProject"
```

## Best Practices

### Development
1. Use separate user pools for dev/staging/prod
2. Implement proper error handling in Lambda triggers
3. Test authentication flows thoroughly
4. Monitor CloudWatch metrics

### Production
1. Enable advanced security features
2. Implement proper logging and monitoring
3. Regular security audits
4. Backup user data and configurations

### User Management
1. Use groups for role-based access
2. Implement proper user lifecycle management
3. Regular access reviews
4. Secure admin operations

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Check AWS Cognito documentation
4. Contact development team

## References

- [AWS Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [CDK Cognito Constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito-readme.html)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [JWT Tokens](https://jwt.io/)
