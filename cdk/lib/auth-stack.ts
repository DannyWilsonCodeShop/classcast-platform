import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface AuthStackProps extends cdk.StackProps {
  usersTable?: dynamodb.ITable;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly authenticatedRole: iam.Role;
  public readonly unauthenticatedRole: iam.Role;
  public readonly studentRole: iam.Role;
  public readonly instructorRole: iam.Role;
  public readonly adminRole: iam.Role;

  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    // Create Lambda function for pre-token generation with enhanced role management
    const preTokenGenerationLambda = new lambda.Function(this, 'PreTokenGenerationLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Pre-token generation event:', JSON.stringify(event, null, 2));
          
          const { userName, request } = event;
          const userAttributes = request.userAttributes;
          
          // Get user's group membership and role
          const groups = event.request.groupConfiguration?.groupsToOverride || [];
          const role = userAttributes['custom:role'] || 'student';
          
          // Enhanced claims based on role and groups
          const claims = {
            'custom:role': role,
            'custom:userId': userName,
            'custom:email': userAttributes.email,
            'custom:firstName': userAttributes.given_name || '',
            'custom:lastName': userAttributes.family_name || '',
            'custom:department': userAttributes['custom:department'] || '',
            'custom:studentId': userAttributes['custom:studentId'] || '',
            'custom:instructorId': userAttributes['custom:instructorId'] || '',
            'custom:groups': groups.join(','),
            'custom:isStudent': groups.includes('students') ? 'true' : 'false',
            'custom:isInstructor': groups.includes('instructors') ? 'true' : 'false',
            'custom:isAdmin': groups.includes('admins') ? 'true' : 'false',
          };
          
          event.response = {
            ...event.response,
            claimsOverrideDetails: {
              claimsToAddOrOverride: claims,
              claimsToSuppress: [],
            },
          };
          
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        LOG_LEVEL: 'INFO',
      },
    });

    // Create Lambda function for post confirmation with user profile creation
    const postConfirmationLambda = new lambda.Function(this, 'PostConfirmationLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Post confirmation event:', JSON.stringify(event, null, 2));
          
          try {
            const { userName, request } = event;
            const userAttributes = request.userAttributes;
            
            // Determine user role and group
            const role = userAttributes['custom:role'] || 'student';
            const groupName = role === 'instructor' ? 'instructors' : 'students';
            
            // Add user to appropriate group
            const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
            await cognitoIdp.adminAddUserToGroup({
              GroupName: groupName,
              Username: userName,
              UserPoolId: process.env.USER_POOL_ID,
            }).promise();
            
            console.log('User added to group:', groupName);
            
            // Create user profile in DynamoDB if table exists
            if (process.env.USERS_TABLE_NAME) {
              const dynamodb = new AWS.DynamoDB.DocumentClient();
              const userProfile = {
                userId: userName,
                email: userAttributes.email,
                firstName: userAttributes.given_name,
                lastName: userAttributes.family_name,
                role: role,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                department: userAttributes['custom:department'] || '',
                studentId: userAttributes['custom:studentId'] || '',
                instructorId: userAttributes['custom:instructorId'] || '',
                bio: userAttributes['custom:bio'] || '',
                avatar: userAttributes['custom:avatar'] || '',
                preferences: {
                  notifications: true,
                  theme: 'light',
                  language: 'en'
                }
              };
              
              await dynamodb.put({
                TableName: process.env.USERS_TABLE_NAME,
                Item: userProfile,
              }).promise();
              
              console.log('User profile created in DynamoDB');
            }
            
          } catch (error) {
            console.error('Error in post confirmation:', error);
            // Don't throw error to prevent user confirmation failure
          }
          
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        LOG_LEVEL: 'INFO',
        USER_POOL_ID: '', // Will be set after user pool creation
        USERS_TABLE_NAME: props?.usersTable?.tableName || '',
      },
    });

    // Create Lambda function for pre-authentication with enhanced security
    const preAuthenticationLambda = new lambda.Function(this, 'PreAuthenticationLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Pre-authentication event:', JSON.stringify(event, null, 2));
          
          try {
            const { userName, request } = event;
            
            // Check if user account is locked or suspended
            if (process.env.USERS_TABLE_NAME) {
              const dynamodb = new AWS.DynamoDB.DocumentClient();
              const user = await dynamodb.get({
                TableName: process.env.USERS_TABLE_NAME,
                Key: { userId: userName }
              }).promise();
              
              if (user.Item) {
                if (user.Item.status === 'locked') {
                  throw new Error('Account is locked. Please contact support.');
                }
                if (user.Item.status === 'suspended') {
                  throw new Error('Account is suspended. Please contact support.');
                }
                
                // Update last login timestamp
                await dynamodb.update({
                  TableName: process.env.USERS_TABLE_NAME,
                  Key: { userId: userName },
                  UpdateExpression: 'SET lastLogin = :lastLogin',
                  ExpressionAttributeValues: {
                    ':lastLogin': new Date().toISOString()
                  }
                }).promise();
              }
            }
            
          } catch (error) {
            console.error('Error in pre-authentication:', error);
            throw error; // This will prevent authentication
          }
          
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        LOG_LEVEL: 'INFO',
        USERS_TABLE_NAME: props?.usersTable?.tableName || '',
      },
    });

    // Create Lambda function for custom message (email customization)
    const customMessageLambda = new lambda.Function(this, 'CustomMessageLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Custom message event:', JSON.stringify(event, null, 2));
          
          const { triggerSource, request, response } = event;
          
          if (triggerSource === 'CustomMessage_AdminCreateUser') {
            // Customize admin-created user message
            response.emailSubject = 'Welcome to DemoProject - Your Account is Ready';
            response.emailMessage = \`
              Welcome to DemoProject!
              
              Your account has been created by an administrator.
              Username: \${request.usernameParameter}
              Temporary Password: \${request.codeParameter}
              
              Please sign in and change your password.
              
              Best regards,
              DemoProject Team
            \`;
          } else if (triggerSource === 'CustomMessage_ResendCode') {
            // Customize resend code message
            response.emailSubject = 'DemoProject - Verification Code Resent';
            response.emailMessage = \`
              Hello,
              
              Your verification code has been resent.
              Code: \${request.codeParameter}
              
              If you didn't request this, please ignore this email.
              
              Best regards,
              DemoProject Team
            \`;
          }
          
          return event;
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create Cognito User Pool with enhanced configuration
    this.userPool = new cognito.UserPool(this, 'DemoProjectUserPool', {
      userPoolName: 'DemoProject-UserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
        studentId: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 50,
        }),
        instructorId: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 50,
        }),
        department: new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 100,
        }),
        bio: new cognito.StringAttribute({
          mutable: true,
          minLen: 0,
          maxLen: 500,
        }),
        avatar: new cognito.StringAttribute({
          mutable: true,
          minLen: 0,
          maxLen: 255,
        }),
        lastLogin: new cognito.StringAttribute({
          mutable: true,
          minLen: 0,
          maxLen: 50,
        }),
        preferences: new cognito.StringAttribute({
          mutable: true,
          minLen: 0,
          maxLen: 1000,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
        emailSubject: 'Verify your ClassCast account',
        emailBody: 'Welcome to ClassCast! Please click the link below to verify your email address: {##Verify Email##}',
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      featurePlan: cognito.FeaturePlan.PLUS,
      lambdaTriggers: {
        preTokenGeneration: preTokenGenerationLambda,
        postConfirmation: postConfirmationLambda,
        preAuthentication: preAuthenticationLambda,
        customMessage: customMessageLambda,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Update Lambda environment variables with user pool ID
    postConfirmationLambda.addEnvironment('USER_POOL_ID', this.userPool.userPoolId);

    // Grant Lambda permissions to access Cognito
    this.userPool.grant(preTokenGenerationLambda, 'cognito-idp:AdminGetUser');
    this.userPool.grant(postConfirmationLambda, 'cognito-idp:AdminGetUser', 'cognito-idp:AdminAddUserToGroup');
    this.userPool.grant(preAuthenticationLambda, 'cognito-idp:AdminGetUser');
    this.userPool.grant(customMessageLambda, 'cognito-idp:AdminGetUser');

    // Grant DynamoDB permissions if table exists
    if (props?.usersTable) {
      props.usersTable.grantReadWriteData(postConfirmationLambda);
      props.usersTable.grantReadWriteData(preAuthenticationLambda);
    }

    // Create User Pool Domain
    const userPoolDomain = new cognito.UserPoolDomain(this, 'DemoProjectUserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `demoproject-${this.account}-${this.region}`,
      },
    });

    // Create User Pool Client with enhanced OAuth configuration
    this.userPoolClient = new cognito.UserPoolClient(this, 'DemoProjectUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'DemoProject-WebClient',
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
        callbackUrls: [
          'http://localhost:3000/auth/callback',
          'https://localhost:3000/auth/callback',
          'https://*.vercel.app/auth/callback',
          'https://*.amazonaws.com/auth/callback',
        ],
        logoutUrls: [
          'http://localhost:3000/auth/logout',
          'https://localhost:3000/auth/logout',
          'https://*.vercel.app/auth/logout',
          'https://*.amazonaws.com/auth/callback',
        ],
      },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Create Identity Pool for AWS resource access
    this.identityPool = new cognito.CfnIdentityPool(this, 'DemoProjectIdentityPool', {
      identityPoolName: 'DemoProject-IdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
          serverSideTokenCheck: false,
        },
      ],
      supportedLoginProviders: {},
    });

    // Create role-based IAM roles
    this.studentRole = new iam.Role(this, 'StudentRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        'StudentPolicy': new iam.PolicyDocument({
          statements: [
            // Limited S3 access for student files
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [
                'arn:aws:s3:::demoproject-storage-*/students/${cognito-identity.amazonaws.com:sub}/*',
                'arn:aws:s3:::demoproject-storage-*/public/*',
              ],
            }),
            // Limited DynamoDB access for student data
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
              ],
              resources: [
                'arn:aws:dynamodb:*:*:table/DemoProject-Users',
                'arn:aws:dynamodb:*:*:table/DemoProject-Assignments',
                'arn:aws:dynamodb:*:*:table/DemoProject-Submissions',
              ],
              conditions: {
                StringEquals: {
                  'aws:PrincipalTag/cognito:userId': '${cognito-identity.amazonaws.com:sub}',
                },
              },
            }),
          ],
        }),
      },
    });

    this.instructorRole = new iam.Role(this, 'InstructorRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        'InstructorPolicy': new iam.PolicyDocument({
          statements: [
            // Enhanced S3 access for instructor files
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                'arn:aws:s3:::demoproject-storage-*/instructors/${cognito-identity.amazonaws.com:sub}/*',
                'arn:aws:s3:::demoproject-storage-*/courses/*',
                'arn:aws:s3:::demoproject-storage-*/public/*',
              ],
            }),
            // Enhanced DynamoDB access for instructor data
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                'arn:aws:dynamodb:*:*:table/DemoProject-Users',
                'arn:aws:dynamodb:*:*:table/DemoProject-Assignments',
                'arn:aws:dynamodb:*:*:table/DemoProject-Submissions',
                'arn:aws:dynamodb:*:*:table/DemoProject-Courses',
              ],
            }),
          ],
        }),
      },
    });

    this.adminRole = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        'AdminPolicy': new iam.PolicyDocument({
          statements: [
            // Full access for admin users
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:*',
                'dynamodb:*',
                'cognito-idp:*',
                'logs:*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create IAM role for authenticated users (default)
    this.authenticatedRole = new iam.Role(this, 'CognitoAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        'DemoProjectAuthenticatedPolicy': new iam.PolicyDocument({
          statements: [
            // Basic S3 access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [
                'arn:aws:s3:::demoproject-storage-*/${cognito-identity.amazonaws.com:sub}/*',
                'arn:aws:s3:::demoproject-storage-*/public/*',
              ],
            }),
            // Basic DynamoDB access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
              ],
              resources: [
                'arn:aws:dynamodb:*:*:table/DemoProject-Users',
                'arn:aws:dynamodb:*:*:table/DemoProject-Assignments',
                'arn:aws:dynamodb:*:*:table/DemoProject-Submissions',
              ],
              conditions: {
                StringEquals: {
                  'aws:PrincipalTag/cognito:userId': '${cognito-identity.amazonaws.com:sub}',
                },
              },
            }),
          ],
        }),
      },
    });

    // Create IAM role for unauthenticated users
    this.unauthenticatedRole = new iam.Role(this, 'CognitoUnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        'DemoProjectUnauthenticatedPolicy': new iam.PolicyDocument({
          statements: [
            // Limited access for unauthenticated users
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
              ],
              resources: [
                'arn:aws:s3:::demoproject-storage-*/public/*',
              ],
            }),
          ],
        }),
      },
    });

    // Attach roles to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unauthenticatedRole.roleArn,
      },
      roleMappings: {
        mapping: {
          type: 'Token',
          ambiguousRoleResolution: 'AuthenticatedRole',
          identityProvider: `cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });

    // Create User Pool Groups with specific roles
    const studentGroup = new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'students',
      description: 'Student users with limited access',
      precedence: 1,
      roleArn: this.studentRole.roleArn,
    });

    const instructorGroup = new cognito.CfnUserPoolGroup(this, 'InstructorGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'instructors',
      description: 'Instructor users with elevated access',
      precedence: 2,
      roleArn: this.instructorRole.roleArn,
    });

    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admins',
      description: 'Administrator users with full access',
      precedence: 3,
      roleArn: this.adminRole.roleArn,
    });

    // Create User Pool Resource Server for API access
    const resourceServer = new cognito.CfnUserPoolResourceServer(this, 'DemoProjectResourceServer', {
      userPoolId: this.userPool.userPoolId,
      identifier: 'DemoProject-API',
      name: 'DemoProject API',
      scopes: [
        {
          scopeName: 'read',
          scopeDescription: 'Read access to user data',
        },
        {
          scopeName: 'write',
          scopeDescription: 'Write access to user data',
        },
        {
          scopeName: 'admin',
          scopeDescription: 'Administrative access',
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'DemoProject-UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'DemoProject-UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: 'DemoProject-IdentityPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
      exportName: 'DemoProject-UserPoolDomain',
    });

    new cdk.CfnOutput(this, 'StudentRoleArn', {
      value: this.studentRole.roleArn,
      description: 'IAM Role for student users',
      exportName: 'DemoProject-StudentRoleArn',
    });

    new cdk.CfnOutput(this, 'InstructorRoleArn', {
      value: this.instructorRole.roleArn,
      description: 'IAM Role for instructor users',
      exportName: 'DemoProject-InstructorRoleArn',
    });

    new cdk.CfnOutput(this, 'AdminRoleArn', {
      value: this.adminRole.roleArn,
      description: 'IAM Role for admin users',
      exportName: 'DemoProject-AdminRoleArn',
    });

    new cdk.CfnOutput(this, 'AuthenticatedRoleArn', {
      value: this.authenticatedRole.roleArn,
      description: 'IAM Role for authenticated users',
      exportName: 'DemoProject-AuthenticatedRoleArn',
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'DemoProject');
    cdk.Tags.of(this).add('Component', 'Authentication');
    cdk.Tags.of(this).add('Environment', 'Development');
  }
}
