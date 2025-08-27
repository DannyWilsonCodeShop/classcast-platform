import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  try {
    const { userName } = event;
    const { userAttributes } = event.request;
    
    // Get user profile from DynamoDB
    let userProfile: any = null;
    if (USERS_TABLE) {
      try {
        const result = await dynamodb.get({
          TableName: USERS_TABLE,
          Key: { userId: userName }
        }).promise();
        
        userProfile = result.Item;
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    
    // Prepare custom claims
    const customClaims: Record<string, any> = {
      firstName: userAttributes['given_name'] || userProfile?.['firstName'] || '',
      lastName: userAttributes['family_name'] || userProfile?.['lastName'] || '',
      email: userAttributes['email'] || '',
      department: userAttributes['custom:department'] || userProfile?.['department'] || '',
      studentId: userAttributes['custom:studentId'] || userProfile?.['studentId'] || '',
      instructorId: userAttributes['custom:instructorId'] || userProfile?.['instructorId'] || '',
      preferences: userAttributes['custom:preferences'] || userProfile?.['preferences'] || {}
    };
    
    // Add role-based claims
    const role = userAttributes['custom:role'] || 'student';
    if (role === 'student') {
      customClaims['role'] = 'student';
      customClaims['isStudent'] = true;
      customClaims['isInstructor'] = false;
      customClaims['isAdmin'] = false;
    } else if (role === 'instructor') {
      customClaims['role'] = 'instructor';
      customClaims['isStudent'] = false;
      customClaims['isInstructor'] = true;
      customClaims['isAdmin'] = false;
    } else if (role === 'admin') {
      customClaims['role'] = 'admin';
      customClaims['isStudent'] = false;
      customClaims['isInstructor'] = false;
      customClaims['isAdmin'] = true;
    }
    
    // Add groups based on role
    if (role === 'student') {
      customClaims['groups'] = ['students'];
    } else if (role === 'instructor') {
      customClaims['groups'] = ['instructors'];
    } else if (role === 'admin') {
      customClaims['groups'] = ['admins'];
    } else {
      customClaims['groups'] = [];
    }
    
    // Update the event with custom claims
    event.response = {
      ...event.response,
      claimsOverrideDetails: {
        ...event.response.claimsOverrideDetails,
        claimsToAddOrOverride: {
          firstName: userAttributes['given_name'] || '',
          lastName: userAttributes['family_name'] || '',
          email: userAttributes['email'] || '',
          role: userAttributes['custom:role'] || 'student',
          groups: customClaims['groups'],
          isStudent: customClaims['isStudent'],
          isInstructor: customClaims['isInstructor'],
          isAdmin: customClaims['isAdmin']
        }
      }
    };
    
    console.log(`Pre-token generation completed for user: ${userName}`);
    return event;
    
  } catch (error) {
    console.error('Error in pre-token generation:', error);
    // Return event to allow token generation to continue
    return event;
  }
};
