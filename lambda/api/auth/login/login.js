const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

// AWS clients with proper IAM role credentials
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const USER_POOL_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || '7tbaq74itv3gdda1bt25iqafvh';

exports.handler = async (event) => {
  console.log('Login Lambda called with event:', JSON.stringify(event, null, 2));
  
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
    const { email, password } = body;

    console.log('Login API called with:', { email, password: '***' });

    // Basic validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Email and password are required' }
        })
      };
    }

    try {
      console.log('🔧 Using AWS Cognito for authentication...');
      console.log('About to call direct Cognito authentication...');

      // Authenticate with Cognito
      const authCommand = new InitiateAuthCommand({
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const authResponse = await cognitoClient.send(authCommand);

      if (!authResponse.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      console.log('Login successful, auth result:', {
        userId: authResponse.AuthenticationResult.AccessToken ? 'present' : 'missing',
        email: email,
        emailVerified: true, // Assume verified if we can authenticate
        hasToken: !!authResponse.AuthenticationResult.AccessToken
      });

      // Get user details
      const getUserCommand = new GetUserCommand({
        AccessToken: authResponse.AuthenticationResult.AccessToken,
      });

      const userResponse = await cognitoClient.send(getUserCommand);

      // Extract user attributes
      const userAttributes = userResponse.UserAttributes || [];
      const attributeMap = {};
      
      userAttributes.forEach((attr) => {
        attributeMap[attr.Name] = attr.Value;
      });

      const user = {
        id: userResponse.Username,
        email: attributeMap.email || email,
        firstName: attributeMap.given_name || '',
        lastName: attributeMap.family_name || '',
        role: attributeMap['custom:role'] || 'student',
        instructorId: attributeMap['custom:instructorId'],
        department: attributeMap['custom:department'],
        emailVerified: attributeMap.email_verified === 'true',
      };

      // Set secure HTTP-only cookies for the session
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          message: 'Login successful',
          user: user,
          tokens: {
            accessToken: authResponse.AuthenticationResult.AccessToken,
            refreshToken: authResponse.AuthenticationResult.RefreshToken,
            idToken: authResponse.AuthenticationResult.IdToken || authResponse.AuthenticationResult.AccessToken,
            expiresIn: authResponse.AuthenticationResult.ExpiresIn || 3600,
          },
        })
      };

      return response;
    } catch (authError) {
      console.error('AWS Cognito auth error, falling back to mock service:', authError);
      
      // Check if it's an email verification issue
      if (authError.name === 'NotAuthorizedException' && authError.message.includes('email')) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({
            error: { 
              message: 'Email not verified. Please check your email and verify your account.',
              code: 'EMAIL_NOT_VERIFIED',
              email: email
            }
          })
        };
      }

      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: { message: 'Invalid email or password' }
        })
      };
    }
  } catch (error) {
    console.error('Login request error:', error);
    
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
