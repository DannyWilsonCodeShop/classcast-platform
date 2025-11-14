import { PreAuthenticationTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  try {
    const { userName } = event;
    
    // Check if user profile exists in DynamoDB
    if (USERS_TABLE) {
      try {
        const result = await dynamodb.get({
          TableName: USERS_TABLE,
          Key: { userId: userName }
        }).promise();
        
        const userProfile = result.Item;
        
        if (userProfile) {
          // Check if account is locked or suspended
          if (userProfile['status'] === 'locked') {
            throw new Error('Account is locked. Please contact administrator.');
          }
          
                      if (userProfile['status'] === 'suspended') {
            throw new Error('Account is suspended. Please contact administrator.');
          }
          
                      if (!userProfile['enabled']) {
            throw new Error('Account is disabled. Please contact administrator.');
          }
          
          // Update last login timestamp
          try {
            await dynamodb.update({
              TableName: USERS_TABLE,
              Key: { userId: userName },
              UpdateExpression: 'SET lastLogin = :lastLogin, updatedAt = :updatedAt',
              ExpressionAttributeValues: {
                ':lastLogin': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
              }
            }).promise();
          } catch (updateError) {
            console.warn('Failed to update last login:', updateError);
            // Continue execution even if update fails
          }
          
          console.log(`Pre-authentication check passed for user: ${userName}`);
        } else {
          console.log(`No user profile found for: ${userName}, proceeding with authentication`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('locked') || 
                        (error as any).message.includes('suspended') ||
            (error as any).message.includes('disabled')) {
          throw error; // Re-throw account status errors
        }
        
        console.warn('Could not fetch user profile for pre-authentication check:', error);
        // Continue with authentication if profile check fails
      }
    }
    
    return event;
    
  } catch (error) {
    console.error('Pre-authentication check failed:', error);
    
    // Return error to prevent authentication
    throw error;
  }
};
