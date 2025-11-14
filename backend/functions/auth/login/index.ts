// ============================================================================
// AUTH LOGIN LAMBDA - Handles user authentication
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { UserService } from '../shared/services/UserService';
import { LoginRequest, ApiResponse } from '../shared/types';

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolId = process.env['COGNITO_USER_POOL_ID'] || '';
const clientId = process.env['COGNITO_CLIENT_ID'] || '';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}') as LoginRequest;
    
    // Validate required fields
    if (!body.email || !body.password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Email and password are required'
        } as ApiResponse)
      };
    }

    // Authenticate with Cognito
    const authCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: body.email,
        PASSWORD: body.password
      }
    });

    const authResult = await cognitoClient.send(authCommand);

    if (!authResult.AuthenticationResult) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        } as ApiResponse)
      };
    }

    // Get user details from Cognito
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: body.email
    });

    const userResult = await cognitoClient.send(getUserCommand);

    // Get user profile from DynamoDB
    const userService = new UserService();
    const user = await userService.getUserByEmail(body.email);

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'User profile not found'
        } as ApiResponse)
      };
    }

    // Return success response with tokens and user data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified
          },
          tokens: {
            accessToken: authResult.AuthenticationResult.AccessToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
            idToken: authResult.AuthenticationResult.IdToken
          }
        }
      } as ApiResponse)
    };

  } catch (error) {
    console.error('Login error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse)
    };
  }
};
