import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const GROUPS_TABLE = 'classcast-assignment-groups';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

// Generate random 6-character join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/groups/create - Create a new group
export async function POST(request: NextRequest) {
  try {
    const { assignmentId, userId, groupName, userFirstName, userLastName } = await request.json();

    if (!assignmentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and User ID required' },
        { status: 400 }
      );
    }

    // Get assignment details to check if it's a group assignment
    const assignmentResult = await docClient.send(new QueryCommand({
      TableName: ASSIGNMENTS_TABLE,
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));

    const assignment = assignmentResult.Items?.[0];

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (!assignment.groupAssignment) {
      return NextResponse.json(
        { success: false, error: 'This is not a group assignment' },
        { status: 400 }
      );
    }

    // Check if user is already in a group for this assignment
    const existingGroupResult = await docClient.send(new QueryCommand({
      TableName: GROUPS_TABLE,
      IndexName: 'AssignmentIdIndex',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));

    const existingGroups = existingGroupResult.Items || [];
    const userAlreadyInGroup = existingGroups.some(group => 
      group.memberIds.includes(userId)
    );

    if (userAlreadyInGroup) {
      return NextResponse.json(
        { success: false, error: 'You are already in a group for this assignment' },
        { status: 409 }
      );
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const codeCheckResult = await docClient.send(new QueryCommand({
        TableName: GROUPS_TABLE,
        IndexName: 'JoinCodeIndex',
        KeyConditionExpression: 'joinCode = :code',
        ExpressionAttributeValues: {
          ':code': joinCode
        }
      }));

      if (!codeCheckResult.Items || codeCheckResult.Items.length === 0) {
        codeExists = false;
      } else {
        joinCode = generateJoinCode();
        attempts++;
      }
    }

    // Create group
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const group = {
      groupId,
      assignmentId,
      joinCode,
      groupName: groupName || `Group ${joinCode}`,
      leaderId: userId,
      leaderName: `${userFirstName || ''} ${userLastName || ''}`.trim(),
      memberIds: [userId],
      members: [{
        userId,
        firstName: userFirstName,
        lastName: userLastName,
        joinedAt: now,
        role: 'leader'
      }],
      maxSize: assignment.maxGroupSize || 4,
      currentSize: 1,
      status: 'forming', // forming, ready, submitted
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: GROUPS_TABLE,
      Item: group
    }));

    return NextResponse.json({
      success: true,
      group: {
        groupId,
        joinCode,
        groupName: group.groupName,
        currentSize: 1,
        maxSize: group.maxSize,
        members: group.members
      }
    });

  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

