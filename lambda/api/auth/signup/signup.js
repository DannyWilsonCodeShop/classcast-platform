const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// AWS clients with proper IAM role credentials
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_uK50qBrap';

exports.handler = async (event) => {
  console.log('Signup Lambda called with event:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { email, firstName, lastName, password, role, studentId, department } = body;

    console.log('Signup request body:', { email, firstName, lastName, role, studentId, department });

    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Missing required fields' }
        })
      };
    }

    if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Invalid role specified' }
        })
      };
    }

    if (role === 'instructor' && !department) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Department is required for instructor role' }
        })
      };
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Password must be at least 8 characters long' }
        })
      };
    }

    try {
      console.log('Creating user with AWS Cognito (auto-confirmed):', { email, firstName, lastName, role, studentId, department });

      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:role', Value: role },
        { Name: 'email_verified', Value: 'true' }, // Auto-verify email
      ];

      if (role === 'instructor') {
        userAttributes.push({ Name: 'custom:instructorId', Value: `INS-${Date.now()}` });
        userAttributes.push({ Name: 'custom:department', Value: department });
      }

      // Create user with admin command (auto-confirmed)
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: password,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      const createResponse = await cognitoClient.send(createCommand);
      console.log('User created with AdminCreateUser:', createResponse.User?.Username);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);
      console.log('Permanent password set for user:', email);

      // Create user profile in DynamoDB
      try {
        const userProfile = {
          userId: email, // Use email as userId
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          studentId: studentId,
          instructorId: role === 'instructor' ? `INS-${Date.now()}` : undefined,
          department: role === 'instructor' ? department : undefined,
          status: 'active',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            notifications: {
              email: true,
              push: false
            },
            theme: 'light',
            language: 'en'
          }
        };

        await dynamoClient.send(new PutItemCommand({
          TableName: 'classcast-users',
          Item: marshall(userProfile)
        }));
        console.log('User profile created in DynamoDB');
      } catch (dbError) {
        console.error('Failed to create user profile in DynamoDB:', dbError);
        // Continue execution even if profile creation fails
      }

      // Return success response
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          message: 'Account created successfully! You can now log in immediately.',
          user: {
            id: email,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role,
            instructorId: role === 'instructor' ? `INS-${Date.now()}` : undefined,
            department: role === 'instructor' ? department : undefined,
            emailVerified: true, // Always true since we auto-confirm
          },
          nextStep: 'login',
          needsVerification: false,
          requiresEmailConfirmation: false,
        })
      };
    } catch (authError) {
      console.error('Cognito signup error:', authError);
      
      if (authError.name === 'UsernameExistsException') {
        return {
          statusCode: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({
            error: { message: 'A user with this email already exists' }
          })
        };
      }
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: authError.message || 'Failed to create account. Please try again later' }
        })
      };
    }
  } catch (error) {
    console.error('Signup request error:', error);
    
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Invalid request format' }
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: { message: 'Internal server error. Please try again later' }
      })
    };
  }
};
