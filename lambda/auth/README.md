# DemoProject Authentication Lambda Functions

This directory contains AWS Lambda functions that handle authentication and authorization for the DemoProject application using AWS Cognito User Pools.

## 📁 File Structure

```
lambda/auth/
├── pre-token-generation.ts    # Adds custom claims to JWT tokens
├── post-confirmation.ts       # Handles user profile creation and group assignment
├── pre-authentication.ts      # Checks account status and updates last login
├── custom-message.ts          # Customizes email messages for Cognito events
├── jwt-verifier.ts            # JWT verification utility for API Gateway
├── signin-handler.ts          # User authentication and signin
├── refresh-token-handler.ts   # Token refresh functionality with rate limiting
├── signout-handler.ts         # User signout and token revocation
├── forgot-password-handler.ts # Password reset initiation
├── confirm-password-reset.ts  # Password reset confirmation
├── session-management.ts      # Comprehensive session management system
├── package.json               # Dependencies and build scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK deployed with Cognito User Pool

### Installation

```bash
cd lambda/auth
npm install
```

### Build

```bash
npm run build
```

### Package for Deployment

```bash
npm run package
```

## 🔧 Lambda Functions

### 1. Pre-Token Generation (`pre-token-generation.ts`)

**Purpose**: Adds custom claims to JWT tokens before they are issued.

**Triggers**: `PreTokenGeneration` Cognito trigger

**Custom Claims Added**:
- `firstName`, `lastName` - User's full name
- `role` - User role (student, instructor, admin)
- `department` - User's department
- `studentId`, `instructorId` - Role-specific IDs
- `groups` - Cognito group memberships
- `isStudent`, `isInstructor`, `isAdmin` - Boolean flags
- `lastLogin` - Last login timestamp
- `preferences` - User preferences

**Environment Variables**:
- `USERS_TABLE` - DynamoDB table for user profiles (optional)

### 2. Post-Confirmation (`post-confirmation.ts`)

**Purpose**: Handles user profile creation and group assignment after successful confirmation.

**Triggers**: `PostConfirmation` Cognito trigger

**Actions**:
- Adds user to appropriate Cognito group (students/instructors)
- Creates user profile in DynamoDB
- Updates Cognito custom attributes
- Sets default user preferences

**Environment Variables**:
- `USERS_TABLE` - DynamoDB table for user profiles
- `USER_POOL_ID` - Cognito User Pool ID

### 3. Pre-Authentication (`pre-authentication.ts`)

**Purpose**: Validates user account status before allowing authentication.

**Triggers**: `PreAuthentication` Cognito trigger

**Checks**:
- Account locked status
- Account suspended status
- Account enabled status
- Updates last login timestamp

**Environment Variables**:
- `USERS_TABLE` - DynamoDB table for user profiles

### 4. Custom Message (`custom-message.ts`)

**Purpose**: Customizes email messages for various Cognito events.

**Triggers**: `CustomMessage` Cognito trigger

**Supported Events**:
- `CustomMessage_SignUp` - Welcome email with verification code
- `CustomMessage_ResendCode` - New verification code
- `CustomMessage_ForgotPassword` - Password reset code
- `CustomMessage_UpdateUserAttribute` - Email change verification
- `CustomMessage_VerifyUserAttribute` - Attribute change verification

### 5. JWT Verifier (`jwt-verifier.ts`)

**Purpose**: Utility functions for verifying JWT tokens in API Gateway Lambda functions.

**Features**:
- JWT token verification
- User role and permission checking
- Resource access control
- Standardized error responses

### 6. Signup Handler (`signup-handler.ts`)

**Purpose**: Handles user registration with comprehensive validation and Cognito integration.

**Features**:
- Input validation using Zod schemas
- Email and username uniqueness checking
- Role-specific validation (student ID, instructor ID)
- Cognito user creation with custom attributes
- DynamoDB profile creation
- Automatic confirmation email sending

**API Endpoint**: `POST /auth/signup`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john.doe@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "department": "Computer Science",
  "studentId": "STU123456",
  "bio": "Software engineering student",
  "phoneNumber": "+1234567890",
  "preferences": {
    "notifications": { "email": true, "push": false, "sms": false },
    "theme": "light",
    "language": "en"
  }
}
```

### 7. Signup Confirmation (`signup-confirmation.ts`)

**Purpose**: Handles account confirmation and password setting.

**Features**:
- Confirmation code validation
- Password strength validation
- Account activation
- Profile status update

**API Endpoint**: `POST /auth/confirm`

**Request Body**:
```json
{
  "username": "john_doe",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

### 8. Resend Confirmation (`resend-confirmation.ts`)

**Purpose**: Allows users to request new confirmation codes.

**Features**:
- User existence verification
- Account status checking
- Confirmation code resending

**API Endpoint**: `POST /auth/resend-confirmation`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john.doe@university.edu"
}
```

### 9. Role-Based Signup (`role-based-signup.ts`)

**Purpose**: Handles role-specific user registration with comprehensive validation and business rules.

**Features**:
- Role-specific validation schemas (student vs instructor)
- Business rule validation (enrollment year, hire date, etc.)
- Role-specific attribute management
- Automatic group assignment
- Comprehensive error handling

**API Endpoint**: `POST /auth/role-based-signup`

**Student Request Body**:
```json
{
  "username": "john_doe",
  "email": "john.doe@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "department": "Computer Science",
  "studentId": "STU123456",
  "enrollmentYear": 2024,
  "major": "Computer Science",
  "academicLevel": "sophomore"
}
```

**Instructor Request Body**:
```json
{
  "username": "dr_johnson",
  "email": "dr.johnson@university.edu",
  "password": "SecurePass123!",
  "firstName": "Dr. Michael",
  "lastName": "Johnson",
  "role": "instructor",
  "department": "Physics",
  "instructorId": "INS123456",
  "title": "professor",
  "hireDate": "2010-08-15",
  "qualifications": ["Ph.D. in Theoretical Physics"]
}
```

### 10. Role Management (`role-management.ts`)

**Purpose**: Allows administrators to update user roles and manage role-based permissions.

**Features**:
- Admin-only access control
- Role change validation
- Group membership updates
- Profile synchronization
- Audit logging
- Business rule enforcement

**API Endpoint**: `PUT /auth/role-management`

**Request Body**:
```json
{
  "targetUserId": "user123",
  "newRole": "instructor",
  "instructorId": "INS999999",
  "title": "assistant_professor",
  "qualifications": ["Ph.D. in Computer Science"],
  "reason": "Student completed Ph.D. and is being promoted",
  "effectiveDate": "2024-09-01"
}
```

### 11. Session Management (`session-management.ts`)

**Purpose**: Provides comprehensive session management including validation, listing, revocation, and extension.

**Features**:
- **Session Validation**: Check token validity and expiration status
- **Session Listing**: View all active sessions with pagination
- **Session Revocation**: Manually revoke specific sessions
- **Session Extension**: Extend sessions using refresh tokens
- **Device Intelligence**: Track device types, IP addresses, and user agents
- **Rate Limiting**: Built-in rate limiting for refresh operations
- **Session Analytics**: Comprehensive session tracking and metrics

**API Endpoints**:
- `POST /sessions/validate` - Validate session and get info
- `GET /sessions/list` - List user sessions with pagination
- `DELETE /sessions/revoke` - Revoke specific session
- `POST /sessions/extend` - Extend session with refresh token

**Session Information**:
```json
{
  "sessionId": "session_123",
  "userId": "user_456",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100",
    "deviceType": "desktop",
    "lastSeen": "2024-01-15T10:30:00Z"
  },
  "status": "active",
  "createdAt": "2024-01-15T09:30:00Z",
  "expiresAt": "2024-01-15T10:30:00Z",
  "lastActivity": "2024-01-15T10:30:00Z",
  "refreshCount": 2,
  "metadata": {
    "loginMethod": "password",
    "clientType": "web"
  }
}
```

## 🔐 Authentication Flow

```
1. User Registration → Role-Based Signup Handler
   ├── Role selection (student/instructor)
   ├── Role-specific validation (Zod schemas)
   ├── Business rule validation
   ├── Email/username uniqueness check
   ├── Cognito user creation with custom attributes
   ├── DynamoDB profile creation
   ├── Automatic group assignment
   └── Confirmation email sent

2. Email Confirmation → Signup Confirmation Handler
   ├── Confirmation code validation
   ├── Password setting
   ├── Account activation
   └── Profile status update

3. Post-Confirmation Trigger → Post-Confirmation Lambda
   ├── Adds user to appropriate group (students/instructors)
   ├── Updates Cognito attributes
   └── Sets user preferences

4. User Sign In → Signin Handler
   ├── Credential validation
   ├── Cognito authentication
   ├── User profile retrieval
   ├── Last login update
   └── JWT token return

5. Pre-Authentication Trigger → Pre-Authentication Lambda
   ├── Checks account status
   └── Updates last login

6. Token Generation → Pre-Token Generation Trigger
   └── Adds custom claims to JWT

7. Token Management → Refresh Token Handler
   ├── Extends user sessions
   ├── Handles token expiration
   └── Secure token refresh

8. User Signout → Signout Handler
   ├── Access token revocation
   ├── Optional global signout
   └── Secure logout process

9. Password Reset → Forgot Password Handler
   ├── User verification
   ├── Reset code generation
   └── Email delivery

10. Password Reset Confirmation → Confirm Password Reset Handler
    ├── Code validation
    ├── Password strength check
    └── Account update

11. API Requests → JWT Verification
    ├── Verifies token validity
    ├── Extracts user claims
    └── Checks permissions

12. Role Management (Admin Only) → Role Management Handler
    ├── Role change validation
    ├── Group membership updates
    ├── Profile synchronization
    └── Audit logging

13. Resend Confirmation (if needed) → Resend Confirmation Handler
    ├── User verification
    └── New code sent
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
USER_POOL_ID=us-east-1_xxxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
USERS_TABLE=DemoProject-Users
```

### Cognito User Pool Configuration

Ensure your Cognito User Pool has the following custom attributes:

```typescript
const customAttributes = {
  'custom:role': { type: 'String', mutable: true },
  'custom:department': { type: 'String', mutable: true },
  'custom:studentId': { type: 'String', mutable: true },
  'custom:instructorId': { type: 'String', mutable: true },
  'custom:bio': { type: 'String', mutable: true },
  'custom:avatar': { type: 'String', mutable: true },
  'custom:lastLogin': { type: 'String', mutable: true },
  'custom:preferences': { type: 'String', mutable: true }
};
```

### Cognito Groups

Create the following groups in your User Pool:

- `students` - Student users
- `instructors` - Instructor users  
- `admins` - Administrator users

## 🛠️ Usage Examples

### Using Signup Handlers

#### 1. User Registration

```typescript
// Frontend signup form submission
const signupData = {
  username: 'john_doe',
  email: 'john.doe@university.edu',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student',
  department: 'Computer Science',
  studentId: 'STU123456',
  bio: 'Software engineering student',
  phoneNumber: '+1234567890',
  preferences: {
    notifications: { email: true, push: false, sms: false },
    theme: 'light',
    language: 'en'
  }
};

const response = await fetch('/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signupData)
});

const result = await response.json();
if (result.success) {
  console.log('User created:', result.data);
  // Show confirmation message
} else {
  console.error('Signup failed:', result.error);
}
```

#### 2. Account Confirmation

```typescript
// After receiving confirmation email
const confirmationData = {
  username: 'john_doe',
  confirmationCode: '123456', // From email
  newPassword: 'NewSecurePass123!'
};

const response = await fetch('/auth/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(confirmationData)
});

const result = await response.json();
if (result.success) {
  console.log('Account confirmed:', result.data);
  // Redirect to login
} else {
  console.error('Confirmation failed:', result.error);
}
```

#### 3. Resend Confirmation Code

```typescript
// If confirmation code expires
const resendData = {
  username: 'john_doe',
  email: 'john.doe@university.edu'
};

const response = await fetch('/auth/resend-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(resendData)
});

const result = await response.json();
if (result.success) {
  console.log('New code sent:', result.data);
  // Show message about new email
} else {
  console.error('Resend failed:', result.error);
}
```

### Using JWT Verifier in API Gateway Lambda

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { verifyJwtToken, hasRole, createAuthError } from './jwt-verifier';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Verify JWT token
  const authResult = await verifyJwtToken(event);
  if (!authResult.success) {
    return createAuthError(authResult.error!, authResult.statusCode);
  }

  const user = authResult.user!;

  // Check role permissions
  if (!hasRole(user, ['instructor', 'admin'])) {
    return createAuthError('Insufficient permissions', 403);
  }

  // Process request with authenticated user
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello ${user.firstName}!`,
      user: {
        id: user.sub,
        role: user.role,
        department: user.department
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
};
```

### Role-Based Access Control

```typescript
import { hasRole, hasGroup, canAccessResource } from './jwt-verifier';

// Check specific role
if (hasRole(user, 'instructor')) {
  // Allow instructor actions
}

// Check multiple roles
if (hasRole(user, ['instructor', 'admin'])) {
  // Allow instructor or admin actions
}

// Check group membership
if (hasGroup(user, 'admins')) {
  // Allow admin group actions
}

// Check resource ownership
if (canAccessResource(user, resourceOwnerId)) {
  // Allow access to owned resource
}
```

## 🔒 Security Features

### JWT Token Security
- Token expiration validation
- Signature verification
- Issuer validation
- Audience validation

### Role-Based Access Control
- Granular role permissions
- Group-based access control
- Resource ownership validation
- Admin override capabilities

### Account Security
- Account status validation
- Suspension and locking support
- Last login tracking
- Audit trail support

## 📊 Monitoring and Logging

### CloudWatch Logs
All Lambda functions log to CloudWatch with structured logging:

```typescript
console.log(`Pre-token generation completed for user: ${userName}`);
console.error('Error in pre-token-generation:', error);
console.warn('Could not fetch user profile:', error);
```

### Metrics to Monitor
- Lambda execution duration
- Error rates
- Throttling events
- Concurrent executions

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Local Testing

```bash
# Test JWT verification locally
npm run build
node -e "
const { verifyJwtToken } = require('./dist/jwt-verifier');
// Test with mock event
"
```

### Integration Testing

Deploy to a test environment and test with real Cognito User Pool:

```bash
# Deploy to test environment
cdk deploy --profile test

# Test authentication flow
# 1. Create test user
# 2. Confirm user
# 3. Sign in
# 4. Verify JWT claims
# 5. Test API access
```

## 🚀 Deployment

### CDK Integration

Update your CDK stack to include these Lambda functions:

```typescript
// In your auth-stack.ts
const preTokenGenerationLambda = new lambda.Function(this, 'PreTokenGenerationLambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'pre-token-generation.handler',
  code: lambda.Code.fromAsset('lambda/auth'),
  environment: {
    USERS_TABLE: this.usersTable?.tableName || '',
  },
  timeout: Duration.seconds(30),
});

// Add to Cognito User Pool
userPool.addTrigger(
  UserPoolOperation.PRE_TOKEN_GENERATION,
  preTokenGenerationLambda
);
```

### Manual Deployment

```bash
# Build and package
npm run package

# Deploy to AWS Lambda
aws lambda create-function \
  --function-name DemoProject-PreTokenGeneration \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-role \
  --handler pre-token-generation.handler \
  --zip-file fileb://auth-lambda.zip
```

## 🔧 Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   - Check `USER_POOL_ID` and `USER_POOL_CLIENT_ID` environment variables
   - Verify Cognito User Pool configuration
   - Check token expiration

2. **User Profile Creation Fails**
   - Verify DynamoDB table exists and is accessible
   - Check IAM permissions for Lambda execution role
   - Verify table name in environment variables

3. **Group Assignment Fails**
   - Check Cognito User Pool group configuration
   - Verify Lambda execution role has `cognito-idp:AdminAddUserToGroup` permission
   - Check group names match exactly

4. **Custom Messages Not Working**
   - Verify `CustomMessage` trigger is enabled in Cognito
   - Check Lambda function logs for errors
   - Verify email configuration in Cognito

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
LOG_LEVEL=DEBUG
ENABLE_VERBOSE_LOGGING=true
```

## 📚 Additional Resources

- [AWS Cognito User Pool Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html)
- [JWT Verification Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bic/)
- [Lambda Function Configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [DemoProject API Documentation](../API_GATEWAY_README.md)

## 🤝 Contributing

When adding new authentication features:

1. Follow existing naming conventions
2. Add comprehensive error handling
3. Include security considerations
4. Add corresponding tests
5. Update this documentation
6. Consider performance implications

## 📄 License

MIT License - see LICENSE file for details.
