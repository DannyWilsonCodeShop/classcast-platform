import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/profile/save - Save user profile directly to DynamoDB
export async function POST(request: NextRequest) {
  try {
    console.log('=== DIRECT PROFILE SAVE API CALLED ===');
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    // Validate required fields
    if (!body.userId) {
      console.log('Missing userId in request body');
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const { userId, ...profileData } = body;
    console.log('Processing profile data for user:', userId);

    // Prepare update expression for DynamoDB
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Add updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Process each field
    const allowedFields = [
      'firstName', 'lastName', 'bio', 'schoolName', 'favoriteSubject', 
      'funFact', 'hobbies', 'department', 'avatar', 'careerGoals', 
      'classOf', 'yearsExperience', 'email', 'schoolLogo'
    ];

    for (const [key, value] of Object.entries(profileData)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        
        updateExpression.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = String(value);
      }
    }

    if (updateExpression.length === 1) { // Only updatedAt
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: profileData
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Update DynamoDB directly
    const updateCommand = new UpdateCommand({
      TableName: 'classcast-users',
      Key: {
        userId: userId
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    console.log('Updating DynamoDB with command:', updateCommand);
    const result = await docClient.send(updateCommand);
    console.log('DynamoDB update result:', result);

    // Convert DynamoDB result to user object
    const updatedUser = {
      id: result.Attributes?.userId?.S || userId,
      firstName: result.Attributes?.firstName?.S || profileData.firstName,
      lastName: result.Attributes?.lastName?.S || profileData.lastName,
      email: result.Attributes?.email?.S || profileData.email,
      avatar: result.Attributes?.avatar?.S || profileData.avatar,
      bio: result.Attributes?.bio?.S || profileData.bio,
      careerGoals: result.Attributes?.careerGoals?.S || profileData.careerGoals,
      classOf: result.Attributes?.classOf?.S || profileData.classOf,
      funFact: result.Attributes?.funFact?.S || profileData.funFact,
      favoriteSubject: result.Attributes?.favoriteSubject?.S || profileData.favoriteSubject,
      hobbies: result.Attributes?.hobbies?.S || profileData.hobbies,
      schoolName: result.Attributes?.schoolName?.S || profileData.schoolName,
      schoolLogo: result.Attributes?.schoolLogo?.S || profileData.schoolLogo,
      department: result.Attributes?.department?.S || profileData.department,
      yearsExperience: result.Attributes?.yearsExperience?.N ? parseInt(result.Attributes.yearsExperience.N) : profileData.yearsExperience
    };

    console.log('Returning updated user data:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}