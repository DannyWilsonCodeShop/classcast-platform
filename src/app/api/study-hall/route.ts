import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PULLOUTS_TABLE = 'classcast-study-hall-pullouts';
const ROSTER_TABLE = 'classcast-study-hall-roster';
const USERS_TABLE = 'classcast-users';

// GET: Fetch pullout requests for a specific date (or all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const requestedBy = searchParams.get('requestedBy'); // instructor userId

    let filterExpression = '';
    const expressionValues: any = {};

    if (date) {
      filterExpression = 'pulloutDate = :date';
      expressionValues[':date'] = date;
    }
    if (requestedBy) {
      filterExpression = filterExpression ? `${filterExpression} AND requestedBy = :requestedBy` : 'requestedBy = :requestedBy';
      expressionValues[':requestedBy'] = requestedBy;
    }

    const params: any = { TableName: PULLOUTS_TABLE };
    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionValues;
    }

    const result = await docClient.send(new ScanCommand(params));

    // Enrich with roster data (homeroom, study hall teacher)
    const rosterResult = await docClient.send(new ScanCommand({ TableName: ROSTER_TABLE }));
    const rosterMap = new Map((rosterResult.Items || []).map((r: any) => [r.studentName?.toLowerCase(), r]));

    const enrichedPullouts = (result.Items || []).map((pullout: any) => {
      const rosterEntry = rosterMap.get(pullout.studentName?.toLowerCase());
      return {
        ...pullout,
        homeroom: rosterEntry?.homeroom || 'Unassigned',
        studyHallTeacher: rosterEntry?.studyHallTeacher || 'Unknown',
      };
    });

    return NextResponse.json({ success: true, pullouts: enrichedPullouts }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error fetching pullouts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pullouts' }, { status: 500 });
  }
}

// POST: Create a pullout request
export async function POST(request: NextRequest) {
  try {
    const { studentName, studentId, pulloutDate, requestedBy, requestedByName, reason } = await request.json();

    if (!studentName || !pulloutDate || !requestedBy) {
      return NextResponse.json({ success: false, error: 'studentName, pulloutDate, and requestedBy are required' }, { status: 400 });
    }

    const pullout = {
      pulloutId: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentName,
      studentId: studentId || '',
      pulloutDate, // YYYY-MM-DD
      requestedBy,
      requestedByName: requestedByName || '',
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: PULLOUTS_TABLE, Item: pullout }));

    return NextResponse.json({ success: true, pullout }, { status: 201 });
  } catch (error) {
    console.error('Error creating pullout:', error);
    return NextResponse.json({ success: false, error: 'Failed to create pullout request' }, { status: 500 });
  }
}

// DELETE: Remove a pullout request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pulloutId = searchParams.get('pulloutId');

    if (!pulloutId) {
      return NextResponse.json({ success: false, error: 'pulloutId is required' }, { status: 400 });
    }

    await docClient.send(new DeleteCommand({ TableName: PULLOUTS_TABLE, Key: { pulloutId } }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pullout:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete pullout' }, { status: 500 });
  }
}
