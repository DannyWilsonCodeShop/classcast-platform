import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TEAMS_TABLE = 'classcast-teams';

// GET: Fetch teams (by leadId or memberId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const memberId = searchParams.get('memberId');

    let result;
    if (leadId) {
      result = await docClient.send(new ScanCommand({
        TableName: TEAMS_TABLE,
        FilterExpression: 'leadId = :leadId',
        ExpressionAttributeValues: { ':leadId': leadId },
      }));
    } else if (memberId) {
      // Find teams where this user is a member
      result = await docClient.send(new ScanCommand({ TableName: TEAMS_TABLE }));
      const teams = (result.Items || []).filter((team: any) =>
        team.leadId === memberId || (team.members || []).some((m: any) => m.userId === memberId)
      );
      return NextResponse.json({ success: true, teams });
    } else {
      result = await docClient.send(new ScanCommand({ TableName: TEAMS_TABLE }));
    }

    return NextResponse.json({ success: true, teams: result.Items || [] });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// POST: Create a team
export async function POST(request: NextRequest) {
  try {
    const { name, leadId, leadName, members } = await request.json();

    if (!name || !leadId) {
      return NextResponse.json({ success: false, error: 'name and leadId are required' }, { status: 400 });
    }

    const team = {
      teamId: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      leadId,
      leadName: leadName || '',
      members: members || [], // [{ userId, name, email }]
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TEAMS_TABLE, Item: team }));

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ success: false, error: 'Failed to create team' }, { status: 500 });
  }
}

// PUT: Update team (add/remove members)
export async function PUT(request: NextRequest) {
  try {
    const { teamId, members, name } = await request.json();

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'teamId is required' }, { status: 400 });
    }

    const updateExpressions: string[] = ['updatedAt = :now'];
    const expressionValues: any = { ':now': new Date().toISOString() };

    if (members !== undefined) {
      updateExpressions.push('members = :members');
      expressionValues[':members'] = members;
    }
    if (name !== undefined) {
      updateExpressions.push('#n = :name');
      expressionValues[':name'] = name;
    }

    const params: any = {
      TableName: TEAMS_TABLE,
      Key: { teamId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
    };
    if (name !== undefined) {
      params.ExpressionAttributeNames = { '#n': 'name' };
    }

    await docClient.send(new UpdateCommand(params));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ success: false, error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE: Delete a team
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'teamId is required' }, { status: 400 });
    }

    await docClient.send(new DeleteCommand({ TableName: TEAMS_TABLE, Key: { teamId } }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete team' }, { status: 500 });
  }
}
