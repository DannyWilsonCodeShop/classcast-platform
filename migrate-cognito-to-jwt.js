#!/usr/bin/env node

/**
 * Cognito to JWT Migration Script
 * 
 * This script migrates user metadata from AWS Cognito to DynamoDB for JWT authentication.
 * 
 * IMPORTANT: This script ONLY migrates user metadata (email, name, role, etc.)
 * Passwords CANNOT be exported from Cognito due to AWS security restrictions.
 * 
 * Migration Strategy Options:
 * 1. LAZY: Migrate passwords as users log in (recommended)
 * 2. FORCE_RESET: Require all users to reset passwords
 * 3. HYBRID: Lazy migration + force reset after 90 days
 * 
 * Usage:
 *   node migrate-cognito-to-jwt.js --strategy=lazy
 *   node migrate-cognito-to-jwt.js --strategy=force_reset
 *   node migrate-cognito-to-jwt.js --strategy=hybrid
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ses = new SESClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_uK50qBrap';
const USERS_TABLE = 'classcast-users';
const MIGRATION_TABLE = 'classcast-cognito-migration'; // Track migration status

// Parse command line arguments
const args = process.argv.slice(2);
const strategyArg = args.find(arg => arg.startsWith('--strategy='));
const strategy = strategyArg ? strategyArg.split('=')[1] : 'lazy';

if (!['lazy', 'force_reset', 'hybrid'].includes(strategy)) {
  console.error('❌ Invalid strategy. Use: lazy, force_reset, or hybrid');
  process.exit(1);
}

console.log(`\n🔄 Starting Cognito to JWT Migration (Strategy: ${strategy.toUpperCase()})\n`);

/**
 * Create migration tracking table if it doesn't exist
 */
async function ensureMigrationTable() {
  // Note: In production, create this table via CDK or AWS Console
  // This is just for tracking which users have been migrated
  console.log('📋 Ensuring migration tracking table exists...');
  // Table structure:
  // - userId (primary key)
  // - email
  // - migrationDate
  // - passwordMigrated (boolean)
  // - strategy (lazy/force_reset/hybrid)
}

/**
 * Fetch all users from Cognito
 */
async function fetchCognitoUsers() {
  console.log('👥 Fetching users from Cognito...\n');
  
  const allUsers = [];
  let paginationToken = undefined;
  
  do {
    const response = await cognito.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      PaginationToken: paginationToken
    }));
    
    if (response.Users) {
      allUsers.push(...response.Users);
    }
    
    paginationToken = response.PaginationToken;
  } while (paginationToken);
  
  console.log(`✅ Found ${allUsers.length} users in Cognito\n`);
  return allUsers;
}

/**
 * Check if user already exists in DynamoDB
 */
async function userExistsInDynamoDB(email) {
  const result = await docClient.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  }));
  
  return result.Items && result.Items.length > 0;
}

/**
 * Extract user attributes from Cognito user object
 */
function extractUserAttributes(cognitoUser) {
  const attributes = cognitoUser.Attributes || [];
  const getAttribute = (name) => attributes.find(attr => attr.Name === name)?.Value || '';
  
  return {
    sub: getAttribute('sub'),
    email: getAttribute('email'),
    emailVerified: getAttribute('email_verified') === 'true',
    givenName: getAttribute('given_name'),
    familyName: getAttribute('family_name'),
    role: getAttribute('custom:role') || 'student',
    studentId: getAttribute('custom:student_id'),
    instructorId: getAttribute('custom:instructor_id'),
    department: getAttribute('custom:department'),
  };
}

/**
 * Migrate a single user's metadata to DynamoDB
 */
async function migrateUserMetadata(cognitoUser, strategy) {
  const attrs = extractUserAttributes(cognitoUser);
  
  // Check if user already exists
  const exists = await userExistsInDynamoDB(attrs.email);
  if (exists) {
    console.log(`⏭️  Skipping ${attrs.email} - already exists in DynamoDB`);
    return { skipped: true, email: attrs.email };
  }
  
  // Generate new user ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create user object
  const userData = {
    userId,
    email: attrs.email,
    firstName: attrs.givenName || '',
    lastName: attrs.familyName || '',
    role: attrs.role,
    emailVerified: attrs.emailVerified,
    createdAt: cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Migration metadata
    migratedFromCognito: true,
    cognitoSub: attrs.sub,
    migrationDate: new Date().toISOString(),
    migrationStrategy: strategy,
    passwordMigrated: false, // Will be set to true when password is migrated
    
    // Role-specific fields
    ...(attrs.role === 'student' && attrs.studentId && { studentId: attrs.studentId }),
    ...(attrs.role === 'instructor' && {
      department: attrs.department || '',
      instructorCode: attrs.instructorId || `INS-${Date.now()}`
    }),
    
    // Note: No password field - will be set during lazy migration or password reset
  };
  
  // Save to DynamoDB
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: userData
  }));
  
  console.log(`✅ Migrated ${attrs.email} (${attrs.role})`);
  
  return { migrated: true, email: attrs.email, userId, role: attrs.role };
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, firstName) {
  const resetLink = `https://class-cast.com/auth/forgot-password?email=${encodeURIComponent(email)}`;
  
  const params = {
    Source: 'noreply@myclasscast.com', // Use verified email
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Subject: {
        Data: 'ClassCast Account Migration - Password Reset Required'
      },
      Body: {
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4F46E5;">ClassCast Account Migration</h2>
                  
                  <p>Hi ${firstName || 'there'},</p>
                  
                  <p>We've upgraded our authentication system to provide you with a better and more secure experience!</p>
                  
                  <p>To complete the migration of your account, please reset your password:</p>
                  
                  <div style="margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                      Reset Your Password
                    </a>
                  </div>
                  
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="color: #666; word-break: break-all;">${resetLink}</p>
                  
                  <p><strong>Important:</strong> You must reset your password to access your account.</p>
                  
                  <p>If you have any questions, please contact our support team.</p>
                  
                  <p>Best regards,<br>The ClassCast Team</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #666;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </div>
              </body>
            </html>
          `
        },
        Text: {
          Data: `
Hi ${firstName || 'there'},

We've upgraded our authentication system to provide you with a better and more secure experience!

To complete the migration of your account, please reset your password by visiting:
${resetLink}

IMPORTANT: You must reset your password to access your account.

If you have any questions, please contact our support team.

Best regards,
The ClassCast Team
          `
        }
      }
    }
  };
  
  try {
    await ses.send(new SendEmailCommand(params));
    console.log(`📧 Sent password reset email to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    // Log the email for manual follow-up
    console.error(`   ⚠️  MANUAL ACTION REQUIRED: Contact ${email} to reset password at ${resetLink}`);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    await ensureMigrationTable();
    
    const cognitoUsers = await fetchCognitoUsers();
    
    if (cognitoUsers.length === 0) {
      console.log('No users to migrate.');
      return;
    }
    
    const results = {
      migrated: [],
      skipped: [],
      errors: [],
      emailsSent: 0
    };
    
    console.log('🔄 Starting user migration...\n');
    
    for (const cognitoUser of cognitoUsers) {
      try {
        const result = await migrateUserMetadata(cognitoUser, strategy);
        
        if (result.skipped) {
          results.skipped.push(result.email);
        } else if (result.migrated) {
          results.migrated.push(result.email);
          
          // Send password reset email if strategy requires it
          if (strategy === 'force_reset' || strategy === 'hybrid') {
            const attrs = extractUserAttributes(cognitoUser);
            const emailSent = await sendPasswordResetEmail(result.email, attrs.givenName);
            if (emailSent) {
              results.emailsSent++;
            }
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const attrs = extractUserAttributes(cognitoUser);
        console.error(`❌ Error migrating ${attrs.email}:`, error.message);
        results.errors.push({ email: attrs.email, error: error.message });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Strategy: ${strategy.toUpperCase()}`);
    console.log(`Total users in Cognito: ${cognitoUsers.length}`);
    console.log(`✅ Successfully migrated: ${results.migrated.length}`);
    console.log(`⏭️  Skipped (already exist): ${results.skipped.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (strategy === 'force_reset' || strategy === 'hybrid') {
      console.log(`📧 Password reset emails sent: ${results.emailsSent}`);
    }
    
    console.log('='.repeat(60));
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }
    
    // Strategy-specific next steps
    console.log('\n📝 NEXT STEPS:\n');
    
    if (strategy === 'lazy') {
      console.log('✅ Metadata migration complete!');
      console.log('');
      console.log('The login endpoint will now:');
      console.log('1. Try JWT authentication first');
      console.log('2. Fall back to Cognito if user not found');
      console.log('3. Migrate password when Cognito user logs in');
      console.log('');
      console.log('No action required from users - migration happens automatically on login.');
    } else if (strategy === 'force_reset') {
      console.log('✅ Metadata migration complete!');
      console.log(`📧 Password reset emails sent to ${results.emailsSent} users`);
      console.log('');
      console.log('Users must reset their passwords to access their accounts.');
      console.log('');
      console.log('⚠️  You can now disable Cognito authentication in your login endpoint.');
    } else if (strategy === 'hybrid') {
      console.log('✅ Metadata migration complete!');
      console.log(`📧 Password reset emails sent to ${results.emailsSent} users`);
      console.log('');
      console.log('The system will:');
      console.log('1. Allow lazy migration for users who log in');
      console.log('2. Users who received emails can reset passwords immediately');
      console.log('3. After 90 days, force password reset for remaining Cognito-only users');
      console.log('');
      console.log('Schedule a follow-up migration in 90 days to force reset remaining users.');
    }
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
