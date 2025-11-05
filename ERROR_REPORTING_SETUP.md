# Error Reporting Setup Guide

## 🚨 Automatic Error Reporting System

This system automatically sends email notifications when users encounter errors in ClassCast.

## 📧 Email Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration for Error Reporting
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="ClassCast Error Reports <your_email@gmail.com>"
ADMIN_EMAIL="admin@yourschool.edu"
```

### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `SMTP_PASS`

### 3. Alternative Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
```

**Yahoo:**
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
```

## 🔧 Features

### Automatic Error Detection
- **Unhandled JavaScript errors** - Automatically caught and reported
- **API errors** - Server-side errors with full context
- **React component crashes** - Error boundary catches and reports
- **Promise rejections** - Unhandled async errors

### User-Reported Bugs
- **Bug Report Button** - Red exclamation icon in dashboard header
- **Detailed Forms** - Users can describe issues and steps to reproduce
- **User Context** - Automatically includes user info and page details

### Email Reports Include:
- **Error Details** - Full error message and stack trace
- **User Information** - Name, email, ID (when available)
- **Technical Context** - Page URL, browser info, timestamp
- **User Description** - For manually reported bugs
- **Steps to Reproduce** - When provided by users

## 🎯 Error Types Tracked

1. **API Errors** - Server-side failures with endpoint info
2. **Component Errors** - React crashes with component stack
3. **Unhandled Errors** - JavaScript runtime errors
4. **User Reports** - Manual bug reports with descriptions

## 🚀 Usage

### For Developers
```typescript
import ErrorReporter from '@/lib/errorReporting';

// Report custom errors
ErrorReporter.reportError({
  error: new Error('Something went wrong'),
  userId: user.id,
  additionalContext: { feature: 'video-upload' }
});

// API error reporting (automatic with wrapper)
import { withErrorReporting } from '@/lib/apiErrorHandler';

export const POST = withErrorReporting(async (request) => {
  // Your API logic here
  // Errors automatically reported with full context
});
```

### For Users
- **Automatic** - Errors are caught and reported automatically
- **Manual** - Click the red exclamation button to report bugs
- **No Interruption** - Error reporting happens in background

## 📊 Email Report Format

Reports are sent as formatted HTML emails with:
- **Color-coded sections** for easy scanning
- **Expandable stack traces** for technical details
- **User context** for understanding impact
- **Timestamp and page info** for debugging

## 🔒 Privacy & Security

- **No sensitive data** - Passwords and tokens are never included
- **User consent** - Manual reports require user action
- **Minimal data** - Only error-relevant information is collected
- **Secure transmission** - All emails sent via encrypted SMTP

## 🛠️ Testing

### Test Error Reporting
1. **Trigger Test Error** (Development only):
   ```javascript
   // In browser console
   throw new Error('Test error for reporting');
   ```

2. **Test Bug Report**:
   - Click red exclamation button in dashboard
   - Fill out bug report form
   - Check admin email for report

### Verify Setup
- Check console for "Error reported:" messages in development
- Ensure SMTP credentials are correct
- Test with a simple bug report first

## 📈 Benefits

- **Faster Bug Detection** - Know about issues immediately
- **Better User Experience** - Users can easily report problems
- **Detailed Context** - Full technical details for quick fixes
- **User Engagement** - Shows users their feedback is valued
- **Proactive Support** - Fix issues before they affect more users

## 🔧 Troubleshooting

### Common Issues:

1. **No emails received**:
   - Check SMTP credentials
   - Verify admin email address
   - Check spam folder

2. **Authentication errors**:
   - Use app passwords for Gmail
   - Enable "Less secure apps" if needed
   - Check 2FA settings

3. **Rate limiting**:
   - Gmail: 500 emails/day limit
   - Consider using dedicated email service for high volume

### Debug Mode
Set `NODE_ENV=development` to see error reports in console.