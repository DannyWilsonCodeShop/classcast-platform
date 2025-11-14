const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Environment variables
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE || 'classcast-assignments';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const instructorId = queryParams.instructorId;
    const courseId = queryParams.courseId;
    const status = queryParams.status;
    
    let assignments = [];
    
    if (instructorId) {
      // Query assignments by instructor
      const params = {
        TableName: ASSIGNMENTS_TABLE,
        IndexName: 'instructorId-index', // Assuming this GSI exists
        KeyConditionExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: {
          ':instructorId': { S: instructorId }
        }
      };
      
      const result = await dynamodb.send(new QueryCommand(params));
      assignments = result.Items ? result.Items.map(item => unmarshall(item)) : [];
    } else if (courseId) {
      // Query assignments by course
      const params = {
        TableName: ASSIGNMENTS_TABLE,
        IndexName: 'courseId-index', // Assuming this GSI exists
        KeyConditionExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': { S: courseId }
        }
      };
      
      const result = await dynamodb.send(new QueryCommand(params));
      assignments = result.Items ? result.Items.map(item => unmarshall(item)) : [];
    } else {
      // Scan all assignments (with limit for performance)
      const params = {
        TableName: ASSIGNMENTS_TABLE,
        Limit: 100
      };
      
      const result = await dynamodb.send(new ScanCommand(params));
      assignments = result.Items ? result.Items.map(item => unmarshall(item)) : [];
    }
    
    // Filter by status if provided
    if (status) {
      assignments = assignments.filter(assignment => assignment.status === status);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: assignments,
        count: assignments.length
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
