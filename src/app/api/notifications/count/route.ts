import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    let totalCount = 0;

    // Check for new messages (in future when messages are implemented)
    try {
      // TODO: Query messages table for unread messages
      // const messagesResult = await docClient.send(new ScanCommand({...}));
      // totalCount += messagesResult.Items.filter(m => !m.readAt).length;
    } catch (error) {
      console.log('Messages table not implemented yet');
    }

    // Check for new grades (in future when grading is implemented)
    try {
      // TODO: Query grades table for unread grades
      // const gradesResult = await docClient.send(new ScanCommand({...}));
      // totalCount += gradesResult.Items.filter(g => !g.readAt).length;
    } catch (error) {
      console.log('Grades table not implemented yet');
    }

    // Check for new followers (Study Buddy requests)
    try {
      const connectionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-connections',
        FilterExpression: 'requestedId = :userId AND status = :status',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': 'pending'
        }
      }));
      totalCount += connectionsResult.Items?.length || 0;
    } catch (error) {
      console.log('Error querying connections for followers:', error);
    }

    // Check for new likes on user's videos
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      // For each submission, check if it has new likes since last check
      // For now, we'll just count total likes on all user's videos
      // This could be optimized to only count new likes if we track "lastCheckedAt"
      const allLikes = submissionsResult.Items?.reduce((sum, sub) => sum + (sub.likes || 0), 0) || 0;
      // For now, we'll use a simplified count - you could store "lastNotifiedLikes" in user profile
    } catch (error) {
      console.log('Error querying submissions for likes:', error);
    }

    // Check for new ratings on user's videos
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      // Count total ratings on user's videos
      const allRatings = submissionsResult.Items?.reduce((sum, sub) => {
        return sum + (sub.averageRating && sub.averageRating > 0 ? 1 : 0);
      }, 0) || 0;
    } catch (error) {
      console.log('Error querying submissions for ratings:', error);
    }

    // Check for new responses on user's videos
    try {
      const interactionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-peer-interactions',
        FilterExpression: 'contentCreatorId = :userId AND type = :type',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':type': 'response'
        }
      }));
      
      // Count unread responses
      const unreadResponses = interactionsResult.Items?.filter(i => !i.readAt).length || 0;
      totalCount += unreadResponses;
    } catch (error) {
      console.log('Error querying interactions for responses:', error);
    }

    // Check for comments on user's videos
    try {
      const commentsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-peer-interactions',
        FilterExpression: 'contentCreatorId = :userId AND type = :type',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':type': 'comment'
        }
      }));
      
      // Count unread comments
      const unreadComments = commentsResult.Items?.filter(c => !c.readAt).length || 0;
      totalCount += unreadComments;
    } catch (error) {
      console.log('Error querying interactions for comments:', error);
    }

    return NextResponse.json({
      success: true,
      count: totalCount
    });

  } catch (error) {
    console.error('Error counting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to count notifications' },
      { status: 500 }
    );
  }
}

