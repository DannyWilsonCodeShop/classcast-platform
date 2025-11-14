import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUPS_TABLE = 'classcast-assignment-groups';

// POST /api/groups/join - Join a group with code
export async function POST(request: NextRequest) {
  try {
    const { joinCode, userId, userFirstName, userLastName } = await request.json();

    if (!joinCode || !userId) {
      return NextResponse.json(
        { success: false, error: 'Join code and User ID required' },
        { status: 400 }
      );
    }

    // Find group by join code
    const groupResult = await docClient.send(new QueryCommand({
      TableName: GROUPS_TABLE,
      IndexName: 'JoinCodeIndex',
      KeyConditionExpression: 'joinCode = :code',
      ExpressionAttributeValues: {
        ':code': joinCode.toUpperCase()
      }
    }));

    if (!groupResult.Items || groupResult.Items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code. Please check and try again.' },
        { status: 404 }
      );
    }

    const group = groupResult.Items[0];

    // Check if user is already in this group
    if (group.memberIds.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'You are already in this group' },
        { status: 409 }
      );
    }

    // Check if group is full
    if (group.currentSize >= group.maxSize) {
      return NextResponse.json(
        { success: false, error: 'This group is full. Try another code or create a new group.' },
        { status: 409 }
      );
    }

    // Check if group has already submitted
    if (group.status === 'submitted') {
      return NextResponse.json(
        { success: false, error: 'This group has already submitted and cannot accept new members.' },
        { status: 409 }
      );
    }

    // Check if user is already in another group for this assignment
    const allGroupsResult = await docClient.send(new QueryCommand({
      TableName: GROUPS_TABLE,
      IndexName: 'AssignmentIdIndex',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': group.assignmentId
      }
    }));

    const userInOtherGroup = (allGroupsResult.Items || []).some(g => 
      g.groupId !== group.groupId && g.memberIds.includes(userId)
    );

    if (userInOtherGroup) {
      return NextResponse.json(
        { success: false, error: 'You are already in another group for this assignment' },
        { status: 409 }
      );
    }

    // Add user to group
    const updatedMemberIds = [...group.memberIds, userId];
    const newMember = {
      userId,
      firstName: userFirstName,
      lastName: userLastName,
      joinedAt: new Date().toISOString(),
      role: 'member'
    };
    const updatedMembers = [...group.members, newMember];

    await docClient.send(new UpdateCommand({
      TableName: GROUPS_TABLE,
      Key: { groupId: group.groupId },
      UpdateExpression: 'SET memberIds = :memberIds, members = :members, currentSize = :size, updatedAt = :updatedAt, #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':memberIds': updatedMemberIds,
        ':members': updatedMembers,
        ':size': updatedMemberIds.length,
        ':updatedAt': new Date().toISOString(),
        ':status': updatedMemberIds.length >= group.maxSize ? 'ready' : 'forming'
      }
    }));

    return NextResponse.json({
      success: true,
      group: {
        groupId: group.groupId,
        groupName: group.groupName,
        joinCode: group.joinCode,
        currentSize: updatedMemberIds.length,
        maxSize: group.maxSize,
        members: updatedMembers,
        status: updatedMemberIds.length >= group.maxSize ? 'ready' : 'forming'
      }
    });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

