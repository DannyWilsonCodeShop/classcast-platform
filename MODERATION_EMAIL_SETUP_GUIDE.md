# Moderation Email Notification Setup Guide

## Overview
The content moderation system can send email notifications to instructors when inappropriate content is flagged. This guide will help you set up and test the email notification system.

## 🔧 Prerequisites

### 1. AWS SES (Simple Email Service) Setup
You need AWS SES configured to send emails:

#### Step 1: Verify Sender Email
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to "Verified identities"
3. Click "Create identity"
4. Choose "Email address"
5. Enter your sender email (e.g., `noreply@yourdomain.com`)
6. Click "Create identity"
7. Check your email and click the verification link

#### Step 2: Verify Recipient Email (Sandbox Mode Only)
If your AWS SES is in sandbox mode (default):
1. Also verify your personal email address where you want to receive alerts
2. Follow the same process as Step 1
3. Or request production access to send to any email

#### Step 3: Check SES Limits
- Sandbox mode: 200 emails per 24 hours, 1 email per second
- Production mode: Higher limits based on your account

### 2. Environment Variables
Add these to your `.env.local` file:

```bash
# Email Configuration
SES_SENDER_EMAIL=noreply@yourdomain.com
INSTRUCTOR_ALERT_EMAIL=your-email@example.com
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. AWS IAM Permissions
Ensure your AWS credentials have SES permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

## 📧 Testing Email Notifications

### Quick Test
Run this command with your email address:

```bash
node send-test-moderation-email.js your-email@example.com
```

### Comprehensive Test
Run the full test suite:

```bash
node test-moderation-email-notification.js
```

### Setup Assistant
Use the interactive setup:

```bash
node setup-moderation-email.js
```

## 📨 Email Content Features

### Severity-Based Styling
- **🚨 HIGH SEVERITY**: Red header, urgent styling
- **⚠️ MEDIUM SEVERITY**: Orange header, warning styling  
- **📋 LOW SEVERITY**: Yellow header, info styling

### Email Content Includes
- Content preview (first 200 characters)
- Author information
- Flagged categories
- Severity level
- Direct link to moderation dashboard
- Professional HTML and plain text versions

### Sample Email Structure
```
Subject: 🚨 Content Moderation Alert - HIGH Severity

[RED HEADER]
Content Moderation Alert
Action Required: Review Flagged Content

Severity: HIGH
Content Type: peer-response
Author: Student Name
Categories: inappropriate-language, harassment

Content Preview:
"This is the flagged content that needs review..."

[REVIEW IN MODERATION DASHBOARD BUTTON]
```

## 🔄 How It Works

### Automatic Triggering
1. Student submits content (peer response, community post, etc.)
2. AI moderation scans content using OpenAI Moderation API
3. If flagged as medium or high severity, email alert is sent
4. Instructor receives notification with content details
5. Instructor can review and take action in moderation dashboard

### Manual Testing
1. Use test scripts to send sample alerts
2. Verify email delivery and formatting
3. Test moderation dashboard links
4. Confirm all severity levels work

## 🚨 Troubleshooting

### No Emails Received
1. **Check Spam Folder**: AWS SES emails may be filtered
2. **Verify SES Setup**: Ensure sender email is verified
3. **Sandbox Mode**: Verify recipient email if in sandbox
4. **Check Logs**: Look for AWS SES errors in application logs
5. **Rate Limits**: Ensure you haven't exceeded SES limits

### Email Formatting Issues
1. **HTML Rendering**: Check email client HTML support
2. **Mobile Display**: Test on mobile devices
3. **Link Functionality**: Verify dashboard links work

### AWS SES Errors
Common error codes:
- `MessageRejected`: Email content rejected
- `SendingQuotaExceeded`: Rate limit exceeded
- `ConfigurationSetDoesNotExist`: SES configuration issue
- `InvalidParameterValue`: Invalid email address format

### Environment Variable Issues
```bash
# Check if variables are set
echo $SES_SENDER_EMAIL
echo $INSTRUCTOR_ALERT_EMAIL
echo $AWS_REGION

# Verify in Node.js
node -e "console.log(process.env.SES_SENDER_EMAIL)"
```

## 📊 Monitoring and Analytics

### Email Delivery Tracking
- AWS SES provides delivery, bounce, and complaint metrics
- Monitor these in the SES console
- Set up CloudWatch alarms for high bounce rates

### Moderation Alert Frequency
- Track how often alerts are triggered
- Monitor false positive rates
- Adjust AI moderation sensitivity if needed

## 🔐 Security Considerations

### Email Security
- Use verified sender domains
- Implement SPF, DKIM, and DMARC records
- Monitor for email spoofing attempts

### Content Privacy
- Email previews are limited to 200 characters
- Full content only visible in secure dashboard
- Ensure HTTPS for all dashboard links

### Access Control
- Only instructors receive moderation alerts
- Verify instructor permissions before sending
- Log all email notifications for audit

## 📋 Production Checklist

Before deploying to production:

- [ ] AWS SES sender email verified
- [ ] Production SES access requested (if needed)
- [ ] Environment variables configured
- [ ] Email templates tested across clients
- [ ] Spam filter testing completed
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Backup notification methods considered
- [ ] Documentation updated for team

## 🆘 Support

If you encounter issues:

1. **Check AWS SES Console**: Look for delivery failures
2. **Review Application Logs**: Check for API errors
3. **Test Email Delivery**: Use AWS SES console to send test emails
4. **Verify Configuration**: Double-check all environment variables
5. **Contact AWS Support**: For SES-specific issues

## 📚 Additional Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Sending Limits](https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html)
- [Email Best Practices](https://docs.aws.amazon.com/ses/latest/dg/send-email-concepts-deliverability.html)
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)

---

## Quick Start Commands

```bash
# 1. Set up email configuration
node setup-moderation-email.js

# 2. Test email delivery
node send-test-moderation-email.js your-email@example.com

# 3. Run comprehensive tests
node test-moderation-email-notification.js

# 4. Check moderation dashboard
# Visit: http://localhost:3000/instructor/moderation
```