// Simple Peer Reviews Lambda - DynamoDB peer review handler
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE_NAME || 'ClassCastCleanSubmissions';

exports.handler = async (event) => {
  console.log('Peer Reviews event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const reviewId = event.pathParameters?.reviewId;
    const path = event.path || event.requestContext?.resourcePath || '';

    // GET /peer-reviews - List all peer reviews (with optional filters)
    // GET /peer-reviews/{reviewId} - Get specific peer review
    // POST /peer-reviews - Create new peer review/response
    // PUT /peer-reviews/{reviewId} - Update peer review
    // DELETE /peer-reviews/{reviewId} - Delete peer review
    // GET /peer-reviews/video/{videoId} - Get reviews for a video
    // GET /peer-reviews/reviewer/{reviewerId} - Get reviews by a reviewer
    // GET /peer-reviews/assignment/{assignmentId} - Get all reviews for an assignment

    if (method === 'GET') {
      // Check for specific route patterns
      if (path.includes('/video/')) {
        // Get reviews for a specific video submission
        const videoId = event.pathParameters?.videoId;
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :reviewPrefix) AND videoId = :videoId',
          ExpressionAttributeValues: {
            ':reviewPrefix': 'PEER_REVIEW#',
            ':videoId': videoId
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
            data: { reviews: result.Items || [] }
          })
        };
      } else if (path.includes('/reviewer/')) {
        // Get reviews by a specific reviewer
        const reviewerId = event.pathParameters?.reviewerId;
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :reviewPrefix) AND reviewerId = :reviewerId',
          ExpressionAttributeValues: {
            ':reviewPrefix': 'PEER_REVIEW#',
            ':reviewerId': reviewerId
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
            data: { reviews: result.Items || [] }
          })
        };
      } else if (path.includes('/assignment/')) {
        // Get all peer reviews for an assignment
        const assignmentId = event.pathParameters?.assignmentId;
        
        // First, get all submissions for this assignment
        const submissionsResult = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :submissionPrefix) AND assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':submissionPrefix': 'SUBMISSION#',
            ':assignmentId': assignmentId
          }
        }));
        
        // Then get all peer reviews for this assignment
        const reviewsResult = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :reviewPrefix) AND assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':reviewPrefix': 'PEER_REVIEW#',
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
            data: { 
              submissions: submissionsResult.Items || [],
              reviews: reviewsResult.Items || []
            }
          })
        };
      } else if (reviewId) {
        // Get specific peer review
        const result = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { 
            PK: `PEER_REVIEW#${reviewId}`,
            SK: `PEER_REVIEW#${reviewId}`
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
              data: { review: result.Item }
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
              error: 'Peer review not found'
            })
          };
        }
      } else {
        // Get all peer reviews
        const result = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'begins_with(PK, :reviewPrefix)',
          ExpressionAttributeValues: {
            ':reviewPrefix': 'PEER_REVIEW#'
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
            data: { reviews: result.Items || [] }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new peer review
      const body = JSON.parse(event.body || '{}');
      
      const reviewId = 'review_' + Date.now();
      const newReview = {
        PK: `PEER_REVIEW#${reviewId}`,
        SK: `PEER_REVIEW#${reviewId}`,
        id: reviewId,
        assignmentId: body.assignmentId || '',
        courseId: body.courseId || '',
        videoId: body.videoId || body.submissionId || '',
        reviewerId: body.reviewerId || body.studentId || '',
        reviewerName: body.reviewerName || '',
        reviewerEmail: body.reviewerEmail || '',
        reviewedStudentId: body.reviewedStudentId || '',
        reviewedStudentName: body.reviewedStudentName || '',
        content: body.content || '',
        responseType: body.responseType || 'text',
        videoResponse: body.videoResponse || null,
        parentResponseId: body.parentResponseId || null,
        threadLevel: body.threadLevel || 0,
        wordCount: body.wordCount || 0,
        characterCount: body.characterCount || 0,
        rating: body.rating || null,
        qualityScore: body.qualityScore || null,
        isSubmitted: body.isSubmitted || false,
        submittedAt: body.isSubmitted ? new Date().toISOString() : null,
        lastSavedAt: new Date().toISOString(),
        aiGrade: body.aiGrade || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: SUBMISSIONS_TABLE,
        Item: newReview
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
          data: { review: newReview },
          message: 'Peer review created successfully'
        })
      };
    }

    if (method === 'PUT') {
      // Update peer review
      const body = JSON.parse(event.body || '{}');
      
      const existingResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { 
          PK: `PEER_REVIEW#${reviewId}`,
          SK: `PEER_REVIEW#${reviewId}`
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
            error: 'Peer review not found'
          })
        };
      }
      
      const updatedReview = {
        ...existingResult.Item,
        ...body,
        id: reviewId,
        PK: `PEER_REVIEW#${reviewId}`,
        SK: `PEER_REVIEW#${reviewId}`,
        lastSavedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await docClient.send(new PutCommand({
        TableName: SUBMISSIONS_TABLE,
        Item: updatedReview
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
          data: { review: updatedReview },
          message: 'Peer review updated successfully'
        })
      };
    }

    if (method === 'DELETE') {
      // Delete peer review
      await docClient.send(new DeleteCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { 
          PK: `PEER_REVIEW#${reviewId}`,
          SK: `PEER_REVIEW#${reviewId}`
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
          message: 'Peer review deleted successfully'
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
    console.error('Peer Reviews error:', error);
    
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

