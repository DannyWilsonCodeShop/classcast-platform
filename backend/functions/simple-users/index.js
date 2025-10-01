// Simple Users Lambda - DynamoDB user profile handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'ClassCastCleanUsers';

exports.handler = async (event) => {
  console.log('Users event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const userId = event.pathParameters?.userId;

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
        })
      };
    }

    if (method === 'GET') {
      // Get user profile from DynamoDB
      const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { 
          PK: `USER#${userId}`,
          SK: `USER#${userId}`
        }
      }));
      
      if (result.Item) {
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
            data: result.Item
          })
        };
      } else {
        // User not found in DB, return default profile
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
            data: {
              id: userId,
              email: 'user@example.com',
              firstName: 'New',
              lastName: 'User',
              role: 'student',
              avatar: '',
              emailVerified: true,
              bio: '',
              careerGoals: '',
              classOf: '2024',
              funFact: '',
              favoriteSubject: '',
              hobbies: '',
              schoolName: ''
            }
          })
        };
      }
    }

    if (method === 'PUT') {
      // Update user profile in DynamoDB
      const body = JSON.parse(event.body || '{}');
      
      // First, get existing user data
      const existingUser = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { 
          PK: `USER#${userId}`,
          SK: `USER#${userId}`
        }
      }));
      
      // Merge existing data with updates
      const updatedUser = {
        PK: `USER#${userId}`,
        SK: `USER#${userId}`,
        id: userId,
        email: body.email || existingUser.Item?.email || 'user@example.com',
        firstName: body.firstName || existingUser.Item?.firstName || '',
        lastName: body.lastName || existingUser.Item?.lastName || '',
        role: existingUser.Item?.role || 'student',
        avatar: body.avatar !== undefined ? body.avatar : (existingUser.Item?.avatar || ''),
        emailVerified: existingUser.Item?.emailVerified || true,
        bio: body.bio !== undefined ? body.bio : (existingUser.Item?.bio || ''),
        careerGoals: body.careerGoals !== undefined ? body.careerGoals : (existingUser.Item?.careerGoals || ''),
        classOf: body.classOf !== undefined ? body.classOf : (existingUser.Item?.classOf || ''),
        funFact: body.funFact !== undefined ? body.funFact : (existingUser.Item?.funFact || ''),
        favoriteSubject: body.favoriteSubject !== undefined ? body.favoriteSubject : (existingUser.Item?.favoriteSubject || ''),
        hobbies: body.hobbies !== undefined ? body.hobbies : (existingUser.Item?.hobbies || ''),
        schoolName: body.schoolName !== undefined ? body.schoolName : (existingUser.Item?.schoolName || ''),
        updatedAt: new Date().toISOString()
      };
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: updatedUser
      }));
      
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
          data: updatedUser,
          message: 'Profile updated successfully'
        })
      };
    }

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
      })
    };

  } catch (error) {
    console.error('Users error:', error);
    
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
      })
    };
  }
};
