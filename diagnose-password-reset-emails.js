#!/usr/bin/env node

/**
 * Diagnose and fix password reset email issues
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();

async function diagnosePasswordResetEmails() {
  console.log('📧 Diagnosing Password Reset Email Issues');
  console.log('=========================================\n');

  let issues = [];
  let fixes = [];

  try {
    // 1. Check SES configuration
    console.log('1. 📮 Checking SES (Simple Email Service) Configuration...');
    
    try {
      const sesIdentities = await ses.listIdentities().promise();
      console.log('✅ SES is accessible');
      console.log(`   Verified identities: ${sesIdentities.Identities.length}`);
      
      if (sesIdentities.Identities.length === 0) {
        issues.push('No verified email identities in SES');
        fixes.push('Add and verify a sender email address in SES');
      } else {
        console.log('   Identities:', sesIdentities.Identities);
        
        // Check verification status
        for (const identity of sesIdentities.Identities) {
          const verification = await ses.getIdentityVerificationAttributes({
            Identities: [identity]
          }).promise();
          
          const status = verification.VerificationAttributes[identity]?.VerificationStatus;
          console.log(`   ${identity}: ${status || 'Unknown'}`);
          
          if (status !== 'Success') {
            issues.push(`Email identity ${identity} is not verified`);
            fixes.push(`Verify email identity ${identity} in SES console`);
          }
        }
      }
    } catch (error) {
      console.log('❌ SES Error:', error.message);
      issues.push('SES is not properly configured or accessible');
      fixes.push('Configure SES in AWS console and verify email addresses');
    }

    // 2. Check if we're in SES sandbox mode
    console.log('\n2. 🏖️ Checking SES Sandbox Status...');
    
    try {
      const sendQuota = await ses.getSendQuota().promise();
      console.log(`   Send Quota: ${sendQuota.Max24HourSend} emails/24h`);
      console.log(`   Sent Today: ${sendQuota.SentLast24Hours}`);
      
      if (sendQuota.Max24HourSend <= 200) {
        issues.push('SES is in sandbox mode - can only send to verified addresses');
        fixes.push('Request production access for SES to send to any email address');
      } else {
        console.log('✅ SES is in production mode');
      }
    } catch (error) {
      console.log('❌ Could not check SES quota:', error.message);
    }

    // 3. Check Lambda functions for password reset
    console.log('\n3. ⚡ Checking Lambda Functions...');
    
    try {
      const functions = await lambda.listFunctions().promise();
      const passwordResetFunctions = functions.Functions.filter(f => 
        f.FunctionName.toLowerCase().includes('password') || 
        f.FunctionName.toLowerCase().includes('reset') ||
        f.FunctionName.toLowerCase().includes('forgot')
      );
      
      if (passwordResetFunctions.length === 0) {
        issues.push('No password reset Lambda function found');
        fixes.push('Create a Lambda function to handle password reset emails');
      } else {
        console.log('✅ Found password reset functions:');
        passwordResetFunctions.forEach(func => {
          console.log(`   - ${func.FunctionName} (${func.Runtime})`);
        });
      }
    } catch (error) {
      console.log('❌ Lambda Error:', error.message);
      issues.push('Cannot access Lambda functions');
    }

    // 4. Check API Gateway endpoints
    console.log('\n4. 🌐 Checking API Gateway Endpoints...');
    
    try {
      const apis = await apigateway.getRestApis().promise();
      console.log(`✅ Found ${apis.items.length} API Gateway(s)`);
      
      for (const api of apis.items) {
        console.log(`   API: ${api.name} (${api.id})`);
        
        try {
          const resources = await apigateway.getResources({
            restApiId: api.id
          }).promise();
          
          const passwordResetEndpoints = resources.items.filter(resource => 
            resource.pathPart && (
              resource.pathPart.includes('password') ||
              resource.pathPart.includes('reset') ||
              resource.pathPart.includes('forgot')
            )
          );
          
          if (passwordResetEndpoints.length > 0) {
            console.log('   Password reset endpoints found:');
            passwordResetEndpoints.forEach(endpoint => {
              console.log(`     - ${endpoint.path}`);
            });
          }
        } catch (error) {
          console.log(`   Could not check resources for ${api.name}`);
        }
      }
    } catch (error) {
      console.log('❌ API Gateway Error:', error.message);
    }

    // 5. Check environment variables
    console.log('\n5. 🔧 Checking Environment Variables...');
    
    const requiredEnvVars = [
      'AWS_REGION',
      'SES_FROM_EMAIL',
      'FRONTEND_URL',
      'JWT_SECRET'
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: ${envVar === 'JWT_SECRET' ? '[HIDDEN]' : process.env[envVar]}`);
      } else {
        console.log(`❌ ${envVar}: Not set`);
        issues.push(`Environment variable ${envVar} is not set`);
        fixes.push(`Set ${envVar} in your environment configuration`);
      }
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }

  // Summary
  console.log('\n📊 Diagnostic Summary');
  console.log('====================\n');
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues found with email configuration');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (fixes.length > 0) {
    console.log('\n🔧 Recommended Fixes:\n');
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });
  }

  return { issues, fixes };
}

async function testPasswordResetEmail() {
  console.log('\n📧 Testing Password Reset Email Functionality');
  console.log('=============================================\n');

  try {
    // Test SES email sending
    console.log('🧪 Testing SES email sending...');
    
    const testEmailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@classcast.app',
      Destination: {
        ToAddresses: [process.env.SES_FROM_EMAIL || 'test@example.com']
      },
      Message: {
        Subject: {
          Data: 'ClassCast Password Reset Test'
        },
        Body: {
          Html: {
            Data: `
              <h2>Password Reset Test</h2>
              <p>This is a test email to verify password reset functionality.</p>
              <p>If you receive this email, SES is working correctly.</p>
              <p>Test Time: ${new Date().toISOString()}</p>
            `
          },
          Text: {
            Data: `
              Password Reset Test
              
              This is a test email to verify password reset functionality.
              If you receive this email, SES is working correctly.
              
              Test Time: ${new Date().toISOString()}
            `
          }
        }
      }
    };

    const result = await ses.sendEmail(testEmailParams).promise();
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.MessageId}`);
    
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
    
    if (error.code === 'MessageRejected') {
      console.log('💡 Email was rejected - check SES sandbox mode and verified addresses');
    } else if (error.code === 'SendingPausedException') {
      console.log('💡 SES sending is paused - check your AWS account status');
    } else if (error.code === 'MailFromDomainNotVerifiedException') {
      console.log('💡 Sender domain is not verified - verify your domain in SES');
    }
  }
}

async function createPasswordResetFix() {
  console.log('\n🔧 Creating Password Reset Email Fix');
  console.log('===================================\n');

  // Create a comprehensive password reset API endpoint
  const passwordResetAPI = `
import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
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
    console.log('🔍 Looking up user:', email);

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
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    const user = userResult.Items[0];
    console.log('✅ User found:', user.name);

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
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

    // Create reset URL
    const resetUrl = \`\${process.env.FRONTEND_URL || 'https://app.classcast.io'}/reset-password?token=\${resetToken}\`;

    // Send email
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
    console.log('📧 Password reset email sent:', emailResult.MessageId);

    return res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      messageId: emailResult.MessageId
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to process password reset request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
`;

  // Save the API endpoint
  const apiPath = 'src/pages/api/auth/forgot-password.ts';
  require('fs').writeFileSync(apiPath, passwordResetAPI);
  console.log(`✅ Created password reset API: ${apiPath}`);

  // Create password reset table setup
  const tableSetup = `
#!/usr/bin/env node

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
    await dynamodb.createTable(params).promise();
    console.log('✅ Table created successfully');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('✅ Table already exists');
    } else {
      console.error('❌ Error creating table:', error);
    }
  }
}

createPasswordResetTable();
`;

  require('fs').writeFileSync('setup-password-reset-table.js', tableSetup);
  console.log('✅ Created table setup script: setup-password-reset-table.js');
}

// Main execution
async function main() {
  const diagnostic = await diagnosePasswordResetEmails();
  await testPasswordResetEmail();
  await createPasswordResetFix();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run: node reset-mahassine-password.js');
  console.log('2. Run: node setup-password-reset-table.js');
  console.log('3. Verify SES configuration in AWS console');
  console.log('4. Test password reset functionality');
  console.log('5. Check email delivery and spam folders');
}

main();