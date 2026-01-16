# Cognito to JWT Migration Guide

## Overview

This guide explains how to migrate users from AWS Cognito to your custom JWT authentication system. The migration is necessary because you want to move away from Cognito while maintaining user access.

## Critical Limitation

**⚠️ AWS Cognito does NOT allow exporting password hashes for security reasons.**

This means you cannot directly copy passwords from Cognito to your JWT system. You must use one of the migration strategies below.

---

## Migration Strategies

### Strategy 1: Lazy Migration (Recommended) ⭐

**How it works:**
- Migrate user metadata (email, name, role) immediately
- Keep passwords in Cognito temporarily
- When a user logs in, authenticate with Cognito, then save their password to JWT system
- Gradually migrate all active users as they log in

**Pros:**
- ✅ Zero user disruption - completely transparent
- ✅ No password reset emails needed
- ✅ Secure password migration (user provides password during login)
- ✅ Only active users are migrated (inactive users don't clutter system)

**Cons:**
- ❌ Takes time to migrate all users
- ❌ Must maintain both systems temporarily
- ❌ Inactive users remain in Cognito indefinitely

**Best for:** Production systems where user experience is critical

---

### Strategy 2: Force Password Reset

**How it works:**
- Migrate user metadata immediately
- Send password reset emails to ALL users
- Users must reset password to access account
- Disable Cognito authentication immediately

**Pros:**
- ✅ Complete migration quickly (within days)
- ✅ Clean break from Cognito
- ✅ Forces users to update passwords (good security practice)
- ✅ No dual system maintenance

**Cons:**
- ❌ High user friction - everyone must reset password
- ❌ May lose inactive users who don't check email
- ❌ Support burden from confused users
- ❌ Potential user complaints

**Best for:** Small user bases or when you need to migrate quickly

---

### Strategy 3: Hybrid Approach (Best of Both) 🏆

**How it works:**
- Migrate user metadata immediately
- Send password reset emails to all users (optional)
- Use lazy migration for users who log in naturally
- After 90 days, force password reset for remaining Cognito-only users
- Disable Cognito after 90-day grace period

**Pros:**
- ✅ Minimal disruption for active users
- ✅ Complete migration within defined timeframe
- ✅ Most flexible approach
- ✅ Balances user experience and migration speed

**Cons:**
- ❌ Most complex to implement
- ❌ Requires maintaining both systems for 90 days
- ❌ Need to schedule follow-up migration

**Best for:** Large production systems with diverse user activity levels

---

## Implementation Steps

### Step 1: Choose Your Strategy

Decide which strategy fits your needs:
- **Lazy**: Best for production, minimal disruption
- **Force Reset**: Fast migration, acceptable user friction
- **Hybrid**: Best overall, requires planning

### Step 2: Run Metadata Migration

```bash
# Lazy migration (recommended)
node migrate-cognito-to-jwt.js --strategy=lazy

# Force password reset
node migrate-cognito-to-jwt.js --strategy=force_reset

# Hybrid approach
node migrate-cognito-to-jwt.js --strategy=hybrid
```

This script will:
- Fetch all users from Cognito
- Create user records in DynamoDB with metadata
- Mark users as needing password migration
- Send password reset emails (if strategy requires)

### Step 3: Update Login Endpoint

#### For Lazy or Hybrid Migration:

Replace your current login endpoint with the migration-enabled version:

```bash
# Backup current login endpoint
cp src/app/api/auth/login/route.ts src/app/api/auth/login-backup.ts

# Use migration-enabled login
cp src/app/api/auth/login-with-migration/route.ts src/app/api/auth/login/route.ts
```

The new login endpoint will:
1. Try JWT authentication first (DynamoDB)
2. Fall back to Cognito if user not found or no password
3. Migrate password when Cognito authentication succeeds
4. Return JWT tokens

#### For Force Reset Migration:

No changes needed - users must reset passwords before logging in.

### Step 4: Monitor Migration Progress

Create a script to check migration status:

```javascript
// check-migration-status.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkStatus() {
  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-users',
    FilterExpression: 'attribute_exists(migratedFromCognito)'
  }));
  
  const total = result.Items.length;
  const migrated = result.Items.filter(u => u.passwordMigrated).length;
  const pending = total - migrated;
  
  console.log(`Total migrated users: ${total}`);
  console.log(`Passwords migrated: ${migrated} (${(migrated/total*100).toFixed(1)}%)`);
  console.log(`Pending migration: ${pending} (${(pending/total*100).toFixed(1)}%)`);
}

checkStatus();
```

### Step 5: Complete Migration

#### For Lazy Migration:
- Monitor migration progress weekly
- After 6-12 months, consider forcing password reset for remaining users
- Disable Cognito when migration is complete

#### For Force Reset:
- Monitor password reset completion
- Send reminder emails after 7 days
- Disable Cognito after 30 days

#### For Hybrid:
- Monitor lazy migration progress
- After 90 days, run force reset for remaining users
- Disable Cognito after grace period

---

## Migration Script Details

### What Gets Migrated

**Metadata (migrated immediately):**
- ✅ Email address
- ✅ First name
- ✅ Last name
- ✅ Role (student/instructor/admin)
- ✅ Email verification status
- ✅ Student ID (if applicable)
- ✅ Instructor ID (if applicable)
- ✅ Department (if applicable)
- ✅ Account creation date

**Passwords:**
- ❌ Cannot be exported from Cognito
- ✅ Migrated during login (lazy/hybrid)
- ✅ Reset by user (force reset/hybrid)

### Migration Metadata Added

Each migrated user gets these additional fields:
```javascript
{
  migratedFromCognito: true,
  cognitoSub: "cognito-user-id",
  migrationDate: "2025-01-16T...",
  migrationStrategy: "lazy|force_reset|hybrid",
  passwordMigrated: false, // true after password migration
  passwordMigrationDate: "2025-01-16T..." // set when password migrated
}
```

---

## Testing the Migration

### Test Lazy Migration

1. Run metadata migration:
   ```bash
   node migrate-cognito-to-jwt.js --strategy=lazy
   ```

2. Try logging in with a Cognito user:
   ```bash
   # User should log in successfully
   # Check logs for "Password migrated successfully"
   ```

3. Check user in DynamoDB:
   ```bash
   node check-migration-status.js
   ```

4. Try logging in again:
   ```bash
   # Should use JWT authentication (no Cognito call)
   ```

### Test Force Reset

1. Run metadata migration:
   ```bash
   node migrate-cognito-to-jwt.js --strategy=force_reset
   ```

2. Check email was sent:
   ```bash
   # Check user's email inbox for password reset
   ```

3. Try logging in without reset:
   ```bash
   # Should fail - no password in DynamoDB
   ```

4. Reset password and try again:
   ```bash
   # Should succeed with new password
   ```

---

## Rollback Plan

If migration fails or causes issues:

### Immediate Rollback

1. Restore original login endpoint:
   ```bash
   cp src/app/api/auth/login-backup.ts src/app/api/auth/login/route.ts
   ```

2. Users can continue using Cognito authentication

### Data Cleanup (Optional)

If you want to remove migrated users:

```javascript
// rollback-migration.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function rollback() {
  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-users',
    FilterExpression: 'attribute_exists(migratedFromCognito)'
  }));
  
  for (const user of result.Items) {
    await docClient.send(new DeleteCommand({
      TableName: 'classcast-users',
      Key: { userId: user.userId }
    }));
    console.log(`Deleted migrated user: ${user.email}`);
  }
}

rollback();
```

---

## Security Considerations

### Password Hashing

- Passwords are hashed with bcrypt (12 rounds)
- More secure than Cognito's default hashing
- Passwords are never stored in plain text

### Rate Limiting

The login endpoint includes rate limiting:
- Max 5 attempts per 15 minutes
- 15-minute block after max attempts
- Prevents brute force attacks

### CSRF Protection

Consider adding CSRF tokens to login requests for additional security.

### Token Security

- JWT tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Tokens stored in localStorage (consider httpOnly cookies for production)

---

## Cost Savings

After migration is complete:

### Cognito Costs (can be eliminated):
- User pool: $0.0055 per MAU (Monthly Active User)
- SMS/MFA: $0.05 per SMS
- Advanced security: $0.05 per MAU

### JWT Costs:
- DynamoDB: Pay per request (much cheaper)
- No per-user fees
- No SMS fees (use SES for emails)

**Estimated savings:** 60-80% reduction in auth costs

---

## Frequently Asked Questions

### Q: Can I export passwords from Cognito?
**A:** No, AWS does not allow exporting password hashes for security reasons.

### Q: Will users notice the migration?
**A:** With lazy migration, no. With force reset, yes - they must reset passwords.

### Q: How long does migration take?
**A:** Metadata migration: minutes. Password migration: depends on strategy (instant to months).

### Q: What happens to inactive users?
**A:** With lazy migration, they remain in Cognito until they log in. With force reset, they must reset password.

### Q: Can I migrate back to Cognito?
**A:** Yes, but you'd need to recreate users in Cognito (they'd need to reset passwords).

### Q: What about MFA/2FA?
**A:** MFA settings are not migrated. Users must re-enable MFA after migration.

### Q: What about social logins (Google, Facebook)?
**A:** Social logins are not migrated. Users must use email/password or re-link social accounts.

---

## Support

If you encounter issues during migration:

1. Check migration logs for errors
2. Verify AWS credentials and permissions
3. Test with a single user first
4. Monitor CloudWatch logs for API errors
5. Have rollback plan ready

---

## Recommendation

**For your production system, I recommend the Hybrid approach:**

1. Run metadata migration now
2. Enable lazy migration in login endpoint
3. Optionally send informational emails (not required)
4. Monitor migration progress for 90 days
5. Force reset for remaining users after 90 days
6. Disable Cognito after grace period

This provides the best balance of user experience and migration completeness.
