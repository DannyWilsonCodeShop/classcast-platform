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
    const teamId = searchParams.get('teamId'); // filter by team

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
    if (teamId) {
      filterExpression = filterExpression ? `${filterExpression} AND teamId = :teamId` : 'teamId = :teamId';
      expressionValues[':teamId'] = teamId;
    }

    const params: any = { TableName: PULLOUTS_TABLE };
    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionValues;
    }

    const result = await docClient.send(new ScanCommand(params));

    // Enrich with roster data (homeroom, study hall teacher)
    const rosterResult = await docClient.send(new ScanCommand({ TableName: ROSTER_TABLE }));
    const rosterItems = rosterResult.Items || [];
    
    // Build exact match map
    const rosterMap = new Map(rosterItems.map((r: any) => [r.studentName?.toLowerCase().trim(), r]));

    const enrichedPullouts = (result.Items || []).map((pullout: any) => {
      const name = pullout.studentName?.toLowerCase().trim();
      
      // Try exact match first
      let rosterEntry = rosterMap.get(name);
      
      // If no exact match, try partial match (e.g., "Iker" matches "Iker Soto Perez")
      if (!rosterEntry && name) {
        rosterEntry = rosterItems.find((r: any) => {
          const rosterName = r.studentName?.toLowerCase().trim() || '';
          return rosterName.includes(name) || name.includes(rosterName) ||
                 rosterName.split(' ').some((part: string) => part === name) ||
                 name.split(' ').some((part: string) => rosterName.includes(part) && part.length > 2);
        });
      }

      return {
        ...pullout,
        homeroom: rosterEntry?.homeroom || 'Unassigned',
        studyHallTeacher: rosterEntry?.studyHallTeacher || 'Unassigned',
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

// Get the next school day (skips weekends)
function getNextSchoolDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 1);
  // Skip Saturday (6) and Sunday (0)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

// Ensure the default pullout date is a school day (not weekend)
function ensureSchoolDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

// POST: Create a pullout request
export async function POST(request: NextRequest) {
  try {
    const { studentName, studentId, pulloutDate, requestedBy, requestedByName, reason, teamId } = await request.json();

    if (!studentName || !pulloutDate || !requestedBy) {
      return NextResponse.json({ success: false, error: 'studentName, pulloutDate, and requestedBy are required' }, { status: 400 });
    }

    // Ensure the requested date is a school day
    let effectiveDate = ensureSchoolDay(pulloutDate);
    let bumped = false;
    let originalDate = effectiveDate;

    // Check if this student is already requested for the effective date
    const existingResult = await docClient.send(new ScanCommand({
      TableName: PULLOUTS_TABLE,
      FilterExpression: 'pulloutDate = :date AND studentName = :name',
      ExpressionAttributeValues: {
        ':date': effectiveDate,
        ':name': studentName,
      },
    }));

    if (existingResult.Items && existingResult.Items.length > 0) {
      // Student already requested — bump to next school day
      originalDate = effectiveDate;
      effectiveDate = getNextSchoolDay(effectiveDate);
      bumped = true;
    }

    const pullout = {
      pulloutId: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentName,
      studentId: studentId || '',
      pulloutDate: effectiveDate,
      requestedBy,
      requestedByName: requestedByName || '',
      reason: reason || '',
      teamId: teamId || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: PULLOUTS_TABLE, Item: pullout }));

    return NextResponse.json({
      success: true,
      pullout,
      bumped,
      originalDate: bumped ? originalDate : undefined,
      message: bumped
        ? `${studentName} was already requested for ${originalDate}. Reserved for the next school day (${effectiveDate}) instead.`
        : undefined,
    }, { status: 201 });
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
