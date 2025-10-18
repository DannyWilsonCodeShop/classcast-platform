import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

// Environment variables
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Signup request validation schema
const signupRequestSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens'),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  role: z.enum(['student', 'instructor', 'admin'], {
    errorMap: () => ({ message: 'Role must be student, instructor, or admin' })
  }),
  
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must be less than 100 characters'),
  
  studentId: z.string().optional()
    .refine((val) => {
      if (val) {
        return /^[A-Z0-9]{1,20}$/.test(val);
      }
      return true;
    }, 'Student ID must contain only uppercase letters and numbers (1-20 characters)'),
  
  instructorId: z.string().optional()
    .refine((val) => {
      if (val) {
        return /^[A-Z0-9]{1,20}$/.test(val);
      }
      return true;
    }, 'Instructor ID must contain only uppercase letters and numbers (1-20 characters)'),
  
  bio: z.string().optional()
    .refine((val) => !val || val.length <= 500, 'Bio must be less than 500 characters'),
  
  phoneNumber: z.string().optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), 'Phone number must be in international format (e.g., +1234567890)'),
  
  // Optional preferences
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false)
    }).optional(),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    language: z.enum(['en', 'es', 'fr', 'de']).default('en')
  }).optional()
});

type SignupRequest = z.infer<typeof signupRequestSchema>;

// Response interfaces

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
    const validationResult = signupRequestSchema.safeParse(requestBody);
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

    const signupData = validationResult.data;

    // Validate role-specific requirements
    const roleValidation = validateRoleRequirements(signupData);
    if (!roleValidation.valid) {
      return createErrorResponse(400, roleValidation.message || 'Role validation failed');
    }

    // Check if user already exists
    const existingUser = await checkExistingUser(signupData.email as string, signupData.username as string);
    if (existingUser.exists) {
      return createErrorResponse(409, existingUser.message || 'User already exists');
    }

    // Create user in Cognito
    const cognitoUser = await createCognitoUser(signupData);
    if (!cognitoUser.success) {
      return createErrorResponse(500, 'Failed to create user in Cognito', {
        error: cognitoUser.error
      });
    }

    // Create user profile in DynamoDB
    let profileCreated = false;
    if (USERS_TABLE) {
      try {
        await createUserProfile(signupData, cognitoUser.userId!);
        profileCreated = true;
      } catch (error) {
        console.error('Failed to create user profile:', error);
        // Continue execution even if profile creation fails
        // The post-confirmation Lambda will handle profile creation
      }
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(cognitoUser.userId!);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Continue execution even if email fails
    }

    // Return success response
    return createSuccessResponse({
      message: 'User created successfully',
      userId: cognitoUser.userId,
      email: signupData.email,
      requiresConfirmation: true,
      profileCreated
    }, 'Please check your email to confirm your account');

  } catch (error) {
    console.error('Signup handler error:', error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Validate role-specific requirements
 */
function validateRoleRequirements(data: SignupRequest): { valid: boolean; message?: string } {
  if (data.role === 'student' && !data.studentId) {
    return {
      valid: false,
      message: 'Student ID is required for student accounts'
    };
  }

  if (data.role === 'instructor' && !data.instructorId) {
    return {
      valid: false,
      message: 'Instructor ID is required for instructor accounts'
    };
  }

  if (data.role === 'admin') {
    // Additional validation for admin accounts if needed
    if (!data.department || (data.department as any).toLowerCase() === 'general') {
      return {
        valid: false,
        message: 'Admin accounts must specify a valid department'
      };
    }
  }

  return { valid: true };
}

/**
 * Check if user already exists
 */
async function checkExistingUser(email: string, username: string): Promise<{ exists: boolean; message?: string }> {
  try {
    // Check by email
    const emailCheck = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`
    }).promise();

    if (emailCheck.Users && emailCheck.Users.length > 0) {
      return {
        exists: true,
        message: 'An account with this email already exists'
      };
    }

    // Check by username
    const usernameCheck = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `username = "${username}"`
    }).promise();

    if (usernameCheck.Users && usernameCheck.Users.length > 0) {
      return {
        exists: true,
        message: 'This username is already taken'
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking existing user:', error);
    // Assume user doesn't exist if check fails
    return { exists: false };
  }
}

/**
 * Create user in Cognito User Pool
 */
async function createCognitoUser(data: SignupRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Prepare user attributes
    const userAttributes: any[] = [
      {
        Name: 'email',
        Value: data.email
      },
      {
        Name: 'given_name',
        Value: data.firstName
      },
      {
        Name: 'family_name',
        Value: data.lastName
      },
      {
        Name: 'custom:role',
        Value: data.role
      },
      {
        Name: 'custom:department',
        Value: data.department
      }
    ];

    // Add optional attributes
    if (data.studentId) {
      userAttributes.push({
        Name: 'custom:studentId',
        Value: data.studentId
      });
    }

    if (data.instructorId) {
      userAttributes.push({
        Name: 'custom:instructorId',
        Value: data.instructorId
      });
    }

    if (data.bio) {
      userAttributes.push({
        Name: 'custom:bio',
        Value: data.bio
      });
    }

    if (data.phoneNumber) {
      userAttributes.push({
        Name: 'phone_number',
        Value: data.phoneNumber
      });
    }

    // Add preferences
    const preferences = {
      notifications: {
        email: (data.preferences as any)?.notifications?.email ?? true,
        push: (data.preferences as any)?.notifications?.push ?? false,
        sms: (data.preferences as any)?.notifications?.sms ?? false
      },
      theme: (data.preferences as any)?.theme ?? 'light',
      language: (data.preferences as any)?.language ?? 'en'
    };

    userAttributes.push({
      Name: 'custom:preferences',
      Value: JSON.stringify(preferences)
    });

    // Create user
    const result = await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: data.username,
      UserAttributes: userAttributes,
      MessageAction: 'SUPPRESS', // We'll send custom message
      DesiredDeliveryMediums: ['EMAIL']
    }).promise();

    if (result.User) {
      return { 
        success: true, 
        ...(result.User.Username && { userId: result.User.Username })
      };
    } else {
      return {
        success: false,
        error: 'User creation failed'
      };
    }

  } catch (error) {
    console.error('Error creating Cognito user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('UsernameExistsException')) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }
      if (error.message.includes('InvalidPasswordException')) {
        return {
          success: false,
          error: 'Password does not meet requirements'
        };
      }
      if (error.message.includes('InvalidParameterException')) {
        return {
          success: false,
          error: 'Invalid user attributes'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to create user'
    };
  }
}

/**
 * Create user profile in DynamoDB
 */
async function createUserProfile(data: SignupRequest, userId: string): Promise<void> {
  const userProfile = {
    userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    department: data.department,
    studentId: data.studentId,
    instructorId: data.instructorId,
    bio: data.bio,
    phoneNumber: data.phoneNumber,
    schoolLogo: '/logos/cristo-rey-atlanta.png', // Default Cristo Rey logo
    status: 'pending', // Will be updated to 'active' after confirmation
    enabled: false, // Will be enabled after confirmation
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: data.preferences || {
      notifications: { email: true, push: false, sms: false },
      theme: 'light',
      language: 'en'
    }
  };

  await dynamodb.put({
    TableName: USERS_TABLE,
    Item: userProfile
  }).promise();
}

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(userId: string): Promise<void> {
  try {
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      Password: 'TemporaryPassword123!', // This will be changed on first login
      Permanent: false
    }).promise();

    // Trigger custom message Lambda for confirmation email
    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      UserAttributes: [
        {
          Name: 'email_verified',
          Value: 'false'
        }
      ]
    }).promise();

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, message?: string) {
  return {
    statusCode: 201,
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
