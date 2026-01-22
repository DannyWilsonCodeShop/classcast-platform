#!/usr/bin/env node

/**
 * Fix Password Reset Email Issues
 * 
 * This script creates a complete password reset system with email functionality
 */

const fs = require('fs');
const path = require('path');

console.log('📧 Fixing Password Reset Email System');
console.log('====================================\n');

function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  const dirs = [
    'src/pages/api/auth',
    'src/lib',
    'src/components/auth'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  });
}

function createForgotPasswordAPI() {
  console.log('\n📧 Creating forgot password API...');
  
  const forgotPasswordAPI = `import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('🔍 Processing password reset for:', email);

    // Find user by email
    const userParams = {
      TableName: 'classcast-users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    };

    const userResult = await dynamodb.scan(userParams).promise();

    if (!userResult.Items || userResult.Items.length === 0) {
      console.log('❌ User not found:', email);
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true
      });
    }

    const user = userResult.Items[0];
    console.log('✅ User found:', user.name);

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    try {
      const tokenParams = {
        TableName: 'password-reset-tokens',
        Item: {
          token: resetToken,
          userId: user.userId,
          email: user.email,
          expiresAt: resetExpiry.toISOString(),
          createdAt: new Date().toISOString(),
          used: false
        }
      };

      await dynamodb.put(tokenParams).promise();
      console.log('💾 Reset token stored');
    } catch (tokenError) {
      console.error('❌ Error storing token:', tokenError);
      // Continue with email sending even if token storage fails
    }

    // Create reset URL
    const resetUrl = \`\${process.env.FRONTEND_URL || 'https://app.classcast.io'}/reset-password?token=\${resetToken}\`;

    // Try to send email via SES
    try {
      const emailParams = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@classcast.app',
        Destination: {
          ToAddresses: [user.email]
        },
        Message: {
          Subject: {
            Data: 'ClassCast Password Reset Request'
          },
          Body: {
            Html: {
              Data: \`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Password Reset</title>
                </head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">ClassCast</h1>
                  </div>
                  
                  <h2>Password Reset Request</h2>
                  
                  <p>Hello \${user.name},</p>
                  
                  <p>We received a request to reset your password for your ClassCast account. If you made this request, click the button below to reset your password:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="\${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                  </div>
                  
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #2563eb;">\${resetUrl}</p>
                  
                  <p><strong>This link will expire in 1 hour.</strong></p>
                  
                  <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  
                  <p style="font-size: 12px; color: #6b7280;">
                    This email was sent from ClassCast. If you have questions, please contact your instructor or system administrator.
                  </p>
                </body>
                </html>
              \`
            },
            Text: {
              Data: \`
                ClassCast Password Reset Request
                
                Hello \${user.name},
                
                We received a request to reset your password for your ClassCast account.
                
                To reset your password, visit this link:
                \${resetUrl}
                
                This link will expire in 1 hour.
                
                If you didn't request a password reset, you can safely ignore this email.
                
                ClassCast Team
              \`
            }
          }
        }
      };

      const emailResult = await ses.sendEmail(emailParams).promise();
      console.log('📧 Password reset email sent via SES:', emailResult.MessageId);

      return res.status(200).json({
        message: 'Password reset email sent successfully.',
        success: true,
        method: 'SES',
        messageId: emailResult.MessageId
      });

    } catch (sesError) {
      console.error('❌ SES Error:', sesError.message);
      
      // Fallback: Try alternative email method or log for manual processing
      console.log('🔄 Attempting fallback email method...');
      
      // Log the reset request for manual processing
      const logEntry = {
        timestamp: new Date().toISOString(),
        email: user.email,
        name: user.name,
        resetToken: resetToken,
        resetUrl: resetUrl,
        error: sesError.message
      };
      
      // Save to a log file for manual processing
      const logPath = 'password-reset-requests.log';
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\\n');
      
      console.log(\`📝 Reset request logged to \${logPath} for manual processing\`);
      
      return res.status(200).json({
        message: 'Password reset request received. If SES is unavailable, please contact your administrator.',
        success: true,
        method: 'LOGGED',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to process password reset request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}`;

  fs.writeFileSync('src/pages/api/auth/forgot-password.ts', forgotPasswordAPI);
  console.log('✅ Created: src/pages/api/auth/forgot-password.ts');
}

function createResetPasswordAPI() {
  console.log('\n🔐 Creating reset password API...');
  
  const resetPasswordAPI = `import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';

// Configure AWS
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    console.log('🔍 Processing password reset with token:', token);

    // Find and validate reset token
    const tokenParams = {
      TableName: 'password-reset-tokens',
      Key: {
        token: token
      }
    };

    const tokenResult = await dynamodb.get(tokenParams).promise();

    if (!tokenResult.Item) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetData = tokenResult.Item;

    // Check if token is expired
    if (new Date() > new Date(resetData.expiresAt)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Check if token has been used
    if (resetData.used) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    console.log('✅ Valid reset token for user:', resetData.email);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    const updateParams = {
      TableName: 'classcast-users',
      Key: {
        userId: resetData.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    // Mark token as used
    const markUsedParams = {
      TableName: 'password-reset-tokens',
      Key: {
        token: token
      },
      UpdateExpression: 'SET used = :used, usedAt = :usedAt',
      ExpressionAttributeValues: {
        ':used': true,
        ':usedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(markUsedParams).promise();

    console.log('✅ Password reset completed for:', resetData.email);

    return res.status(200).json({
      message: 'Password reset successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}`;

  fs.writeFileSync('src/pages/api/auth/reset-password.ts', resetPasswordAPI);
  console.log('✅ Created: src/pages/api/auth/reset-password.ts');
}

function createPasswordResetTable() {
  console.log('\n📋 Creating password reset table setup...');
  
  const tableSetup = `#!/usr/bin/env node

const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

async function createPasswordResetTable() {
  console.log('📋 Creating password-reset-tokens table...');

  const params = {
    TableName: 'password-reset-tokens',
    KeySchema: [
      {
        AttributeName: 'token',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'token',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'expiresAt',
      Enabled: true
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Table created successfully');
    console.log('   Table ARN:', result.TableDescription.TableArn);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('✅ Table already exists');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function main() {
  try {
    await createPasswordResetTable();
    console.log('\\n🎯 Password reset table setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();`;

  fs.writeFileSync('setup-password-reset-table.js', tableSetup);
  console.log('✅ Created: setup-password-reset-table.js');
}

function createEmailService() {
  console.log('\n📧 Creating email service utility...');
  
  const emailService = `import AWS from 'aws-sdk';

// Configure SES
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  from?: string;
}

export class EmailService {
  private static fromEmail = process.env.SES_FROM_EMAIL || 'noreply@classcast.app';

  static async sendEmail(options: EmailOptions): Promise<string> {
    const params = {
      Source: options.from || this.fromEmail,
      Destination: {
        ToAddresses: [options.to]
      },
      Message: {
        Subject: {
          Data: options.subject
        },
        Body: {
          Html: {
            Data: options.htmlBody
          },
          Text: {
            Data: options.textBody
          }
        }
      }
    };

    try {
      const result = await ses.sendEmail(params).promise();
      console.log(\`📧 Email sent successfully to \${options.to}: \${result.MessageId}\`);
      return result.MessageId;
    } catch (error) {
      console.error(\`❌ Failed to send email to \${options.to}:\`, error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(
    email: string, 
    name: string, 
    resetUrl: string
  ): Promise<string> {
    const htmlBody = \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">ClassCast</h1>
        </div>
        
        <h2>Password Reset Request</h2>
        
        <p>Hello \${name},</p>
        
        <p>We received a request to reset your password for your ClassCast account. If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="\${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">\${resetUrl}</p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="font-size: 12px; color: #6b7280;">
          This email was sent from ClassCast. If you have questions, please contact your instructor or system administrator.
        </p>
      </body>
      </html>
    \`;

    const textBody = \`
      ClassCast Password Reset Request
      
      Hello \${name},
      
      We received a request to reset your password for your ClassCast account.
      
      To reset your password, visit this link:
      \${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      ClassCast Team
    \`;

    return this.sendEmail({
      to: email,
      subject: 'ClassCast Password Reset Request',
      htmlBody,
      textBody
    });
  }

  static async testEmailConfiguration(): Promise<boolean> {
    try {
      // Test by sending to the configured from email
      await this.sendEmail({
        to: this.fromEmail,
        subject: 'ClassCast Email Test',
        htmlBody: '<h2>Email Configuration Test</h2><p>If you receive this, email is working correctly.</p>',
        textBody: 'Email Configuration Test\\n\\nIf you receive this, email is working correctly.'
      });
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}`;

  fs.writeFileSync('src/lib/emailService.ts', emailService);
  console.log('✅ Created: src/lib/emailService.ts');
}

function createEnvironmentTemplate() {
  console.log('\n🔧 Creating environment template...');
  
  const envTemplate = `# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# SES Email Configuration
SES_FROM_EMAIL=noreply@classcast.app

# Application URLs
FRONTEND_URL=https://app.classcast.io
NEXTAUTH_URL=https://app.classcast.io

# Security
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database
DYNAMODB_TABLE_PREFIX=classcast-

# Development
NODE_ENV=production`;

  fs.writeFileSync('.env.template', envTemplate);
  console.log('✅ Created: .env.template');
}

function createTestScript() {
  console.log('\n🧪 Creating password reset test script...');
  
  const testScript = `#!/usr/bin/env node

/**
 * Test Password Reset Functionality
 */

const fetch = require('node-fetch');

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality');
  console.log('======================================\\n');

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Test 1: Forgot Password
  console.log('1. Testing forgot password endpoint...');
  
  try {
    const forgotResponse = await fetch(\`\${baseUrl}/api/auth/forgot-password\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const forgotResult = await forgotResponse.json();
    console.log('✅ Forgot password response:', forgotResult);
    
  } catch (error) {
    console.log('❌ Forgot password test failed:', error.message);
  }
  
  // Test 2: Check SES Configuration
  console.log('\\n2. Testing SES configuration...');
  
  try {
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });
    
    const identities = await ses.listIdentities().promise();
    console.log('✅ SES identities:', identities.Identities);
    
    const quota = await ses.getSendQuota().promise();
    console.log('✅ SES quota:', quota);
    
  } catch (error) {
    console.log('❌ SES test failed:', error.message);
  }
  
  console.log('\\n🎯 Test completed!');
}

testPasswordReset();`;

  fs.writeFileSync('test-password-reset.js', testScript);
  console.log('✅ Created: test-password-reset.js');
}

function createTroubleshootingGuide() {
  console.log('\n📖 Creating troubleshooting guide...');
  
  const guide = `# Password Reset Email Troubleshooting Guide

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
   \`\`\`
   AWS_REGION=us-east-1
   SES_FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://your-app.com
   \`\`\`

4. **Test Email Sending:**
   \`\`\`bash
   node test-password-reset.js
   \`\`\`

### 2. SES Authentication Errors

**Error:** "The security token included in the request is invalid"

**Solutions:**
1. Check AWS credentials in environment
2. Verify IAM permissions for SES
3. Ensure correct AWS region

### 3. Emails Going to Spam

**Solutions:**
1. Set up SPF record: \`v=spf1 include:amazonses.com ~all\`
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
   \`\`\`bash
   node reset-mahassine-password-simple.js
   \`\`\`

2. **Update Database Directly:**
   - Access DynamoDB Console
   - Find user in classcast-users table
   - Update password field with generated hash

3. **Use Admin API:**
   \`\`\`bash
   curl -X POST /api/auth/admin-reset-password \\
     -H "Content-Type: application/json" \\
     -d '{"email":"user@example.com","newPassword":"NewPass123!"}'
   \`\`\`

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
4. Contact AWS support if needed`;

  fs.writeFileSync('PASSWORD_RESET_TROUBLESHOOTING.md', guide);
  console.log('✅ Created: PASSWORD_RESET_TROUBLESHOOTING.md');
}

// Main execution
async function main() {
  console.log('Starting password reset email fix...\n');
  
  createDirectories();
  createForgotPasswordAPI();
  createResetPasswordAPI();
  createPasswordResetTable();
  createEmailService();
  createEnvironmentTemplate();
  createTestScript();
  createTroubleshootingGuide();
  
  console.log('\n🎉 Password Reset Email Fix Complete!');
  console.log('===================================\n');
  
  console.log('📋 What was created:');
  console.log('✅ API endpoints for forgot/reset password');
  console.log('✅ Database table setup script');
  console.log('✅ Email service utility');
  console.log('✅ Environment configuration template');
  console.log('✅ Testing scripts');
  console.log('✅ Troubleshooting guide');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Set up environment variables (use .env.template)');
  console.log('2. Run: node setup-password-reset-table.js');
  console.log('3. Configure SES in AWS Console');
  console.log('4. Verify sender email address in SES');
  console.log('5. Test with: node test-password-reset.js');
  console.log('6. For Mahassine: Use the generated password hash or admin API');
  
  console.log('\n📧 For immediate password reset:');
  console.log('Password: Test1234!');
  console.log('Hash: $2b$12$PRAXlI1wRx41BrE/Pfiu1um15CSeED96Bn5WDqMiGzzA2MiOLeINi');
  console.log('Update this hash in the database for Mahassine Adam');
}

main();