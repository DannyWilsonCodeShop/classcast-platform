import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';
const TEAMS_TABLE = 'classcast-teams';

/**
 * POST /api/teams/add-member
 * Adds a teacher to a team. If the teacher doesn't have an account, creates one.
 * Body: { teamId, email, firstName, lastName, password?, schoolName?, schoolLogo? }
 */
export async function POST(request: NextRequest) {
  try {
    const { teamId, email, firstName, lastName, password, schoolName, schoolLogo } = await request.json();

    if (!teamId || !email) {
      return NextResponse.json({ success: false, error: 'teamId and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': normalizedEmail },
    }));

    let userId: string;
    let userName: string;

    if (existingResult.Items && existingResult.Items.length > 0) {
      // User exists — just get their info
      const existing = existingResult.Items[0];
      userId = existing.userId;
      userName = `${existing.firstName || ''} ${existing.lastName || ''}`.trim();
    } else {
      // Create new instructor account
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const defaultPassword = password || 'ClassCast2026!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = {
        userId,
        email: normalizedEmail,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        role: 'instructor',
        password: hashedPassword,
        emailVerified: true,
        schoolName: schoolName || '',
        schoolLogo: schoolLogo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: newUser }));
      userName = `${newUser.firstName} ${newUser.lastName}`.trim();
    }

    // Add to team
    const teamResult = await docClient.send(new ScanCommand({
      TableName: TEAMS_TABLE,
      FilterExpression: 'teamId = :teamId',
      ExpressionAttributeValues: { ':teamId': teamId },
    }));

    const team = teamResult.Items?.[0];
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    const currentMembers = team.members || [];
    // Don't add duplicates
    if (currentMembers.some((m: any) => m.email === normalizedEmail || m.userId === userId)) {
      return NextResponse.json({ success: true, message: 'Already a member', member: { userId, name: userName, email: normalizedEmail } });
    }

    const updatedMembers = [...currentMembers, { userId, name: userName, email: normalizedEmail }];

    await docClient.send(new UpdateCommand({
      TableName: TEAMS_TABLE,
      Key: { teamId },
      UpdateExpression: 'SET members = :members, updatedAt = :now',
      ExpressionAttributeValues: { ':members': updatedMembers, ':now': new Date().toISOString() },
    }));

    return NextResponse.json({
      success: true,
      member: { userId, name: userName, email: normalizedEmail },
      accountCreated: !(existingResult.Items && existingResult.Items.length > 0),
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ success: false, error: 'Failed to add member' }, { status: 500 });
  }
}
