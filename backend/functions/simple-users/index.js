// Simple Users Lambda - DynamoDB user profile handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'classcast-users';

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
          userId: userId
        }
      }));
      
      if (result.Item) {
        // Map DynamoDB item to expected format
        const userData = {
          id: result.Item.userId || userId,
          email: result.Item.email || 'user@example.com',
          firstName: result.Item.firstName || '',
          lastName: result.Item.lastName || '',
          role: result.Item.role || 'student',
          avatar: result.Item.avatar || '',
          emailVerified: result.Item.emailVerified !== undefined ? result.Item.emailVerified : true,
          bio: result.Item.bio || '',
          careerGoals: result.Item.careerGoals || '',
          classOf: result.Item.classOf || '',
          funFact: result.Item.funFact || '',
          favoriteSubject: result.Item.favoriteSubject || '',
          hobbies: result.Item.hobbies || '',
          schoolName: result.Item.schoolName || ''
        };
        
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
            data: userData
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
          userId: userId
        }
      }));
      
      // Prepare the updated user data
      const updatedData = {
        userId: userId,
        email: body.email || existingUser.Item?.email || 'user@example.com',
        firstName: body.firstName !== undefined ? body.firstName : (existingUser.Item?.firstName || ''),
        lastName: body.lastName !== undefined ? body.lastName : (existingUser.Item?.lastName || ''),
        role: existingUser.Item?.role || 'student',
        avatar: body.avatar !== undefined ? body.avatar : (existingUser.Item?.avatar || ''),
        emailVerified: existingUser.Item?.emailVerified !== undefined ? existingUser.Item.emailVerified : true,
        bio: body.bio !== undefined ? body.bio : (existingUser.Item?.bio || ''),
        careerGoals: body.careerGoals !== undefined ? body.careerGoals : (existingUser.Item?.careerGoals || ''),
        classOf: body.classOf !== undefined ? body.classOf : (existingUser.Item?.classOf || ''),
        funFact: body.funFact !== undefined ? body.funFact : (existingUser.Item?.funFact || ''),
        favoriteSubject: body.favoriteSubject !== undefined ? body.favoriteSubject : (existingUser.Item?.favoriteSubject || ''),
        hobbies: body.hobbies !== undefined ? body.hobbies : (existingUser.Item?.hobbies || ''),
        schoolName: body.schoolName !== undefined ? body.schoolName : (existingUser.Item?.schoolName || ''),
        updatedAt: new Date().toISOString()
      };
      
      // Also preserve any existing fields that aren't in the body
      if (existingUser.Item) {
        // Preserve studentId, instructorId, department if they exist
        if (existingUser.Item.studentId) updatedData.studentId = existingUser.Item.studentId;
        if (existingUser.Item.instructorId) updatedData.instructorId = existingUser.Item.instructorId;
        if (existingUser.Item.department) updatedData.department = existingUser.Item.department;
      }
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: updatedData
      }));
      
      // Return data in the expected frontend format
      const responseData = {
        id: userId,
        email: updatedData.email,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        role: updatedData.role,
        avatar: updatedData.avatar,
        emailVerified: updatedData.emailVerified,
        bio: updatedData.bio,
        careerGoals: updatedData.careerGoals,
        classOf: updatedData.classOf,
        funFact: updatedData.funFact,
        favoriteSubject: updatedData.favoriteSubject,
        hobbies: updatedData.hobbies,
        schoolName: updatedData.schoolName
      };
      
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
          data: responseData,
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
