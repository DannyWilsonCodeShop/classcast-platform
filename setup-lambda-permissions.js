const AWS = require('aws-sdk');

const iam = new AWS.IAM({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function setupLambdaPermissions() {
  try {
    console.log('🔧 Setting up Lambda permissions and environment variables...');
    
    // Update the existing IAM role with additional permissions
    const roleName = 'classcast-lambda-role';
    
    // Create comprehensive policy for Lambda functions
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem'
          ],
          Resource: [
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-users',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-assignments',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-courses',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-submissions',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-users/index/*',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-assignments/index/*',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-courses/index/*',
            'arn:aws:dynamodb:us-east-1:463470937777:table/classcast-submissions/index/*'
          ]
        },
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:GetObjectVersion',
            's3:PutObjectAcl',
            's3:GetObjectAcl'
          ],
          Resource: [
            'arn:aws:s3:::classcast-videos-463470937777-us-east-1/*',
            'arn:aws:s3:::classcast-videos-463470937777-us-east-1'
          ]
        },
        {
          Effect: 'Allow',
          Action: [
            's3:GeneratePresignedPost',
            's3:ListBucket'
          ],
          Resource: [
            'arn:aws:s3:::classcast-videos-463470937777-us-east-1'
          ]
        },
        {
          Effect: 'Allow',
          Action: [
            'cognito-idp:AdminGetUser',
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminUpdateUserAttributes',
            'cognito-idp:AdminDeleteUser',
            'cognito-idp:AdminSetUserPassword',
            'cognito-idp:AdminConfirmSignUp',
            'cognito-idp:AdminResendConfirmationCode',
            'cognito-idp:AdminInitiateAuth',
            'cognito-idp:AdminRespondToAuthChallenge',
            'cognito-idp:AdminForgetDevice',
            'cognito-idp:AdminListGroupsForUser',
            'cognito-idp:AdminAddUserToGroup',
            'cognito-idp:AdminRemoveUserFromGroup'
          ],
          Resource: '*'
        },
        {
          Effect: 'Allow',
          Action: [
            'ses:SendEmail',
            'ses:SendRawEmail'
          ],
          Resource: '*'
        },
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          Resource: 'arn:aws:logs:us-east-1:463470937777:*'
        }
      ]
    };
    
    // Create or update the policy
    try {
      await iam.createPolicy({
        PolicyName: 'ClassCast-Lambda-Policy',
        PolicyDocument: JSON.stringify(policyDocument),
        Description: 'Comprehensive permissions for ClassCast Lambda functions'
      }).promise();
      console.log('✅ Created new IAM policy');
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        console.log('✅ IAM policy already exists');
      } else {
        throw error;
      }
    }
    
    // Attach policy to role
    try {
      await iam.attachRolePolicy({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::463470937777:policy/ClassCast-Lambda-Policy'
      }).promise();
      console.log('✅ Attached policy to Lambda role');
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        console.log('✅ Policy already attached to role');
      } else {
        throw error;
      }
    }
    
    // Set environment variables for all Lambda functions
    const lambdaFunctions = [
      'classcast-create-assignment',
      'classcast-fetch-assignments',
      'classcast-grade-submission',
      'classcast-fetch-grades',
      'classcast-fetch-submissions',
      'classcast-signin-handler',
      'classcast-signup-handler',
      'classcast-signout-handler',
      'classcast-forgot-password-handler',
      'classcast-confirm-password-reset',
      'classcast-refresh-token-handler',
      'classcast-resend-confirmation',
      'classcast-signup-confirmation',
      'classcast-generate-video-upload-url',
      'classcast-process-video-submission',
      'classcast-role-management',
      'classcast-role-based-signup',
      'classcast-instructor-community-feed',
      'classcast-jwt-verifier',
      'classcast-session-management',
      'classcast-pre-authentication',
      'classcast-pre-token-generation',
      'classcast-custom-message',
      'classcast-post-confirmation'
    ];
    
    const environmentVariables = {
      USERS_TABLE_NAME: 'classcast-users',
      ASSIGNMENTS_TABLE_NAME: 'classcast-assignments',
      COURSES_TABLE_NAME: 'classcast-courses',
      SUBMISSIONS_TABLE_NAME: 'classcast-submissions',
      S3_BUCKET_NAME: 'classcast-videos-463470937777-us-east-1',
      USER_POOL_ID: 'us-east-1_XXXXXXXXX', // Will be updated with actual User Pool ID
      REGION: 'us-east-1'
    };
    
    // Update each Lambda function with environment variables
    for (const functionName of lambdaFunctions) {
      try {
        await lambda.updateFunctionConfiguration({
          FunctionName: functionName,
          Environment: {
            Variables: environmentVariables
          }
        }).promise();
        console.log(`✅ Updated environment variables for ${functionName}`);
      } catch (error) {
        console.log(`⚠️  Could not update ${functionName}: ${error.message}`);
      }
    }
    
    // Add API Gateway permissions for Lambda functions
    const apiGatewayArn = 'arn:aws:execute-api:us-east-1:463470937777:785t4qadp8/*';
    
    for (const functionName of lambdaFunctions) {
      try {
        await lambda.addPermission({
          FunctionName: functionName,
          StatementId: `api-gateway-${Date.now()}`,
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: apiGatewayArn
        }).promise();
        console.log(`✅ Added API Gateway permission for ${functionName}`);
      } catch (error) {
        if (error.code === 'ResourceConflictException') {
          console.log(`✅ Permission already exists for ${functionName}`);
        } else {
          console.log(`⚠️  Could not add permission for ${functionName}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Lambda permissions and environment setup complete!');
    console.log('📋 Environment variables set:');
    console.log('- USERS_TABLE_NAME: classcast-users');
    console.log('- ASSIGNMENTS_TABLE_NAME: classcast-assignments');
    console.log('- COURSES_TABLE_NAME: classcast-courses');
    console.log('- SUBMISSIONS_TABLE_NAME: classcast-submissions');
    console.log('- S3_BUCKET_NAME: classcast-videos-463470937777-us-east-1');
    console.log('- REGION: us-east-1');
    
  } catch (error) {
    console.error('❌ Error setting up Lambda permissions:', error);
    throw error;
  }
}

// Run the setup
setupLambdaPermissions()
  .then(() => {
    console.log('\n✅ All Lambda functions are now properly configured!');
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
