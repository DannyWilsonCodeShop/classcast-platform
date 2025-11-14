// Simple Courses Lambda - DynamoDB course handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const COURSES_TABLE = process.env.COURSES_TABLE_NAME || 'ClassCastCleanCourses';

exports.handler = async (event) => {
  console.log('Courses event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const courseId = event.pathParameters?.courseId;

    if (method === 'GET') {
      if (courseId) {
        // Get specific course from DynamoDB
        const result = await docClient.send(new GetCommand({
          TableName: COURSES_TABLE,
          Key: { 
            PK: `COURSE#${courseId}`,
            SK: `COURSE#${courseId}`
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
              data: { course: result.Item }
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
              error: 'Course not found'
            })
          };
        }
      } else {
        // Get all courses from DynamoDB
        const result = await docClient.send(new ScanCommand({
          TableName: COURSES_TABLE,
          FilterExpression: 'begins_with(PK, :coursePrefix)',
          ExpressionAttributeValues: {
            ':coursePrefix': 'COURSE#'
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
            data: { courses: result.Items || [] }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new course and save to DynamoDB
      const body = JSON.parse(event.body || '{}');
      
      const courseId = 'course_' + Date.now();
      const newCourse = {
        PK: `COURSE#${courseId}`,
        SK: `COURSE#${courseId}`,
        id: courseId,
        name: body.name || 'New Course',
        code: body.code || 'NEW101',
        description: body.description || 'A new course',
        instructorId: body.instructorId || 'instructor_123',
        instructorName: 'Dr. Smith',
        status: 'draft',
        semester: body.semester || 'Fall',
        year: body.year || 2024,
        credits: body.credits || 3,
        maxEnrollment: body.maxEnrollment || 30,
        currentEnrollment: 0,
        schedule: body.schedule || {
          days: ['Monday', 'Wednesday'],
          time: '10:00 AM - 11:00 AM',
          location: 'Room 101'
        },
        prerequisites: body.prerequisites || [],
        learningObjectives: body.learningObjectives || ['Learn something new'],
        gradingPolicy: body.gradingPolicy || {
          assignments: 60,
          exams: 30,
          participation: 10,
          projects: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: COURSES_TABLE,
        Item: newCourse
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
          data: { course: newCourse },
          message: 'Course created successfully'
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
    console.error('Courses error:', error);
    
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
