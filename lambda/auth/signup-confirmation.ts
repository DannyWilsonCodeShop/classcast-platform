import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

// Environment variables
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Confirmation request validation schema
const confirmationRequestSchema = z.object({
  username: z.string()
    .min(1, 'Username is required'),
  
  confirmationCode: z.string()
    .min(6, 'Confirmation code must be at least 6 characters')
    .max(6, 'Confirmation code must be exactly 6 characters')
    .regex(/^\d{6}$/, 'Confirmation code must contain exactly 6 digits'),
  
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
});

type ConfirmationRequest = z.infer<typeof confirmationRequestSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    // Validate request data
    const validationResult = confirmationRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return createErrorResponse(400, 'Validation failed', {
        errors,
        message: 'Please check your input and try again'
      });
    }

    const confirmationData = validationResult.data;

    // Confirm user signup
    const confirmationResult = await confirmUserSignup(confirmationData);
    if (!confirmationResult.success) {
      return createErrorResponse(400, confirmationResult.error || 'Confirmation failed');
    }

    // Update user profile status
    let profileUpdated = false;
    if (USERS_TABLE) {
      try {
        await updateUserProfileStatus(confirmationData.username);
        profileUpdated = true;
      } catch (error) {
        console.error('Failed to update user profile status:', error);
        // Continue execution even if profile update fails
      }
    }

    // Return success response
    return createSuccessResponse({
      message: 'Account confirmed successfully',
      username: confirmationData.username,
      profileUpdated
    }, 'Your account has been confirmed. You can now sign in with your new password.');

  } catch (error) {
    console.error('Signup confirmation handler error:', error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Confirm user signup with Cognito
 */
async function confirmUserSignup(data: ConfirmationRequest): Promise<{ success: boolean; error?: string }> {
  try {
    // First, confirm the signup
    await cognito.confirmSignUp({
      ClientId: USER_POOL_ID, // Note: This should be the Client ID, not User Pool ID
      Username: data.username,
      ConfirmationCode: data.confirmationCode
    }).promise();

    // Then, set the new password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: data.username,
      Password: data.newPassword,
      Permanent: true
    }).promise();

    // Enable the user account
    await cognito.adminEnableUser({
      UserPoolId: USER_POOL_ID,
      Username: data.username
    }).promise();

    // Update user attributes to mark email as verified
    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: data.username,
      UserAttributes: [
        {
          Name: 'email_verified',
          Value: 'true'
        },
        {
          Name: 'custom:lastLogin',
          Value: new Date().toISOString()
        }
      ]
    }).promise();

    return { success: true };

  } catch (error) {
    console.error('Error confirming user signup:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('CodeMismatchException')) {
        return {
          success: false,
          error: 'Invalid confirmation code. Please check your email and try again.'
        };
      }
      if (error.message.includes('ExpiredCodeException')) {
        return {
          success: false,
          error: 'Confirmation code has expired. Please request a new one.'
        };
      }
      if (error.message.includes('NotAuthorizedException')) {
        return {
          success: false,
          error: 'User is not authorized to perform this action.'
        };
      }
      if (error.message.includes('UserNotFoundException')) {
        return {
          success: false,
          error: 'User not found. Please check your username and try again.'
        };
      }
      if (error.message.includes('InvalidPasswordException')) {
        return {
          success: false,
          error: 'Password does not meet requirements. Please choose a stronger password.'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to confirm account. Please try again.'
    };
  }
}

/**
 * Update user profile status in DynamoDB
 */
async function updateUserProfileStatus(username: string): Promise<void> {
  try {
    // First, get the current user profile
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId: username }
    }).promise();

    if (result.Item) {
      // Update the profile status
      await dynamodb.update({
        TableName: USERS_TABLE,
        Key: { userId: username },
        UpdateExpression: 'SET #status = :status, #enabled = :enabled, #updatedAt = :updatedAt, #lastLogin = :lastLogin',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#enabled': 'enabled',
          '#updatedAt': 'updatedAt',
          '#lastLogin': 'lastLogin'
        },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':enabled': true,
          ':updatedAt': new Date().toISOString(),
          ':lastLogin': new Date().toISOString()
        }
      }).promise();

      console.log(`User profile status updated for: ${username}`);
    } else {
      console.warn(`No user profile found for: ${username}`);
    }

  } catch (error) {
    console.error('Error updating user profile status:', error);
    throw error;
  }
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, message?: string) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, details?: any) {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}
