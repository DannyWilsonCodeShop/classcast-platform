import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUPS_TABLE = 'classcast-assignment-groups';

// GET /api/groups/my-group?assignmentId=xxx&userId=xxx - Get user's group for an assignment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const userId = searchParams.get('userId');

    if (!assignmentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and User ID required' },
        { status: 400 }
      );
    }

    // Get all groups for this assignment
    const result = await docClient.send(new QueryCommand({
      TableName: GROUPS_TABLE,
      IndexName: 'AssignmentIdIndex',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));

    const groups = result.Items || [];
    const userGroup = groups.find(group => group.memberIds.includes(userId));

    if (!userGroup) {
      return NextResponse.json({
        success: true,
        group: null,
        hasGroup: false
      });
    }

    return NextResponse.json({
      success: true,
      group: userGroup,
      hasGroup: true
    });

  } catch (error) {
    console.error('Error fetching user group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

