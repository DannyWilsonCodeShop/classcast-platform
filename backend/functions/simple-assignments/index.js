// Simple Assignments Lambda - DynamoDB assignment handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE_NAME || 'ClassCastCleanAssignments';

exports.handler = async (event) => {
  console.log('Assignments event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const assignmentId = event.pathParameters?.assignmentId;

    if (method === 'GET') {
      if (assignmentId) {
        // Get specific assignment from DynamoDB
        const result = await docClient.send(new GetCommand({
          TableName: ASSIGNMENTS_TABLE,
          Key: { 
            PK: `ASSIGNMENT#${assignmentId}`,
            SK: `ASSIGNMENT#${assignmentId}`
          }
        }));
        
        if (result.Item) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({
              success: true,
              data: { assignment: result.Item }
            })
          };
        } else {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({
              success: false,
              error: 'Assignment not found'
            })
          };
        }
      } else {
        // Get all assignments from DynamoDB
        const result = await docClient.send(new ScanCommand({
          TableName: ASSIGNMENTS_TABLE,
          FilterExpression: 'begins_with(PK, :assignmentPrefix)',
          ExpressionAttributeValues: {
            ':assignmentPrefix': 'ASSIGNMENT#'
          }
        }));
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            success: true,
            data: { assignments: result.Items || [] }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new assignment and save to DynamoDB
      const body = JSON.parse(event.body || '{}');
      
      const assignmentId = 'assignment_' + Date.now();
      const newAssignment = {
        PK: `ASSIGNMENT#${assignmentId}`,
        SK: `ASSIGNMENT#${assignmentId}`,
        id: assignmentId,
        title: body.title || 'New Assignment',
        description: body.description || 'A new assignment',
        courseId: body.courseId || 'course_123',
        instructorId: body.instructorId || 'instructor_123',
        points: body.points || 100,
        dueDate: body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: body.type || 'video',
        status: 'published',
        requirements: body.requirements || [],
        allowLateSubmission: body.allowLateSubmission || false,
        latePenalty: body.latePenalty || 10,
        maxSubmissions: body.maxSubmissions || 1,
        groupAssignment: body.groupAssignment || false,
        maxGroupSize: body.maxGroupSize || 2,
        allowedFileTypes: body.allowedFileTypes || ['mp4', 'webm', 'mov'],
        maxFileSize: body.maxFileSize || 100 * 1024 * 1024,
        enablePeerResponses: body.enablePeerResponses || false,
        responseDueDate: body.responseDueDate,
        minResponsesRequired: body.minResponsesRequired || 2,
        maxResponsesPerVideo: body.maxResponsesPerVideo || 3,
        responseWordLimit: body.responseWordLimit || 50,
        responseCharacterLimit: body.responseCharacterLimit || 500,
        hidePeerVideosUntilInstructorPosts: body.hidePeerVideosUntilInstructorPosts || false,
        emoji: body.emoji || '🎥',
        color: body.color || '#4c51bf',
        requireLiveRecording: body.requireLiveRecording || false,
        rubricType: body.rubricType || 'none',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: ASSIGNMENTS_TABLE,
        Item: newAssignment
      }));
      
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: { assignment: newAssignment },
          message: 'Assignment created successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
