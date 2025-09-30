// ============================================================================
// USER PROFILE LAMBDA - Handles user profile operations
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../shared/services/UserService';
import { ApiResponse } from '../shared/types';

const userService = new UserService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const userId = event.pathParameters?.['userId'];

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        } as ApiResponse)
      };
    }

    switch (method) {
      case 'GET':
        return await getProfile(userId);
      case 'PUT':
        return await updateProfile(userId, event.body);
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
          },
          body: JSON.stringify({
            success: false,
            error: 'Method not allowed'
          } as ApiResponse)
        };
    }

  } catch (error) {
    console.error('Profile handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      } as ApiResponse)
    };
  }
};

async function getProfile(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const user = await userService.getUserById(userId);

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'User not found'
        } as ApiResponse)
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: { user }
      } as ApiResponse)
    };

  } catch (error) {
    console.error('Get profile error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get profile'
      } as ApiResponse)
    };
  }
}

async function updateProfile(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Request body is required'
        } as ApiResponse)
      };
    }

    const updates = JSON.parse(body);
    
    // Validate that user is updating their own profile
    // This would typically be done by checking the JWT token
    // For now, we'll skip this validation

    const updatedUser = await userService.updateProfile(userId, updates);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      } as ApiResponse)
    };

  } catch (error) {
    console.error('Update profile error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update profile'
      } as ApiResponse)
    };
  }
}
