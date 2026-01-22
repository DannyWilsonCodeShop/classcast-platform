# Password Reset Email Troubleshooting Guide

## Common Issues and Solutions

### 1. Students Not Receiving Reset Emails

**Possible Causes:**
- SES is in sandbox mode
- Email addresses not verified in SES
- Emails going to spam folder
- SES configuration issues
- Missing environment variables

**Solutions:**
1. **Check SES Sandbox Mode:**
   - Go to AWS SES Console
   - Check if you're in sandbox mode
   - Request production access if needed

2. **Verify Email Addresses:**
   - In SES Console, verify sender email address
   - In sandbox mode, verify recipient emails too

3. **Check Environment Variables:**
   ```
   AWS_REGION=us-east-1
   SES_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://your-app.com
   ```

4. **Test Email Sending:**
   ```bash
   node test-password-reset.js
   ```

### 2. SES Authentication Errors

**Error:** "The security token included in the request is invalid"

**Solutions:**
1. Check AWS credentials in environment
2. Verify IAM permissions for SES
3. Ensure correct AWS region

### 3. Emails Going to Spam

**Solutions:**
1. Set up SPF record: `v=spf1 include:amazonses.com ~all`
2. Set up DKIM in SES Console
3. Use verified domain instead of email address
4. Add proper reply-to address

### 4. Reset Links Not Working

**Possible Issues:**
- Token expired (1 hour limit)
- Token already used
- Database connection issues
- Frontend URL mismatch

**Solutions:**
1. Check token expiry in database
2. Verify FRONTEND_URL matches actual domain
3. Check database connectivity

## Manual Password Reset Process

If emails are not working, you can manually reset passwords:

1. **Generate Password Hash:**
   ```bash
   node reset-mahassine-password-simple.js
   ```

2. **Update Database Directly:**
   - Access DynamoDB Console
   - Find user in classcast-users table
   - Update password field with generated hash

3. **Use Admin API:**
   ```bash
   curl -X POST /api/auth/admin-reset-password \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","newPassword":"NewPass123!"}'
   ```

## Testing Checklist

- [ ] SES is configured and verified
- [ ] Environment variables are set
- [ ] Password reset table exists
- [ ] API endpoints are deployed
- [ ] Test email sending works
- [ ] Reset links are generated correctly
- [ ] Password reset completes successfully

## Monitoring

Check these logs for issues:
- CloudWatch logs for Lambda functions
- SES sending statistics
- DynamoDB metrics
- Application error logs

## Support

For additional help:
1. Check AWS SES documentation
2. Verify IAM permissions
3. Test with different email providers
4. Contact AWS support if needed