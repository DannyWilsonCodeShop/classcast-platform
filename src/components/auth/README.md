# Authentication System

A comprehensive React-based authentication system built with Next.js, AWS Cognito, and TypeScript. This system provides secure user authentication with form validation, error handling, and a modern UI.

## Features

- **User Registration & Login**: Secure authentication with AWS Cognito
- **Form Validation**: Comprehensive client-side and server-side validation
- **Error Handling**: User-friendly error messages and graceful error handling
- **Password Management**: Secure password reset and recovery flows
- **Email Verification**: Email verification with resend functionality
- **Role-Based Access**: Support for students and instructors
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode Support**: Built-in dark mode support
- **Accessibility**: ARIA labels and keyboard navigation support

## Components

### Core Components

#### `AuthContainer`
The main container component that manages the authentication flow and switches between different views.

**Props:**
- `initialView`: Initial authentication view to display (`'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email'`)
- `onSuccess`: Callback function called when authentication succeeds
- `onClose`: Callback function for closing the authentication modal

**Usage:**
```tsx
import AuthContainer from '@/components/auth/AuthContainer';

// Basic usage
<AuthContainer />

// With custom initial view
<AuthContainer initialView="signup" />

// With callbacks
<AuthContainer 
  initialView="login"
  onSuccess={() => router.push('/dashboard')}
  onClose={() => setShowAuth(false)}
/>
```

#### `LoginForm`
Handles user login with email and password validation.

**Features:**
- Email and password validation
- Password visibility toggle
- Remember me checkbox
- Error handling and display
- Loading states

**Props:**
- `onSuccess`: Callback when login succeeds
- `onSwitchToSignup`: Callback to switch to signup view
- `onSwitchToForgotPassword`: Callback to switch to forgot password view

#### `SignupForm`
Handles user registration with comprehensive validation.

**Features:**
- Role selection (student/instructor)
- Dynamic form fields based on role
- Password complexity validation
- Terms and conditions agreement
- Real-time validation feedback

**Props:**
- `onSuccess`: Callback when signup succeeds
- `onSwitchToLogin`: Callback to switch to login view

#### `ForgotPasswordForm`
Handles password reset requests.

**Features:**
- Email validation
- Success state display
- Resend email functionality
- Rate limiting protection

**Props:**
- `onSuccess`: Callback when email is sent
- `onSwitchToLogin`: Callback to switch to login view

#### `ResetPasswordForm`
Handles password reset confirmation.

**Features:**
- Token and email validation from URL parameters
- Password complexity validation
- Success state display
- Automatic redirect handling

**Props:**
- `onSuccess`: Callback when password is reset
- `onSwitchToLogin`: Callback to switch to login view

#### `EmailVerificationForm`
Handles email verification with verification codes.

**Features:**
- 6-digit verification code input
- Automatic code formatting
- Resend functionality with countdown
- Success state display

**Props:**
- `onSuccess`: Callback when email is verified
- `onSwitchToLogin`: Callback to switch to login view
- `onResendCode`: Callback for resending verification code

## API Endpoints

### Authentication Routes

#### `POST /api/auth/login`
Authenticates a user and creates a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "username": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "studentId": "STU123"
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

#### `POST /api/auth/signup`
Creates a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "SecurePassword123!",
  "role": "instructor",
  "instructorId": "INS456",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "message": "Account created successfully. Please check your email for verification.",
  "user": {
    "username": "newuser@example.com",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "instructor",
    "instructorId": "INS456",
    "department": "Computer Science",
    "status": "pending"
  },
  "nextStep": "verify-email"
}
```

#### `POST /api/auth/forgot-password`
Sends a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### `POST /api/auth/reset-password`
Confirms password reset with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "email": "user@example.com",
  "password": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now sign in with your new password."
}
```

#### `POST /api/auth/verify-email`
Verifies email with verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully. You can now sign in to your account."
}
```

#### `POST /api/auth/resend-verification`
Resends verification code.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code has been resent to your email address."
}
```

#### `POST /api/auth/logout`
Logs out the user and clears session cookies.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### `POST /api/auth/refresh`
Refreshes the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "new_jwt_token_here",
    "expiresIn": 3600
  }
}
```

## Form Validation

### Login Form Validation
- **Email**: Required, valid email format
- **Password**: Required, minimum 8 characters

### Signup Form Validation
- **Email**: Required, valid email format
- **First Name**: Required, minimum 2 characters
- **Last Name**: Required, minimum 2 characters
- **Password**: Required, minimum 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- **Confirm Password**: Required, must match password
- **Role**: Required, must be 'student' or 'instructor'
- **Student ID**: Required when role is 'student'
- **Instructor ID**: Required when role is 'instructor'
- **Department**: Required when role is 'instructor'
- **Terms Agreement**: Required

### Password Reset Validation
- **Email**: Required, valid email format
- **New Password**: Same requirements as signup password
- **Confirm Password**: Must match new password

### Email Verification Validation
- **Verification Code**: Required, exactly 6 digits

## Security Features

### Password Security
- Strong password requirements
- Password complexity validation
- Secure password transmission
- Password reset with time-limited tokens

### Session Security
- HTTP-only cookies
- Secure cookie flags in production
- Token expiration handling
- Automatic token refresh

### Rate Limiting
- Resend verification code cooldown
- Password reset request limits
- Login attempt protection

### Data Protection
- Input sanitization
- XSS protection
- CSRF protection via SameSite cookies
- Secure error messages (no information leakage)

## Error Handling

### Client-Side Errors
- Form validation errors
- Network connectivity issues
- User input errors

### Server-Side Errors
- Authentication failures
- Validation errors
- Cognito service errors
- Rate limiting errors

### Error Display
- User-friendly error messages
- Field-specific error highlighting
- General error notifications
- Loading states during operations

## Styling and Theming

### Design System
- Consistent color scheme
- Typography hierarchy
- Spacing system
- Component variants

### Dark Mode
- Automatic dark mode detection
- Manual theme switching
- Consistent color contrast
- Accessible color combinations

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interactions
- Flexible layouts

## Testing

### Test Coverage
- Component rendering tests
- User interaction tests
- Form validation tests
- API integration tests
- Error handling tests
- Accessibility tests

### Testing Tools
- Jest for unit testing
- React Testing Library for component testing
- Mock service worker for API mocking
- Accessibility testing with jest-axe

## Usage Examples

### Basic Authentication Flow
```tsx
import { useState } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={() => setShowAuth(true)}>
          Sign In
        </button>
      ) : (
        <div>
          <h1>Welcome to the Dashboard</h1>
          <button onClick={() => setIsAuthenticated(false)}>
            Sign Out
          </button>
        </div>
      )}

      {showAuth && (
        <AuthContainer
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
```

### Custom Authentication Pages
```tsx
// pages/auth/login.tsx
import AuthContainer from '@/components/auth/AuthContainer';

export default function LoginPage() {
  return <AuthContainer initialView="login" />;
}

// pages/auth/signup.tsx
import AuthContainer from '@/components/auth/AuthContainer';

export default function SignupPage() {
  return <AuthContainer initialView="signup" />;
}
```

### Protected Routes
```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Protected content here</div>;
}
```

## Configuration

### Environment Variables
```env
# AWS Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_USER_POOL_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### AWS Cognito Setup
1. Create a User Pool in AWS Cognito
2. Configure password policies
3. Set up email verification
4. Create a User Pool Client
5. Configure callback URLs
6. Set up IAM roles and permissions

## Deployment

### Build Process
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Environment Configuration
- Set production environment variables
- Configure secure cookie settings
- Set up HTTPS in production
- Configure CDN and caching

### Monitoring and Logging
- Application performance monitoring
- Error tracking and reporting
- User analytics (privacy-compliant)
- Security event logging

## Troubleshooting

### Common Issues

#### Authentication Failures
- Check Cognito configuration
- Verify environment variables
- Check network connectivity
- Review error logs

#### Form Validation Issues
- Ensure all required fields are filled
- Check password complexity requirements
- Verify email format
- Check browser console for errors

#### API Errors
- Verify API endpoint URLs
- Check request/response format
- Review server logs
- Test with Postman or similar tool

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=auth:*
```

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Run tests
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

### Testing Requirements
- All new features must have tests
- Maintain 90%+ test coverage
- Run tests before committing
- Update documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review troubleshooting guide
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Complete authentication system
- Form validation and error handling
- AWS Cognito integration
- Responsive design and dark mode
- Comprehensive testing suite

