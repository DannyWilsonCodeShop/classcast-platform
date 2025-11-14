# Authentication Handlers Documentation

This document provides comprehensive information about the authentication Lambda functions that handle user signin, token management, and password reset operations.

## Table of Contents

1. [Overview](#overview)
2. [Signin Handler](#signin-handler)
3. [Refresh Token Handler](#refresh-token-handler)
4. [Signout Handler](#signout-handler)
5. [Forgot Password Handler](#forgot-password-handler)
6. [Confirm Password Reset Handler](#confirm-password-reset-handler)
7. [Common Features](#common-features)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Testing](#testing)
11. [Deployment](#deployment)

## Overview

The authentication handlers provide a complete authentication flow for the DemoProject application:

- **User Signin**: Authenticate users with username/email and password
- **Token Management**: Refresh access tokens and handle token expiration
- **User Signout**: Secure logout with token revocation
- **Password Reset**: Self-service password reset functionality

All handlers use Zod schemas for input validation and provide consistent error handling and CORS support.

## Signin Handler

**File**: `signin-handler.ts`  
**Endpoint**: `/signin`  
**Method**: `POST`

### Purpose
Handles user authentication by validating credentials against Cognito and returning JWT tokens.

### Request Format
```json
{
  "username": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "idToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "user-123",
      "username": "user@example.com",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "status": "active",
      "lastLogin": "2024-01-15T10:30:00Z",
      "preferences": { "theme": "dark" }
    }
  }
}
```

### Features
- Supports both username and email signin
- Validates password strength requirements
- Updates last login timestamp
- Returns complete user profile information
- Handles various Cognito authentication challenges

### Authentication Flows
1. **Standard Authentication**: Username/password → JWT tokens
2. **New Password Required**: Forces password change on first login
3. **MFA Setup**: Requires MFA configuration before access

## Refresh Token Handler

**File**: `refresh-token-handler.ts`  
**Endpoint**: `/refresh-token`  
**Method**: `POST`

### Purpose
Refreshes expired access tokens using a valid refresh token.

### Request Format
```json
{
  "refreshToken": "eyJ...",
  "clientId": "optional-client-id-override"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "idToken": "eyJ...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

### Features
- Extends user session without re-authentication
- Supports multiple client applications
- Handles refresh token validation errors

## Signout Handler

**File**: `signout-handler.ts`  
**Endpoint**: `/signout`  
**Method**: `POST`

### Purpose
Securely logs out users by revoking access tokens and optionally performing global signout.

### Request Format
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..." // Optional for global signout
}
```

### Response Format
```json
{
  "success": true,
  "message": "Successfully signed out from all devices"
}
```

### Features
- **Local Signout**: Revokes current access token only
- **Global Signout**: Revokes refresh token (signs out from all devices)
- Graceful error handling for token revocation failures

## Forgot Password Handler

**File**: `forgot-password-handler.ts`  
**Endpoint**: `/forgot-password`  
**Method**: `POST`

### Purpose
Initiates the password reset process by sending a confirmation code to the user's email.

### Request Format
```json
{
  "username": "user@example.com",
  "clientId": "optional-client-id-override"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Password reset code sent successfully. Please check your email.",
  "data": {
    "deliveryMedium": "EMAIL",
    "destination": "u***@e***.com",
    "attributeName": "email"
  }
}
```

### Features
- Supports username or email lookup
- Rate limiting protection
- Secure code delivery to registered email

## Confirm Password Reset Handler

**File**: `confirm-password-reset.ts`  
**Endpoint**: `/confirm-password-reset`  
**Method**: `POST`

### Purpose
Completes the password reset process by validating the confirmation code and setting a new password.

### Request Format
```json
{
  "username": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePass123!",
  "clientId": "optional-client-id-override"
}
```

### Response Format
```json
{
  "success": true,
  "message": "Password reset successful. You can now sign in with your new password."
}
```

### Features
- Validates 6-digit confirmation code
- Enforces password strength requirements
- Handles expired codes gracefully

## Common Features

### Input Validation
All handlers use Zod schemas for comprehensive input validation:

- **Required Fields**: Ensures all necessary data is provided
- **Format Validation**: Validates email formats, password strength, etc.
- **Length Constraints**: Enforces minimum/maximum field lengths
- **Type Safety**: Ensures proper data types

### CORS Support
All responses include proper CORS headers:

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
}
```

### Error Handling
Consistent error response format across all handlers:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { "additional": "information" }
  }
}
```

### Logging
Comprehensive logging for debugging and monitoring:

- Request/response logging
- Error logging with context
- Performance metrics
- Security event logging

## Error Handling

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|--------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `INVALID_JSON` | Malformed JSON request | 400 |
| `INVALID_CREDENTIALS` | Wrong username/password | 400 |
| `USER_NOT_CONFIRMED` | Account not verified | 400 |
| `USER_NOT_FOUND` | User doesn't exist | 400 |
| `PASSWORD_RESET_REQUIRED` | Force password change | 400 |
| `TOO_MANY_REQUESTS` | Rate limit exceeded | 400 |
| `INTERNAL_ERROR` | Server error | 400 |

### Error Recovery
- **Rate Limiting**: Automatic retry with exponential backoff
- **Token Expiration**: Clear guidance for token refresh
- **Validation Errors**: Detailed field-level error information
- **Network Issues**: Graceful degradation and retry logic

## Security Considerations

### Password Security
- Minimum 8 characters
- Requires uppercase, lowercase, number, and special character
- Prevents common password patterns
- Secure password storage in Cognito

### Token Security
- Short-lived access tokens (1 hour default)
- Secure refresh token handling
- Token revocation on signout
- JWT signature verification

### Rate Limiting
- Cognito-level rate limiting
- Application-level throttling
- Brute force protection
- Account lockout mechanisms

### Data Protection
- No sensitive data in logs
- Secure environment variable handling
- Input sanitization and validation
- CORS policy enforcement

## Testing

### Unit Tests
Comprehensive test coverage for all handlers:

```bash
# Run all tests
npm test

# Run specific handler tests
npm test -- signin-handler.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage Areas
- Input validation
- Authentication flows
- Error handling
- Edge cases
- Security scenarios
- Performance testing

### Mock Strategy
- AWS SDK mocking
- Environment variable isolation
- Request/response simulation
- Error condition testing

## Deployment

### Environment Variables
Required environment variables for all handlers:

```bash
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-client-id
USERS_TABLE=your-users-table-name
```

### Lambda Configuration
Recommended Lambda settings:

```yaml
Runtime: nodejs18.x
Memory: 256 MB
Timeout: 30 seconds
Environment: Production
```

### API Gateway Integration
Configure API Gateway endpoints:

```yaml
/signin:
  POST: signinHandler
  
/refresh-token:
  POST: refreshTokenHandler
  
/signout:
  POST: signoutHandler
  
/forgot-password:
  POST: forgotPasswordHandler
  
/confirm-password-reset:
  POST: confirmPasswordResetHandler
```

### Monitoring and Alerting
- CloudWatch Logs
- CloudWatch Metrics
- X-Ray tracing
- Error rate alerts
- Performance monitoring

## Usage Examples

### Frontend Integration

```typescript
// Signin
const signinResponse = await fetch('/api/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123!'
  })
});

// Refresh token
const refreshResponse = await fetch('/api/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: storedRefreshToken
  })
});

// Signout
const signoutResponse = await fetch('/api/signout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: currentAccessToken,
    refreshToken: storedRefreshToken // Global signout
  })
});
```

### Error Handling

```typescript
try {
  const response = await fetch('/api/signin', { /* ... */ });
  const data = await response.json();
  
  if (data.success) {
    // Handle successful signin
    storeTokens(data.data);
    redirectToDashboard();
  } else {
    // Handle error
    showError(data.error.message);
  }
} catch (error) {
  // Handle network/parsing errors
  showError('Network error occurred');
}
```

## Troubleshooting

### Common Issues

1. **Invalid Credentials**
   - Verify username/email format
   - Check password requirements
   - Ensure account is confirmed

2. **Token Expiration**
   - Implement automatic token refresh
   - Handle refresh token expiration
   - Redirect to signin when needed

3. **Rate Limiting**
   - Implement exponential backoff
   - Show user-friendly error messages
   - Monitor rate limit usage

4. **Network Issues**
   - Implement retry logic
   - Provide offline indicators
   - Handle timeout scenarios

### Debug Mode
Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug npm test
```

## Support

For issues and questions:

1. Check the test suite for usage examples
2. Review CloudWatch logs for error details
3. Verify environment variable configuration
4. Test with minimal request payloads
5. Check API Gateway configuration

## Future Enhancements

- Multi-factor authentication (MFA)
- Social login integration
- Advanced session management
- Audit logging and compliance
- Performance optimization
- Enhanced security features
