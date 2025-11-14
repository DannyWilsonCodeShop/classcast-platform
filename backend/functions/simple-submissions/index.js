// Simple Submissions Lambda - DynamoDB submission handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE_NAME || 'ClassCastCleanSubmissions';

exports.handler = async (event) => {
  console.log('Submissions event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const submissionId = event.pathParameters?.submissionId;
    const path = event.path || event.requestContext?.resourcePath || '';

    // GET /submissions - List all submissions (with optional filters)
    // GET /submissions/{submissionId} - Get specific submission
    // POST /submissions - Create new submission
    // PUT /submissions/{submissionId} - Update submission
    // DELETE /submissions/{submissionId} - Delete submission
    // GET /submissions/assignment/{assignmentId} - Get submissions for an assignment
    // GET /submissions/student/{studentId} - Get submissions by a student
    // PUT /submissions/{submissionId}/grade - Grade a submission

    if (method === 'GET') {
      // Check if it's a specific route pattern
      if (path.includes('/assignment/')) {
        // Get submissions for a specific assignment
        const assignmentId = event.pathParameters?.assignmentId;
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :submissionPrefix) AND assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':submissionPrefix': 'SUBMISSION#',
            ':assignmentId': assignmentId
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
            data: { submissions: result.Items || [] }
          })
        };
      } else if (path.includes('/student/')) {
        // Get submissions by a specific student
        const studentId = event.pathParameters?.studentId;
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :submissionPrefix) AND studentId = :studentId',
          ExpressionAttributeValues: {
            ':submissionPrefix': 'SUBMISSION#',
            ':studentId': studentId
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
            data: { submissions: result.Items || [] }
          })
        };
      } else if (submissionId) {
        // Get specific submission
        const result = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { 
            PK: `SUBMISSION#${submissionId}`,
            SK: `SUBMISSION#${submissionId}`
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
              data: { submission: result.Item }
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
              error: 'Submission not found'
            })
          };
        }
      } else {
        // Get all submissions
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :submissionPrefix)',
          ExpressionAttributeValues: {
            ':submissionPrefix': 'SUBMISSION#'
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
            data: { submissions: result.Items || [] }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new submission
      const body = JSON.parse(event.body || '{}');
      
      const submissionId = 'submission_' + Date.now();
      const newSubmission = {
        PK: `SUBMISSION#${submissionId}`,
        SK: `SUBMISSION#${submissionId}`,
        id: submissionId,
        assignmentId: body.assignmentId || '',
        courseId: body.courseId || '',
        studentId: body.studentId || '',
        studentName: body.studentName || '',
        studentEmail: body.studentEmail || '',
        content: body.content || '',
        videoUrl: body.videoUrl || '',
        thumbnailUrl: body.thumbnailUrl || '',
        files: body.files || [],
        status: body.status || 'draft',
        submittedAt: body.status === 'submitted' ? new Date().toISOString() : null,
        grade: body.grade || null,
        feedback: body.feedback || '',
        gradedAt: null,
        gradedBy: null,
        duration: body.duration || 0,
        fileSize: body.fileSize || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: SUBMISSIONS_TABLE,
        Item: newSubmission
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
          data: { submission: newSubmission },
          message: 'Submission created successfully'
        })
      };
    }

    if (method === 'PUT') {
      // Update submission
      const body = JSON.parse(event.body || '{}');
      
      // Check if this is a grading request
      if (path.includes('/grade')) {
        // Get existing submission
        const existingResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { 
            PK: `SUBMISSION#${submissionId}`,
            SK: `SUBMISSION#${submissionId}`
          }
        }));
        
        if (!existingResult.Item) {
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
              error: 'Submission not found'
            })
          };
        }
        
        // Update with grade
        const updatedSubmission = {
          ...existingResult.Item,
          grade: body.grade,
          feedback: body.feedback || '',
          status: 'graded',
          gradedAt: new Date().toISOString(),
          gradedBy: body.gradedBy || body.instructorId || '',
          updatedAt: new Date().toISOString()
        };
        
        await docClient.send(new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: updatedSubmission
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
            data: { submission: updatedSubmission },
            message: 'Submission graded successfully'
          })
        };
      } else {
        // Regular update
        const existingResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { 
            PK: `SUBMISSION#${submissionId}`,
            SK: `SUBMISSION#${submissionId}`
          }
        }));
        
        if (!existingResult.Item) {
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
              error: 'Submission not found'
            })
          };
        }
        
        const updatedSubmission = {
          ...existingResult.Item,
          ...body,
          id: submissionId,
          PK: `SUBMISSION#${submissionId}`,
          SK: `SUBMISSION#${submissionId}`,
          updatedAt: new Date().toISOString()
        };
        
        await docClient.send(new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: updatedSubmission
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
            data: { submission: updatedSubmission },
            message: 'Submission updated successfully'
          })
        };
      }
    }

    if (method === 'DELETE') {
      // Delete submission
      await docClient.send(new DeleteCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { 
          PK: `SUBMISSION#${submissionId}`,
          SK: `SUBMISSION#${submissionId}`
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
          message: 'Submission deleted successfully'
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
    console.error('Submissions error:', error);
    
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
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

