import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

// Environment variables
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Base user schema
const baseUserSchema = z.object({
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
  
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must be less than 100 characters'),
  
  bio: z.string().optional()
    .refine((val) => !val || val.length <= 500, 'Bio must be less than 500 characters'),
  
  phoneNumber: z.string().optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), 'Phone number must be in international format (e.g., +1234567890)'),
  
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

// Student-specific schema
const studentSchema = baseUserSchema.extend({
  role: z.literal('student'),
  studentId: z.string()
    .min(1, 'Student ID is required')
    .max(20, 'Student ID must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Student ID must contain only uppercase letters and numbers'),
  
  // Student-specific fields
  enrollmentYear: z.number()
    .int('Enrollment year must be a whole number')
    .min(2000, 'Enrollment year must be 2000 or later')
    .max(new Date().getFullYear() + 1, 'Enrollment year cannot be in the future'),
  
  major: z.string()
    .min(1, 'Major is required')
    .max(100, 'Major must be less than 100 characters'),
  
  academicLevel: z.enum(['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'phd']),
  
  gpa: z.number()
    .min(0.0, 'GPA must be 0.0 or higher')
    .max(4.0, 'GPA cannot exceed 4.0')
    .optional(),
  
  advisorId: z.string().optional()
    .refine((val) => !val || /^[A-Z0-9]+$/.test(val), 'Advisor ID must contain only uppercase letters and numbers'),
  
  // Student preferences
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false),
      assignmentReminders: z.boolean().default(true),
      gradeNotifications: z.boolean().default(true),
      courseUpdates: z.boolean().default(true)
    }).optional(),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
    academic: z.object({
      showGPA: z.boolean().default(true),
      showProgress: z.boolean().default(true),
      enableTutoring: z.boolean().default(false)
    }).optional()
  }).optional()
});

// Instructor-specific schema
const instructorSchema = baseUserSchema.extend({
  role: z.literal('instructor'),
  instructorId: z.string()
    .min(1, 'Instructor ID is required')
    .max(20, 'Instructor ID must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Instructor ID must contain only uppercase letters and numbers'),
  
  // Instructor-specific fields
  title: z.enum(['professor', 'associate_professor', 'assistant_professor', 'lecturer', 'adjunct', 'emeritus']),
  
  hireDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format'),
  
  qualifications: z.array(z.string())
    .min(1, 'At least one qualification is required')
    .max(10, 'Maximum 10 qualifications allowed'),
  
  researchAreas: z.array(z.string())
    .max(10, 'Maximum 10 research areas allowed')
    .optional(),
  
  officeLocation: z.string()
    .max(100, 'Office location must be less than 100 characters')
    .optional(),
  
  officeHours: z.array(z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format')
  })).optional(),
  
  maxStudents: z.number()
    .int('Max students must be a whole number')
    .min(1, 'Max students must be at least 1')
    .max(500, 'Max students cannot exceed 500')
    .optional(),
  
  // Instructor preferences
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false),
      studentSubmissions: z.boolean().default(true),
      gradeReminders: z.boolean().default(true),
      courseEnrollments: z.boolean().default(true)
    }).optional(),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
    teaching: z.object({
      autoGrade: z.boolean().default(false),
      plagiarismDetection: z.boolean().default(true),
      studentFeedback: z.boolean().default(true)
    }).optional()
  }).optional()
});

// Union type for role-based signup
const roleBasedSignupSchema = z.discriminatedUnion('role', [studentSchema, instructorSchema]);

type RoleBasedSignupRequest = z.infer<typeof roleBasedSignupSchema>;

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
    const validationResult = roleBasedSignupSchema.safeParse(requestBody);
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

    // Check if user already exists
    const existingUser = await checkExistingUser(signupData.email as string, signupData.username as string);
    if (existingUser.exists) {
      return createErrorResponse(409, existingUser.message || 'User already exists');
    }

    // Validate role-specific business rules
    const businessValidation = await validateBusinessRules(signupData);
    if (!businessValidation.valid) {
      return createErrorResponse(400, businessValidation.message || 'Business validation failed');
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

    // Assign user to appropriate group
    let groupAssigned = false;
    try {
      await assignUserToGroup(cognitoUser.userId!, signupData.role as string);
      groupAssigned = true;
    } catch (error) {
      console.error('Failed to assign user to group:', error);
      // Continue execution even if group assignment fails
      // The post-confirmation Lambda will handle group assignment
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
      message: `${(signupData.role as string).charAt(0).toUpperCase() + (signupData.role as string).slice(1)} created successfully`,
      userId: cognitoUser.userId,
      email: signupData.email,
      role: signupData.role,
      requiresConfirmation: true,
      profileCreated,
      groupAssigned
    }, `Your ${signupData.role} account has been created. Please check your email to confirm your account.`);

  } catch (error) {
    console.error('Role-based signup handler error:', error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Validate business rules for role-based signup
 */
async function validateBusinessRules(data: RoleBasedSignupRequest): Promise<{ valid: boolean; message?: string }> {
  try {
    if (data.role === 'student') {
      // Validate student-specific business rules
      const studentData = data as z.infer<typeof studentSchema>;
      
      // Check if student ID is unique
      const existingStudent = await checkExistingStudentId(studentData.studentId as string);
      if (existingStudent) {
        return {
          valid: false,
          message: 'Student ID is already in use'
        };
      }

      // Validate enrollment year
      const currentYear = new Date().getFullYear();
      if ((studentData.enrollmentYear as number) > currentYear + 1) {
        return {
          valid: false,
          message: 'Enrollment year cannot be more than one year in the future'
        };
      }

      // Validate advisor if provided
      if (studentData.advisorId) {
        const advisorExists = await checkInstructorExists(studentData.advisorId as string);
        if (!advisorExists) {
          return {
            valid: false,
            message: 'Specified advisor does not exist'
          };
        }
      }

    } else if (data.role === 'instructor') {
      // Validate instructor-specific business rules
      const instructorData = data as z.infer<typeof instructorSchema>;
      
      // Check if instructor ID is unique
      const existingInstructor = await checkExistingInstructorId(instructorData.instructorId as string);
      if (existingInstructor) {
        return {
          valid: false,
          message: 'Instructor ID is already in use'
        };
      }

      // Validate hire date
      const hireDate = new Date(instructorData.hireDate as string);
      const currentDate = new Date();
      if (hireDate > currentDate) {
        return {
          valid: false,
          message: 'Hire date cannot be in the future'
        };
      }

      // Validate qualifications
      if ((instructorData.qualifications as string[]).length === 0) {
        return {
          valid: false,
          message: 'At least one qualification is required'
        };
      }

      // Validate office hours if provided
      if (instructorData.officeHours) {
        for (const hours of instructorData.officeHours as any) {
          const startTime = new Date(`2000-01-01T${hours.startTime}:00`);
          const endTime = new Date(`2000-01-01T${hours.endTime}:00`);
          
          if (startTime >= endTime) {
            return {
              valid: false,
              message: 'Office hours end time must be after start time'
            };
          }
        }
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating business rules:', error);
    return {
      valid: false,
      message: 'Failed to validate business rules'
    };
  }
}

/**
 * Check if student ID already exists
 */
async function checkExistingStudentId(studentId: string): Promise<boolean> {
  try {
    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:studentId = "${studentId}"`
    }).promise();

    return !!(result.Users && result.Users.length > 0);
  } catch (error) {
    console.error('Error checking existing student ID:', error);
    return false;
  }
}

/**
 * Check if instructor ID already exists
 */
async function checkExistingInstructorId(instructorId: string): Promise<boolean> {
  try {
    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:instructorId = "${instructorId}"`
    }).promise();

    return !!(result.Users && result.Users.length > 0);
  } catch (error) {
    console.error('Error checking existing instructor ID:', error);
    return false;
  }
}

/**
 * Check if instructor exists (for advisor validation)
 */
async function checkInstructorExists(instructorId: string): Promise<boolean> {
  try {
    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:instructorId = "${instructorId}" AND custom:role = "instructor"`
    }).promise();

    return !!(result.Users && result.Users.length > 0);
  } catch (error) {
    console.error('Error checking instructor existence:', error);
    return false;
  }
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
    return { exists: false };
  }
}

/**
 * Create user in Cognito User Pool
 */
async function createCognitoUser(data: RoleBasedSignupRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Prepare base user attributes
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

    // Add role-specific attributes
    if (data.role === 'student') {
      const studentData = data as z.infer<typeof studentSchema>;
      userAttributes.push(
        { Name: 'custom:studentId', Value: studentData.studentId },
        { Name: 'custom:enrollmentYear', Value: (studentData.enrollmentYear as number).toString() },
        { Name: 'custom:major', Value: studentData.major },
        { Name: 'custom:academicLevel', Value: studentData.academicLevel }
      );

      if (studentData.gpa !== undefined) {
        userAttributes.push({ Name: 'custom:gpa', Value: (studentData.gpa as number).toString() });
      }
      if (studentData.advisorId) {
        userAttributes.push({ Name: 'custom:advisorId', Value: studentData.advisorId });
      }
    } else if (data.role === 'instructor') {
      const instructorData = data as z.infer<typeof instructorSchema>;
      userAttributes.push(
        { Name: 'custom:instructorId', Value: instructorData.instructorId },
        { Name: 'custom:title', Value: instructorData.title },
        { Name: 'custom:hireDate', Value: instructorData.hireDate },
        { Name: 'custom:qualifications', Value: JSON.stringify(instructorData.qualifications) }
      );

      if (instructorData.researchAreas) {
        userAttributes.push({ Name: 'custom:researchAreas', Value: JSON.stringify(instructorData.researchAreas) });
      }
      if (instructorData.officeLocation) {
        userAttributes.push({ Name: 'custom:officeLocation', Value: instructorData.officeLocation });
      }
      if (instructorData.officeHours) {
        userAttributes.push({ Name: 'custom:officeHours', Value: JSON.stringify(instructorData.officeHours) });
      }
      if (instructorData.maxStudents) {
        userAttributes.push({ Name: 'custom:maxStudents', Value: instructorData.maxStudents.toString() });
      }
    }

    // Add common optional attributes
    if (data.bio) {
      userAttributes.push({ Name: 'custom:bio', Value: data.bio });
    }
    if (data.phoneNumber) {
      userAttributes.push({ Name: 'phone_number', Value: data.phoneNumber });
    }

    // Add preferences
    const preferences = {
      notifications: {
        email: (data.preferences as any)?.notifications?.email ?? true,
        push: (data.preferences as any)?.notifications?.push ?? false,
        sms: (data.preferences as any)?.notifications?.sms ?? false,
        ...(data.role === 'student' && {
          assignmentReminders: (data.preferences as any)?.notifications?.assignmentReminders ?? true,
          gradeNotifications: (data.preferences as any)?.notifications?.gradeNotifications ?? true,
          courseUpdates: (data.preferences as any)?.notifications?.courseUpdates ?? true
        }),
        ...(data.role === 'instructor' && {
          studentSubmissions: (data.preferences as any)?.notifications?.studentSubmissions ?? true,
          gradeReminders: (data.preferences as any)?.notifications?.gradeReminders ?? true,
          courseEnrollments: (data.preferences as any)?.notifications?.courseEnrollments ?? true
        })
      },
      theme: (data.preferences as any)?.theme ?? 'light',
      language: (data.preferences as any)?.language ?? 'en',
      ...(data.role === 'student' && {
        academic: {
          showGPA: (data.preferences as any)?.academic?.showGPA ?? true,
          showProgress: (data.preferences as any)?.academic?.showProgress ?? true,
          enableTutoring: (data.preferences as any)?.academic?.enableTutoring ?? false
        }
      }),
      ...(data.role === 'instructor' && {
        teaching: {
          autoGrade: (data.preferences as any)?.teaching?.autoGrade ?? false,
          plagiarismDetection: (data.preferences as any)?.teaching?.plagiarismDetection ?? true,
          studentFeedback: (data.preferences as any)?.teaching?.studentFeedback ?? true
        }
      })
    };

    userAttributes.push({
      Name: 'custom:preferences',
      Value: JSON.stringify(preferences)
    });

    // Create user
    const result = await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: data.username as string,
      UserAttributes: userAttributes,
      MessageAction: 'SUPPRESS',
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
async function createUserProfile(data: RoleBasedSignupRequest, userId: string): Promise<void> {
  const baseProfile = {
    userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    department: data.department,
    bio: data.bio,
    phoneNumber: data.phoneNumber,
    status: 'pending',
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: data.preferences || {
      notifications: { email: true, push: false, sms: false },
      theme: 'light',
      language: 'en'
    }
  };

  let userProfile: any;

  if (data.role === 'student') {
    const studentData = data as z.infer<typeof studentSchema>;
    userProfile = {
      ...baseProfile,
      studentId: studentData.studentId,
      enrollmentYear: studentData.enrollmentYear,
      major: studentData.major,
      academicLevel: studentData.academicLevel,
      gpa: studentData.gpa,
      advisorId: studentData.advisorId,
      type: 'student'
    };
  } else if (data.role === 'instructor') {
    const instructorData = data as z.infer<typeof instructorSchema>;
    userProfile = {
      ...baseProfile,
      instructorId: instructorData.instructorId,
      title: instructorData.title,
      hireDate: instructorData.hireDate,
      qualifications: instructorData.qualifications,
      researchAreas: instructorData.researchAreas,
      officeLocation: instructorData.officeLocation,
      officeHours: instructorData.officeHours,
      maxStudents: instructorData.maxStudents,
      type: 'instructor'
    };
  }

  await dynamodb.put({
    TableName: USERS_TABLE,
    Item: userProfile
  }).promise();
}

/**
 * Assign user to appropriate group
 */
async function assignUserToGroup(userId: string, role: string): Promise<void> {
  try {
    const groupName = role === 'student' ? 'students' : 'instructors';
    
    await cognito.adminAddUserToGroup({
      GroupName: groupName,
      Username: userId,
      UserPoolId: USER_POOL_ID
    }).promise();

    console.log(`User ${userId} assigned to group: ${groupName}`);
  } catch (error) {
    console.error('Error assigning user to group:', error);
    throw error;
  }
}

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(userId: string): Promise<void> {
  try {
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      Password: 'TemporaryPassword123!',
      Permanent: false
    }).promise();

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
