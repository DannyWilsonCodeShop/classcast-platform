# Authentication Context and Route Protection System

## Overview

This document describes the comprehensive authentication and authorization system built with React Context API and Next.js. The system provides centralized user session management, role-based access control, and automatic token refresh functionality.

## Architecture

The authentication system consists of several key components:

1. **AuthContext** - Centralized state management for authentication
2. **ProtectedRoute Components** - Role-based access control for routes
3. **useAuthGuard Hook** - Programmatic authentication guard functionality
4. **Navigation Component** - Dynamic navigation based on user role
5. **JWT Verification** - Server-side token validation

## Components

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

The main authentication context that manages user state and provides authentication methods.

#### Features

- **User Session Management**: Stores and manages user authentication state
- **Automatic Token Refresh**: Refreshes tokens every 50 minutes and before page unload
- **Role-Based Redirects**: Automatically redirects users to appropriate dashboards after login
- **Error Handling**: Comprehensive error handling for all authentication operations
- **Loading States**: Manages loading states during authentication operations

#### API

```typescript
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}
```

#### Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### 2. ProtectedRoute Components (`src/components/auth/ProtectedRoute.tsx`)

A set of components that provide role-based access control for different parts of the application.

#### Available Components

- **`ProtectedRoute`** - Base component with configurable role requirements
- **`StudentRoute`** - Only allows student access
- **`InstructorRoute`** - Only allows instructor access
- **`AdminRoute`** - Only allows admin access
- **`InstructorOrAdminRoute`** - Allows instructor or admin access
- **`AnyAuthenticatedRoute`** - Allows any authenticated user

#### Props

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'instructor' | 'admin';
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
  redirectTo?: string;
  fallback?: ReactNode;
}
```

#### Usage Examples

```tsx
// Basic protection - any authenticated user
<AnyAuthenticatedRoute>
  <Dashboard />
</AnyAuthenticatedRoute>

// Role-specific protection
<StudentRoute>
  <StudentDashboard />
</StudentRoute>

<InstructorRoute>
  <InstructorDashboard />
</InstructorRoute>

// Custom role requirements
<ProtectedRoute requiredRole="instructor">
  <GradingInterface />
</ProtectedRoute>

// Multiple allowed roles
<ProtectedRoute allowedRoles={['instructor', 'admin']}>
  <CourseManagement />
</ProtectedRoute>

// Custom redirect and fallback
<ProtectedRoute 
  redirectTo="/custom-login"
  fallback={<CustomLoadingSpinner />}
>
  <ProtectedContent />
</ProtectedRoute>
```

### 3. useAuthGuard Hook (`src/hooks/useAuthGuard.ts`)

A custom hook that provides programmatic authentication guard functionality for components that need fine-grained control over authentication.

#### Features

- **Permission Checking**: Check if user has permission for specific actions
- **Programmatic Access Control**: Control access programmatically in components
- **Custom Callbacks**: Handle unauthorized access with custom logic
- **Auto-redirect**: Automatically redirect users based on role requirements

#### API

```typescript
interface UseAuthGuardReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRequiredRole: boolean;
  checkPermission: (action: string) => boolean;
  requireAuth: () => boolean;
  requireRole: (role: 'student' | 'instructor' | 'admin') => boolean;
}
```

#### Usage

```tsx
import { useAuthGuard } from '@/hooks/useAuthGuard';

const MyComponent = () => {
  const authGuard = useAuthGuard({
    requiredRole: 'instructor',
    onUnauthorized: () => {
      // Custom unauthorized handling
      showCustomMessage('You need instructor access');
    }
  });
  
  // Check permissions
  if (authGuard.checkPermission('grade_submission')) {
    return <GradingInterface />;
  }
  
  // Require specific role
  if (!authGuard.requireRole('instructor')) {
    return null; // Will redirect automatically
  }
  
  return <div>Instructor content</div>;
};
```

#### Available Permissions

- **Assignment Management**: `create_assignment`, `edit_assignment`, `delete_assignment`
- **Submission Handling**: `submit_assignment`, `grade_submission`, `view_all_submissions`
- **Student Actions**: `view_own_submissions`, `view_own_grades`
- **Instructor Features**: `view_instructor_feed`, `bulk_grade`
- **Admin Functions**: `manage_users`, `system_settings`

### 4. Navigation Component (`src/components/layout/Navigation.tsx`)

A dynamic navigation component that adapts based on user authentication status and role.

#### Features

- **Role-Based Navigation**: Shows different navigation items based on user role
- **Responsive Design**: Mobile-friendly with collapsible menu
- **User Menu**: Dropdown menu with user information and logout
- **Loading States**: Shows loading indicators while checking authentication

#### Navigation Structure

- **Students**: Dashboard, Assignments, My Submissions
- **Instructors**: Dashboard, Assignments, Submissions, Community Feed
- **Admins**: Dashboard, Users, Courses, Settings

### 5. JWT Verification (`src/lib/jwt-verifier.ts`)

Server-side JWT token verification utility used by API routes.

#### Features

- **Token Validation**: Verifies JWT signature and expiration
- **User Extraction**: Extracts user information from valid tokens
- **Error Handling**: Comprehensive error handling for various JWT issues
- **Request Integration**: Helper function for extracting user from HTTP requests

#### Usage

```typescript
import { verifyJwtToken, extractUserFromRequest } from '@/lib/jwt-verifier';

// Verify token directly
const result = await verifyJwtToken(token);
if (result.success) {
  const user = result.user;
  // Process user
}

// Extract user from request
const result = await extractUserFromRequest(request);
if (result.success) {
  const user = result.user;
  // Process user
}
```

## API Endpoints

### Authentication Status

- **`GET /api/auth/me`** - Check current user authentication status
- **`POST /api/auth/login`** - User login
- **`POST /api/auth/signup`** - User registration
- **`POST /api/auth/logout`** - User logout
- **`POST /api/auth/refresh`** - Refresh access token

### Protected Routes

All protected routes automatically check authentication and role requirements. Users are redirected to appropriate dashboards based on their role.

## Security Features

### 1. HTTP-Only Cookies

- Access tokens and refresh tokens are stored as secure, HTTP-only cookies
- Prevents XSS attacks from accessing tokens
- Automatic token transmission with requests

### 2. Automatic Token Refresh

- Tokens are refreshed every 50 minutes (before 1-hour expiration)
- Refresh occurs before page unload to maintain session
- Seamless user experience without manual re-authentication

### 3. Role-Based Access Control

- Strict role validation at component and API levels
- Automatic redirects to appropriate dashboards
- Granular permission checking for specific actions

### 4. Secure Redirects

- Users are always redirected to appropriate dashboards based on their role
- Prevents unauthorized access to role-specific content
- Consistent user experience across the application

## Error Handling

### Authentication Errors

- **Invalid Credentials**: Clear error messages for login failures
- **Token Expiration**: Automatic redirect to login with clear messaging
- **Network Errors**: Graceful fallbacks and user-friendly error messages
- **Role Mismatch**: Clear redirection to appropriate dashboard

### Error Recovery

- **Automatic Retry**: Token refresh attempts on authentication failures
- **Graceful Degradation**: Fallback to login when authentication fails
- **User Feedback**: Clear error messages and loading states

## Performance Optimizations

### 1. Context Optimization

- Uses `useCallback` for stable function references
- Prevents unnecessary re-renders of consuming components
- Efficient state updates with minimal re-renders

### 2. Lazy Loading

- Authentication checks are performed only when needed
- Protected routes load content only after authentication verification
- Efficient loading states and fallbacks

### 3. Token Management

- Automatic token refresh prevents unnecessary API calls
- Efficient token validation and user session management
- Minimal overhead for authenticated users

## Testing Strategy

### 1. Unit Tests

- **AuthContext**: Tests for all authentication methods and state management
- **ProtectedRoute**: Tests for role-based access control and redirects
- **useAuthGuard**: Tests for permission checking and programmatic access control
- **JWT Verification**: Tests for token validation and error handling

### 2. Integration Tests

- **API Endpoints**: Tests for authentication flow and error handling
- **Component Integration**: Tests for authentication context integration
- **Route Protection**: Tests for complete authentication flow

### 3. Test Coverage

- Authentication state management
- Role-based access control
- Error handling and recovery
- Token refresh functionality
- Edge cases and error conditions

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secure-jwt-secret

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=your-region
```

### Customization

- **Redirect Paths**: Customize redirect paths for different roles
- **Permission System**: Extend permission system with custom actions
- **Error Messages**: Customize error messages and user feedback
- **Loading States**: Customize loading indicators and fallbacks

## Deployment Considerations

### 1. Security

- Ensure `JWT_SECRET` is properly configured and secure
- Use HTTPS in production for secure cookie transmission
- Configure proper CORS policies for API endpoints

### 2. Performance

- Monitor authentication API response times
- Optimize token refresh intervals based on usage patterns
- Implement caching for user information when appropriate

### 3. Monitoring

- Log authentication failures and security events
- Monitor token refresh success rates
- Track user session durations and patterns

## Troubleshooting

### Common Issues

1. **Authentication Loop**: Check JWT secret configuration and token validation
2. **Role Mismatch**: Verify user role assignment in Cognito
3. **Token Expiration**: Check token refresh configuration and timing
4. **Redirect Issues**: Verify route protection configuration and redirect paths

### Debug Mode

Enable debug logging for authentication operations:

```typescript
// Add to environment variables
DEBUG_AUTH=true
```

## Future Enhancements

### 1. Advanced Features

- **Multi-Factor Authentication**: Support for MFA workflows
- **Session Management**: Advanced session tracking and management
- **Audit Logging**: Comprehensive audit trail for authentication events

### 2. Performance Improvements

- **Token Caching**: Implement token caching for improved performance
- **Background Refresh**: Background token refresh without user interaction
- **Optimistic Updates**: Optimistic UI updates for better user experience

### 3. Security Enhancements

- **Rate Limiting**: Implement rate limiting for authentication endpoints
- **Device Tracking**: Track and manage authenticated devices
- **Advanced Permissions**: Implement more granular permission system

## Related Documentation

- [Authentication Components](../auth/README.md)
- [API Routes Documentation](../../app/api/README.md)
- [Testing Strategy](../../../docs/testing.md)
- [Security Guidelines](../../../docs/security.md)

## Support

For issues and questions related to the authentication system:

1. Check the troubleshooting section above
2. Review test cases for expected behavior
3. Check environment variable configuration
4. Verify AWS Cognito setup and configuration

---

*This authentication system provides a robust, secure, and user-friendly foundation for role-based access control in your educational platform.*






