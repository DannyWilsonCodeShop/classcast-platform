import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env['USERS_TABLE_NAME'] || 'classcast-users';
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    const { userName } = event;
    const { userAttributes } = event.request;
    
    // Extract user information
    const email = userAttributes['email'];
    const firstName = userAttributes['given_name'];
    const lastName = userAttributes['family_name'];
    const role = userAttributes['custom:role'] || 'student';
    const department = userAttributes['custom:department'] || '';
    const studentId = userAttributes['custom:studentId'] || '';
    const instructorId = userAttributes['custom:instructorId'] || '';
    const bio = userAttributes['custom:bio'] || '';
    const avatar = userAttributes['custom:avatar'] || '';
    
    // Add user to appropriate group based on role
    try {
      const groupName = role === 'instructor' ? 'instructors' : 'students';
      await cognito.adminAddUserToGroup({
        GroupName: groupName,
        Username: userName,
        UserPoolId: USER_POOL_ID
      }).promise();
      
      console.log(`User ${userName} added to group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to add user to group: ${error}`);
      // Continue execution even if group assignment fails
    }
    
    // Create user profile in DynamoDB if table exists
    if (USERS_TABLE) {
      try {
        const userProfile = {
          userId: userName,
          email,
          firstName,
          lastName,
          role,
          department,
          studentId: role === 'student' ? studentId : undefined,
          instructorId: role === 'instructor' ? instructorId : undefined,
          bio,
          avatar,
          schoolLogo: '/logos/cristo-rey-atlanta.png', // Default Cristo Rey logo
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
        
        await dynamodb.put({
          TableName: USERS_TABLE,
          Item: userProfile
        }).promise();
        
        console.log(`User profile created for: ${userName}`);
      } catch (error) {
        console.error(`Failed to create user profile: ${error}`);
        // Continue execution even if profile creation fails
      }
    }
    
    // Update Cognito attributes with additional information
    try {
      await cognito.adminUpdateUserAttributes({
        UserPoolId: USER_POOL_ID,
        Username: userName,
        UserAttributes: [
          {
            Name: 'custom:lastLogin',
            Value: new Date().toISOString()
          },
          {
            Name: 'custom:preferences',
            Value: JSON.stringify({
              notifications: { email: true, push: false },
              theme: 'light',
              language: 'en'
            })
          }
        ]
      }).promise();
    } catch (error) {
      console.error(`Failed to update Cognito attributes: ${error}`);
    }
    
    console.log(`Post-confirmation completed for user: ${userName}`);
    return event;
    
  } catch (error) {
    console.error('Error in post-confirmation:', error);
    // Return event to allow authentication to continue
    return event;
  }
};
