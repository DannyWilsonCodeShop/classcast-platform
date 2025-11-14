# Session Management and Refresh Token Logic

This document provides comprehensive information about the enhanced session management system and refresh token logic implemented in DemoProject.

## Table of Contents

1. [Overview](#overview)
2. [Session Management Features](#session-management-features)
3. [Refresh Token Enhancements](#refresh-token-enhancements)
4. [API Endpoints](#api-endpoints)
5. [Session Lifecycle](#session-lifecycle)
6. [Security Features](#security-features)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)
9. [Testing](#testing)
10. [Deployment](#deployment)

## Overview

The enhanced session management system provides comprehensive control over user sessions, including:

- **Session Validation**: Check token validity and expiration
- **Session Listing**: View all active sessions for a user
- **Session Revocation**: Manually revoke specific sessions
- **Session Extension**: Extend sessions using refresh tokens
- **Enhanced Refresh Logic**: Rate limiting and security improvements
- **Session Analytics**: Track device information and usage patterns

## Session Management Features

### 1. **Session Validation** (`POST /validate`)
Validates access tokens and provides session information.

**Request:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..." // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "session": {
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
      "refreshCount": 2
    },
    "remainingTime": 1800,
    "requiresRefresh": false
  }
}
```

### 2. **Session Listing** (`GET /list`)
Lists all sessions for a specific user with pagination support.

**Query Parameters:**
- `userId` (required): User ID to list sessions for
- `includeExpired` (optional): Include expired sessions (default: false)
- `limit` (optional): Maximum sessions to return (default: 20, max: 100)
- `nextToken` (optional): Pagination token for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
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
        "refreshCount": 2
      }
    ],
    "totalCount": 1,
    "nextToken": "next_page_token"
  }
}
```

### 3. **Session Revocation** (`DELETE /revoke`)
Revokes a specific session with optional reason.

**Request:**
```json
{
  "sessionId": "session_123",
  "reason": "Security concern detected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "sessionId": "session_123",
    "reason": "Security concern detected"
  }
}
```

### 4. **Session Extension** (`POST /extend`)
Extends a session by refreshing tokens.

**Request:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session extended successfully",
  "data": {
    "accessToken": "new_access_token",
    "idToken": "new_id_token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

## Refresh Token Enhancements

### 1. **Rate Limiting**
- **Per-token rate limiting**: Maximum 5 refresh attempts per minute per refresh token
- **Automatic cleanup**: Old rate limiting entries are cleaned up every minute
- **Graceful degradation**: Rate limiting failures don't break the system

### 2. **Enhanced Security**
- **Token validation**: Comprehensive validation before refresh
- **Error handling**: Detailed error codes for different failure scenarios
- **Logging**: Comprehensive logging for security monitoring

### 3. **Performance Optimizations**
- **In-memory storage**: Fast rate limiting with periodic cleanup
- **Efficient token parsing**: Optimized JWT token handling
- **Async operations**: Non-blocking session operations

## API Endpoints

| Method | Endpoint | Purpose | Authentication |
|--------|----------|---------|----------------|
| `POST` | `/validate` | Validate session and get info | None (public) |
| `GET` | `/list` | List user sessions | JWT token |
| `DELETE` | `/revoke` | Revoke specific session | JWT token |
| `POST` | `/extend` | Extend session with refresh | None (public) |

## Session Lifecycle

```
1. User Signin → Session Created
   ├── Device info captured
   ├── IP address logged
   ├── User agent analyzed
   └── Session record stored

2. Session Active → Regular Validation
   ├── Token expiration check
   ├── Refresh requirement detection
   ├── Activity tracking
   └── Device fingerprinting

3. Token Refresh → Session Extended
   ├── Rate limiting check
   ├── Refresh token validation
   ├── New tokens issued
   └── Session metadata updated

4. Session End → Cleanup
   ├── Manual revocation
   ├── Automatic expiration
   ├── Global signout
   └── Session record cleanup
```

## Security Features

### 1. **Rate Limiting**
- **Refresh token rate limiting**: Prevents abuse of refresh tokens
- **Session validation rate limiting**: Protects against brute force attacks
- **Automatic cleanup**: Prevents memory leaks from rate limiting data

### 2. **Session Tracking**
- **Device fingerprinting**: Tracks device type and user agent
- **IP address logging**: Monitors for suspicious location changes
- **Activity timestamps**: Tracks last activity and session duration

### 3. **Token Security**
- **JWT validation**: Comprehensive token validation
- **Expiration checking**: Automatic detection of expired tokens
- **Refresh logic**: Secure token refresh with validation

### 4. **Audit Trail**
- **Session creation**: Logs when sessions are created
- **Session modification**: Tracks changes to session status
- **Session revocation**: Records reasons for session termination

## Configuration

### Environment Variables

```bash
# Required
USER_POOL_ID=us-east-1_xxxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (for session tracking)
SESSIONS_TABLE=DemoProject-Sessions
```

### DynamoDB Table Structure (Optional)

If you want to enable session tracking, create a DynamoDB table:

```typescript
const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
  tableName: 'DemoProject-Sessions',
  partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
  removalPolicy: cdk.RemovalPolicy.DESTROY
});

// Global Secondary Index for user-based queries
sessionsTable.addGlobalSecondaryIndex({
  indexName: 'UserIdIndex',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
});
```

## Usage Examples

### Frontend Integration

#### 1. **Session Validation**
```typescript
// Check if current session is valid
const validateSession = async (accessToken: string) => {
  const response = await fetch('/api/sessions/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });
  
  const result = await response.json();
  
  if (result.success && result.data.requiresRefresh) {
    // Automatically refresh tokens
    await refreshTokens();
  }
  
  return result.data.isValid;
};
```

#### 2. **Session Management**
```typescript
// List all active sessions
const listSessions = async (userId: string) => {
  const response = await fetch(`/api/sessions/list?userId=${userId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const result = await response.json();
  return result.data.sessions;
};

// Revoke a specific session
const revokeSession = async (sessionId: string, reason?: string) => {
  const response = await fetch('/api/sessions/revoke', {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ sessionId, reason })
  });
  
  const result = await response.json();
  return result.success;
};
```

#### 3. **Automatic Token Refresh**
```typescript
// Implement automatic token refresh
class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  
  constructor(private accessToken: string, private refreshToken: string) {
    this.scheduleRefresh();
  }
  
  private scheduleRefresh() {
    // Refresh tokens 5 minutes before expiration
    const tokenPayload = JSON.parse(atob(this.accessToken.split('.')[1]));
    const expiresAt = tokenPayload.exp * 1000;
    const refreshAt = expiresAt - (5 * 60 * 1000); // 5 minutes before
    const delay = Math.max(0, refreshAt - Date.now());
    
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens();
    }, delay);
  }
  
  private async refreshTokens() {
    try {
      const response = await fetch('/api/sessions/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.accessToken = result.data.accessToken;
        this.refreshToken = result.data.idToken;
        this.scheduleRefresh(); // Schedule next refresh
      } else {
        // Handle refresh failure
        this.handleRefreshFailure();
      }
    } catch (error) {
      this.handleRefreshFailure();
    }
  }
  
  private handleRefreshFailure() {
    // Redirect to login or show error
    window.location.href = '/login';
  }
  
  public destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}
```

### Backend Integration

#### 1. **Session Validation in API Gateway**
```typescript
// Use session validation in your Lambda functions
export const handler: APIGatewayProxyHandler = async (event) => {
  const accessToken = event.headers.Authorization?.replace('Bearer ', '');
  
  if (!accessToken) {
    return createErrorResponse('MISSING_TOKEN', 'Access token required');
  }
  
  // Validate session
  const sessionResult = await validateSession(accessToken);
  
  if (!sessionResult.isValid) {
    return createErrorResponse('INVALID_SESSION', 'Session expired or invalid');
  }
  
  if (sessionResult.requiresRefresh) {
    return createErrorResponse('REFRESH_REQUIRED', 'Token refresh required');
  }
  
  // Process request with valid session
  return processRequest(event, sessionResult.session);
};
```

#### 2. **Session Cleanup on Signout**
```typescript
// Enhanced signout with session cleanup
export const signoutHandler: APIGatewayProxyHandler = async (event) => {
  const { accessToken, refreshToken } = JSON.parse(event.body || '{}');
  
  // Revoke Cognito tokens
  await cognito.revokeToken({ Token: accessToken }).promise();
  
  if (refreshToken) {
    await cognito.revokeToken({ Token: refreshToken }).promise();
  }
  
  // Cleanup session record
  await cleanupSessionRecord(accessToken);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Signed out successfully' })
  };
};
```

## Testing

### Run Tests
```bash
cd lambda/auth
npm test session-management.test.ts
```

### Test Coverage
The test suite covers:
- ✅ Session validation scenarios
- ✅ Session listing with pagination
- ✅ Session revocation
- ✅ Session extension
- ✅ Error handling
- ✅ CORS headers
- ✅ Rate limiting
- ✅ Edge cases

### Test Scenarios
1. **Valid Session Validation**
2. **Expired Session Detection**
3. **Session Refresh Requirements**
4. **Session Listing and Pagination**
5. **Session Revocation**
6. **Rate Limiting**
7. **Error Handling**
8. **CORS Compliance**

## Deployment

### 1. **CDK Integration**
```typescript
// In your auth-stack.ts
const sessionManagementLambda = new lambda.Function(this, 'SessionManagementLambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'session-management.handler',
  code: lambda.Code.fromAsset('lambda/auth'),
  environment: {
    USER_POOL_ID: this.userPool.userPoolId,
    USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
    SESSIONS_TABLE: this.sessionsTable?.tableName || 'DemoProject-Sessions'
  },
  timeout: Duration.seconds(30),
  memorySize: 256
});

// Add to API Gateway
const sessionResource = api.root.addResource('sessions');
sessionResource.addMethod('POST', new apigateway.LambdaIntegration(sessionManagementLambda));
sessionResource.addMethod('GET', new apigateway.LambdaIntegration(sessionManagementLambda));
sessionResource.addMethod('DELETE', new apigateway.LambdaIntegration(sessionManagementLambda));
```

### 2. **Environment Variables**
```bash
# Production environment
USER_POOL_ID=us-east-1_production_pool
USER_POOL_CLIENT_ID=production_client_id
SESSIONS_TABLE=DemoProject-Sessions-Prod

# Development environment
USER_POOL_ID=us-east-1_dev_pool
USER_POOL_CLIENT_ID=dev_client_id
SESSIONS_TABLE=DemoProject-Sessions-Dev
```

### 3. **Monitoring and Alerting**
- **CloudWatch Logs**: Monitor session operations
- **CloudWatch Metrics**: Track session counts and refresh rates
- **X-Ray Tracing**: Trace session lifecycle
- **Error Rate Alerts**: Alert on high error rates

## Summary

The enhanced session management system provides:

✅ **Comprehensive Session Control**: Validate, list, revoke, and extend sessions  
✅ **Enhanced Security**: Rate limiting, device tracking, and audit trails  
✅ **Automatic Token Management**: Smart refresh logic with failure handling  
✅ **Device Intelligence**: Track device types, locations, and usage patterns  
✅ **Production Ready**: Comprehensive testing, error handling, and monitoring  
✅ **Scalable Architecture**: DynamoDB integration with graceful fallbacks  

This system gives you full control over user sessions while maintaining security and providing a seamless user experience.
