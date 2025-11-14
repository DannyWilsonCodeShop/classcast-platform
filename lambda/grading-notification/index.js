const AWS = require('aws-sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Grading notification event:', JSON.stringify(event, null, 2));

  try {
    // Check for new responses that need grading
    const newResponses = await getNewResponses();
    
    if (newResponses.length > 0) {
      await notifyInstructors(newResponses);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Grading notifications processed',
        newResponses: newResponses.length
      })
    };

  } catch (error) {
    console.error('Error processing grading notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Grading notification processing failed' })
    };
  }
};

async function getNewResponses() {
  try {
    const queryCommand = new QueryCommand({
      TableName: process.env.RESPONSES_TABLE_NAME,
      IndexName: 'GradingQueueIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'submitted'
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(queryCommand);
    return result.Items || [];

  } catch (error) {
    console.error('Error fetching new responses:', error);
    return [];
  }
}

async function notifyInstructors(responses) {
  try {
    // Group responses by assignment
    const responsesByAssignment = {};
    responses.forEach(response => {
      const assignmentId = response.assignmentId;
      if (!responsesByAssignment[assignmentId]) {
        responsesByAssignment[assignmentId] = [];
      }
      responsesByAssignment[assignmentId].push(response);
    });

    // Send notification for each assignment
    for (const [assignmentId, assignmentResponses] of Object.entries(responsesByAssignment)) {
      const notificationMessage = {
        type: 'grading_required',
        assignmentId,
        responseCount: assignmentResponses.length,
        responses: assignmentResponses.map(r => ({
          responseId: r.responseId,
          videoId: r.videoId,
          userId: r.userId,
          wordCount: r.wordCount,
          createdAt: r.createdAt
        })),
        message: `${assignmentResponses.length} new response(s) submitted for grading`,
        timestamp: new Date().toISOString()
      };

      const publishCommand = new PublishCommand({
        TopicArn: process.env.NOTIFICATIONS_TOPIC_ARN,
        Message: JSON.stringify(notificationMessage),
        MessageAttributes: {
          type: {
            DataType: 'String',
            StringValue: 'grading_required'
          },
          assignmentId: {
            DataType: 'String',
            StringValue: assignmentId
          }
        }
      });

      await snsClient.send(publishCommand);
      console.log(`Grading notification sent for assignment ${assignmentId}`);
    }

  } catch (error) {
    console.error('Error notifying instructors:', error);
  }
}
