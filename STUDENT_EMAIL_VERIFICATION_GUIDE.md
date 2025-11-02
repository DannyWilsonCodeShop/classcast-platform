# Student Email Verification Guide

## Quick Answer: Do Students Need to Verify Their Emails?

**NO - Students do NOT need to verify their email addresses to receive emails from your platform!** ✅

Your AWS SES account is in **Production Mode**, which means you can send emails to **any email address** without requiring recipient verification.

---

## How the Current System Works

### 1. **For Receiving Emails (Students)** ✅ No Verification Needed
When you send emails to students (assignments, grades, notifications), AWS SES will deliver them **without requiring students to verify** their email addresses.

**Why?** Your SES account is in **Production Mode**, not Sandbox Mode.

### 2. **For Sending Emails (Your Platform)** ✅ Already Configured
- ✅ Sender email `noreply@myclasscast.com` is verified
- ✅ Entire domain `myclasscast.com` is verified (can send from ANY @myclasscast.com address)
- ✅ Your instructor email `dwilson@cristoreyatlanta.org` is verified
- ✅ Your personal email `wilson.danny@me.com` is now verified (for receiving notifications)

---

## Email Verification in the Signup Process

### Current Implementation

Your platform has **TWO signup flows**:

#### 1. **Simple Signup** (Currently Used) - `/api/auth/signup-simple`
```typescript
emailVerified: true, // For now, skip email verification
```
- ✅ Accounts are created immediately
- ✅ No email verification required
- ✅ Students can log in right away
- ✅ Can receive emails immediately

#### 2. **Cognito Signup** (Available but not primary)
- Students receive a verification code by email
- Must enter code to activate account
- More secure but adds friction

### What Emails Can Students Receive?

Students will automatically receive emails for:
1. **New Assignments** (`/api/assignments` route)
   - Sent when instructor creates an assignment
   - Includes assignment details, due date, and link
   
2. **Graded Assignments** (`/api/grading` route)  
   - Sent when instructor grades their submission
   - Includes score, feedback, and link
   
3. **Peer Feedback** (`/api/peer-responses` route)
   - Sent when another student comments on their video
   - Includes comment content and link

4. **Course Announcements** (via email notification system)
   - Sent by instructors to the class

### Email Notification Preferences

Students can control which emails they receive through their notification preferences:
- ✅ Assignment notifications
- ✅ Grade notifications  
- ✅ Peer feedback
- ✅ Course announcements
- ✅ Discussion replies
- ✅ Upcoming deadlines

Preferences are stored in the user's profile and checked before sending:
```typescript
const shouldSend = await shouldSendEmailNotification(
  student.userId,
  'newAssignments'
);
```

---

## Adding Email Verification to Signup (Optional)

If you want to **add email verification** to the signup process for security:

### Option A: Enable Cognito Email Verification

1. **Update Cognito User Pool settings**:
```bash
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_D5vZkTpMI \
  --auto-verified-attributes email \
  --region us-east-1
```

2. **Switch to Cognito signup flow** in your frontend:
   - Use `/api/auth/signup` instead of `/api/auth/signup-simple`
   - Enable the verification modal in `SignupForm.tsx`

3. **Students will receive**:
   - Verification code email from Cognito
   - Must enter code to complete signup
   - Email will be marked as verified

### Option B: Custom Email Verification

Add a custom verification step without Cognito:

```typescript
// 1. Generate verification token
const verificationToken = crypto.randomBytes(32).toString('hex');

// 2. Store token in database
await docClient.send(new UpdateCommand({
  TableName: 'classcast-users',
  Key: { userId },
  UpdateExpression: 'SET verificationToken = :token, emailVerified = :verified',
  ExpressionAttributeValues: {
    ':token': verificationToken,
    ':verified': false
  }
}));

// 3. Send verification email
const verificationUrl = `${BASE_URL}/verify-email?token=${verificationToken}`;
await sendVerificationEmail(email, verificationUrl);

// 4. User clicks link to verify
// /api/verify-email?token=... marks emailVerified = true
```

---

## Best Practices for Your Use Case

### Recommendation: **Keep Current Simple Flow** ✅

**Why?**
1. **Educational Setting** - Students are pre-verified by enrollment
2. **Fewer Barriers** - Students can start immediately
3. **Better UX** - Less friction = higher adoption
4. **Already Working** - Your current system is solid

### When to Add Verification:
- If you open registration to public (not just enrolled students)
- If you experience spam or fake accounts
- If you need to comply with specific security requirements
- If you're allowing self-registration without instructor approval

---

## How Bulk Enrollment Works

When you use the **bulk enrollment feature** (`/api/courses/bulk-enroll`):

```typescript
// For each student in CSV:
1. Check if user exists by email
2. If NOT exists:
   - Create Cognito account
   - Create DynamoDB user record
   - Mark emailVerified = true (automatically)
3. Enroll in course
4. Send welcome email (optional)
```

Bulk-enrolled students:
- ✅ Do NOT need to verify email
- ✅ Can receive all notifications immediately
- ✅ Can log in with generated password
- ✅ Are prompted to change password on first login (optional)

---

## Testing Email Delivery

### Test 1: Send Test Email to Any Address
```bash
node test-video-submission-email.js
```

### Test 2: Create Test Assignment
1. Log in as instructor
2. Create new assignment
3. Check that enrolled students receive email
4. Check spam folders if not in inbox

### Test 3: Grade a Submission  
1. Open a student submission
2. Add grade and feedback
3. Student should receive email notification

### Test 4: Check SES Sending Statistics
```bash
aws ses get-send-statistics --region us-east-1
```

---

## Common Issues and Solutions

### Issue: Students Not Receiving Emails

**Possible Causes:**
1. ✅ **Check spam folders first!** AWS SES emails often go to spam initially
2. Email notification preference disabled
3. Invalid email address in database
4. Email bounced (check SES bounce list)
5. Rate limiting (check SES quotas)

**Solutions:**
```bash
# Check SES account limits
aws sesv2 get-account --region us-east-1

# Check bounce/complaint list
aws ses list-suppressed-destinations --region us-east-1

# Remove email from bounce list if needed
aws ses delete-suppressed-destination \
  --email-address student@example.com \
  --region us-east-1
```

### Issue: Emails Going to Spam

**Solutions:**
1. **Add SPF Record** to your domain DNS:
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. **Add DKIM Records** (AWS provides these):
   ```bash
   aws sesv2 get-email-identity --email-identity myclasscast.com --region us-east-1
   ```
   Copy the DKIM tokens and add to DNS

3. **Add DMARC Record**:
   ```
   _dmarc.myclasscast.com TXT "v=DMARC1; p=none; rua=mailto:admin@myclasscast.com"
   ```

4. **Warm up your sending domain** - Send gradually increasing volumes

### Issue: Verification Code Not Sent (Cognito)

**Check:**
```bash
# Verify SES sender email for Cognito
aws ses get-email-identity --email-identity noreply@myclasscast.com --region us-east-1

# Update Cognito email configuration
aws cognito-idp describe-user-pool --user-pool-id us-east-1_D5vZkTpMI --region us-east-1 | grep -A 10 EmailConfiguration
```

---

## Summary

### ✅ Current State (Working Great!)
- Students do NOT need to verify emails to receive notifications
- Your SES is in Production Mode
- All sender emails are verified
- Email system is fully functional

### 🎯 Recommendation
**Keep your current simple signup flow** - it's perfect for an educational setting where students are enrolled by instructors.

### 📧 What Happens Now
1. Student signs up (email marked as verified automatically)
2. Instructor enrolls student in course
3. Instructor creates assignment → Student gets email ✅
4. Student submits video → You get email ✅
5. Instructor grades submission → Student gets email ✅
6. Everything just works! 🎉

### 🔒 When to Add Verification
Only if you:
- Open to public registration
- Experience security issues
- Have compliance requirements
- Need stricter account validation

---

## Quick Commands Reference

```bash
# Check all verified email identities
aws sesv2 list-email-identities --region us-east-1

# Check SES account status (Production vs Sandbox)
aws sesv2 get-account --region us-east-1

# Send test email
node test-video-submission-email.js

# Check email sending limits
aws ses get-send-quota --region us-east-1

# View recent email sending activity
aws ses get-send-statistics --region us-east-1
```

---

**Bottom Line:** Your email system is production-ready! Students will receive all notifications without needing to verify their email addresses. 🎉

