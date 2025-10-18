import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUPS_TABLE = 'classcast-assignment-groups';

// GET /api/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const result = await docClient.send(new GetCommand({
      TableName: GROUPS_TABLE,
      Key: { groupId }
    }));

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      group: result.Item
    });

  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

