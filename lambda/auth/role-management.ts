import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';
import { verifyJwtToken, hasRole, createAuthError } from './jwt-verifier';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

// Environment variables
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Role update request schema
const roleUpdateSchema = z.object({
  targetUserId: z.string()
    .min(1, 'Target user ID is required'),
  
  newRole: z.enum(['student', 'instructor', 'admin'], {
    errorMap: () => ({ message: 'Role must be student, instructor, or admin' })
  }),
  
  // Role-specific fields
  studentId: z.string().optional()
    .refine((val) => !val || /^[A-Z0-9]+$/.test(val), 'Student ID must contain only uppercase letters and numbers'),
  
  instructorId: z.string().optional()
    .refine((val) => !val || /^[A-Z0-9]+$/.test(val), 'Instructor ID must contain only uppercase letters and numbers'),
  
  // Additional role-specific attributes
  title: z.enum(['professor', 'associate_professor', 'assistant_professor', 'lecturer', 'adjunct', 'emeritus']).optional(),
  
  major: z.string().optional()
    .refine((val) => !val || val.length <= 100, 'Major must be less than 100 characters'),
  
  academicLevel: z.enum(['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'phd']).optional(),
  
  qualifications: z.array(z.string()).optional()
    .refine((val) => !val || val.length <= 10, 'Maximum 10 qualifications allowed'),
  
  // Reason for role change
  reason: z.string()
    .min(1, 'Reason for role change is required')
    .max(500, 'Reason must be less than 500 characters'),
  
  // Effective date
  effectiveDate: z.string().optional(),
});

type RoleUpdateRequest = z.infer<typeof roleUpdateSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Verify JWT token and check admin permissions
    const authResult = await verifyJwtToken(event);
    if (!authResult.success) {
      return createAuthError(authResult.error!, authResult.statusCode);
    }

    const user = authResult.user!;

    // Only admins can manage roles
    if (!hasRole(user, 'admin')) {
      return createAuthError('Insufficient permissions. Only administrators can manage user roles.', 403);
    }

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createAuthError('Invalid JSON in request body', 400);
    }

    // Validate request data
    const validationResult = roleUpdateSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createAuthError('Validation failed', 400);
    }

    const updateData = validationResult.data;

    // Validate role-specific requirements
    const roleValidation = validateRoleRequirements(updateData);
    if (!roleValidation.valid) {
      return createAuthError(roleValidation.message!, 400);
    }

    // Check if target user exists
    const targetUser = await getUserDetails(updateData.targetUserId);
    if (!targetUser) {
      return createAuthError('Target user not found', 404);
    }

    // Prevent self-role-change
    if (targetUser.userId === user.sub) {
      return createAuthError('Cannot change your own role', 400);
    }

    // Validate role-specific ID uniqueness
    const idValidation = await validateRoleIdUniqueness(updateData);
    if (!idValidation.valid) {
      return createAuthError(idValidation.message!, 400);
    }

    // Update user role in Cognito
    const cognitoUpdate = await updateCognitoRole(updateData.targetUserId, updateData);
    if (!cognitoUpdate.success) {
      return createAuthError('Failed to update Cognito role', 500);
    }

    // Update user groups
    const groupUpdate = await updateUserGroups(updateData.targetUserId, targetUser.role, updateData.newRole);
    if (!groupUpdate.success) {
      return createAuthError('Failed to update user groups', 500);
    }

    // Update DynamoDB profile
    let profileUpdated = false;
    if (USERS_TABLE) {
      try {
        await updateUserProfile(updateData.targetUserId, updateData, targetUser);
        profileUpdated = true;
      } catch (error) {
        console.error('Failed to update user profile:', error);
        // Continue execution even if profile update fails
      }
    }

    // Log role change
    await logRoleChange(updateData, user, targetUser);

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `User role updated successfully from ${targetUser.role} to ${updateData.newRole}`,
        data: {
          targetUserId: updateData.targetUserId,
          previousRole: targetUser.role,
          newRole: updateData.newRole,
          effectiveDate: updateData.effectiveDate,
          profileUpdated,
          groupsUpdated: groupUpdate.success
        },
        timestamp: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
      }
    };

  } catch (error) {
    console.error('Role management handler error:', error);
    return createAuthError('Internal server error', 500);
  }
};

/**
 * Validate role-specific requirements
 */
function validateRoleRequirements(data: RoleUpdateRequest): { valid: boolean; message?: string } {
  if (data.newRole === 'student' && !data.studentId) {
    return {
      valid: false,
      message: 'Student ID is required when assigning student role'
    };
  }

  if (data.newRole === 'instructor' && !data.instructorId) {
    return {
      valid: false,
      message: 'Instructor ID is required when assigning instructor role'
    };
  }

  if (data.newRole === 'student' && data.title) {
    return {
      valid: false,
      message: 'Title is not applicable for student role'
    };
  }

  if (data.newRole === 'instructor' && data.major) {
    return {
      valid: false,
      message: 'Major is not applicable for instructor role'
    };
  }

  if (data.newRole === 'instructor' && data.academicLevel) {
    return {
      valid: false,
      message: 'Academic level is not applicable for instructor role'
    };
  }

  return { valid: true };
}

/**
 * Validate role ID uniqueness
 */
async function validateRoleIdUniqueness(data: RoleUpdateRequest): Promise<{ valid: boolean; message?: string }> {
  try {
    if (data.newRole === 'student' && data.studentId) {
      const existingStudent = await checkExistingStudentId(data.studentId as string, data.targetUserId as string);
      if (existingStudent) {
        return {
          valid: false,
          message: 'Student ID is already in use by another user'
        };
      }
    }

    if (data.newRole === 'instructor' && data.instructorId) {
      const existingInstructor = await checkExistingInstructorId(data.instructorId as string, data.targetUserId as string);
      if (existingInstructor) {
        return {
          valid: false,
          message: 'Instructor ID is already in use by another user'
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating role ID uniqueness:', error);
    return {
      valid: false,
      message: 'Failed to validate role ID uniqueness'
    };
  }
}

/**
 * Check if student ID already exists (excluding current user)
 */
async function checkExistingStudentId(studentId: string, excludeUserId: string): Promise<boolean> {
  try {
    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:studentId = "${studentId}"`
    }).promise();

    if (result.Users) {
      return result.Users.some(user => user.Username !== excludeUserId);
    }
    return false;
  } catch (error) {
    console.error('Error checking existing student ID:', error);
    return false;
  }
}

/**
 * Check if instructor ID already exists (excluding current user)
 */
async function checkExistingInstructorId(instructorId: string, excludeUserId: string): Promise<boolean> {
  try {
    const result = await cognito.listUsers({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:instructorId = "${instructorId}"`
    }).promise();

    if (result.Users) {
      return result.Users.some(user => user.Username !== excludeUserId);
    }
    return false;
  } catch (error) {
    console.error('Error checking existing instructor ID:', error);
    return false;
  }
}

/**
 * Get user details from Cognito
 */
async function getUserDetails(userId: string): Promise<{ userId: string; role: string; email: string } | null> {
  try {
    const result = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: userId
    }).promise();

    if (!result.UserAttributes) {
      return null;
    }

    const roleAttr = result.UserAttributes?.find((attr: any) => attr.Name === 'custom:role');
    const emailAttr = result.UserAttributes?.find((attr: any) => attr.Name === 'email');

    return {
      userId: result.Username!,
      role: roleAttr?.Value || 'student',
      email: emailAttr?.Value || ''
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
}

/**
 * Update user role in Cognito
 */
async function updateCognitoRole(userId: string, data: RoleUpdateRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const userAttributes: any[] = [
      {
        Name: 'custom:role',
        Value: data.newRole
      }
    ];

    // Add role-specific attributes
    if (data.newRole === 'student') {
      if (data.studentId) {
        userAttributes.push({ Name: 'custom:studentId', Value: data.studentId });
      }
      if (data.major) {
        userAttributes.push({ Name: 'custom:major', Value: data.major });
      }
      if (data.academicLevel) {
        userAttributes.push({ Name: 'custom:academicLevel', Value: data.academicLevel });
      }
      
      // Remove instructor-specific attributes
      userAttributes.push(
        { Name: 'custom:instructorId', Value: '' },
        { Name: 'custom:title', Value: '' },
        { Name: 'custom:qualifications', Value: '' }
      );
    } else if (data.newRole === 'instructor') {
      if (data.instructorId) {
        userAttributes.push({ Name: 'custom:instructorId', Value: data.instructorId });
      }
      if (data.title) {
        userAttributes.push({ Name: 'custom:title', Value: data.title });
      }
      if (data.qualifications) {
        userAttributes.push({ Name: 'custom:qualifications', Value: JSON.stringify(data.qualifications) });
      }
      
      // Remove student-specific attributes
      userAttributes.push(
        { Name: 'custom:studentId', Value: '' },
        { Name: 'custom:major', Value: '' },
        { Name: 'custom:academicLevel', Value: '' }
      );
    }

    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      UserAttributes: userAttributes
    }).promise();

    return { success: true };
  } catch (error) {
    console.error('Error updating Cognito role:', error);
    return {
      success: false,
      error: 'Failed to update Cognito role'
    };
  }
}

/**
 * Update user groups
 */
async function updateUserGroups(userId: string, oldRole: string, newRole: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove from old group
    if (oldRole !== 'admin') {
      const oldGroupName = oldRole === 'student' ? 'students' : 'instructors';
      try {
        await cognito.adminRemoveUserFromGroup({
          GroupName: oldGroupName,
          Username: userId,
          UserPoolId: USER_POOL_ID
        }).promise();
      } catch (error) {
        console.warn(`User ${userId} was not in group ${oldGroupName}`);
      }
    }

    // Add to new group
    if (newRole !== 'admin') {
      const newGroupName = newRole === 'student' ? 'students' : 'instructors';
      await cognito.adminAddUserToGroup({
        GroupName: newGroupName,
        Username: userId,
        UserPoolId: USER_POOL_ID
      }).promise();
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user groups:', error);
    return {
      success: false,
      error: 'Failed to update user groups'
    };
  }
}

/**
 * Update user profile in DynamoDB
 */
async function updateUserProfile(userId: string, data: RoleUpdateRequest, _oldUser: any): Promise<void> {
  try {
    const updateExpression = 'SET #role = :role, #updatedAt = :updatedAt, #roleChangedAt = :roleChangedAt';
    const expressionAttributeNames: any = {
      '#role': 'role',
      '#updatedAt': 'updatedAt',
      '#roleChangedAt': 'roleChangedAt'
    };
    const expressionAttributeValues: any = {
      ':role': data.newRole,
      ':updatedAt': new Date().toISOString(),
      ':roleChangedAt': new Date().toISOString()
    };

    // Add role-specific fields
    let finalExpression = updateExpression;
    
    if (data.newRole === 'student') {
      if (data.studentId) {
        expressionAttributeNames['#studentId'] = 'studentId';
        expressionAttributeValues[':studentId'] = data.studentId;
        finalExpression += ', #studentId = :studentId';
      }
      if (data.major) {
        expressionAttributeNames['#major'] = 'major';
        expressionAttributeValues[':major'] = data.major;
        finalExpression += ', #major = :major';
      }
      if (data.academicLevel) {
        expressionAttributeNames['#academicLevel'] = 'academicLevel';
        expressionAttributeValues[':academicLevel'] = data.academicLevel;
        finalExpression += ', #academicLevel = :academicLevel';
      }
      
      // Remove instructor fields
      finalExpression += ' REMOVE instructorId, title, qualifications, researchAreas, officeLocation, officeHours, maxStudents';
    } else if (data.newRole === 'instructor') {
      if (data.instructorId) {
        expressionAttributeNames['#instructorId'] = 'instructorId';
        expressionAttributeValues[':instructorId'] = data.instructorId;
        finalExpression += ', #instructorId = :instructorId';
      }
      if (data.title) {
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':title'] = data.title;
        finalExpression += ', #title = :title';
      }
      if (data.qualifications) {
        expressionAttributeNames['#qualifications'] = 'qualifications';
        expressionAttributeValues[':qualifications'] = data.qualifications;
        finalExpression += ', #qualifications = :qualifications';
      }
      
      // Remove student fields
      finalExpression += ' REMOVE studentId, enrollmentYear, major, academicLevel, gpa, advisorId';
    }
      
      await dynamodb.update({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: finalExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }).promise();

    console.log(`User profile updated for: ${userId}`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Log role change for audit purposes
 */
async function logRoleChange(data: RoleUpdateRequest, adminUser: any, targetUser: any): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminUserId: adminUser.sub,
      adminEmail: adminUser.email,
      targetUserId: data.targetUserId,
      targetEmail: targetUser.email,
      previousRole: targetUser.role,
      newRole: data.newRole,
      reason: data.reason,
      effectiveDate: data.effectiveDate,
      action: 'role_change'
    };

    // You can store this in DynamoDB, CloudWatch, or another logging service
    console.log('Role change logged:', JSON.stringify(logEntry, null, 2));
  } catch (error) {
    console.error('Error logging role change:', error);
    // Don't fail the main operation if logging fails
  }
}
