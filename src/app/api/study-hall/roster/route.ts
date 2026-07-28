import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ROSTER_TABLE = 'classcast-study-hall-roster';

// GET: Fetch the full roster
export async function GET(request: NextRequest) {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: ROSTER_TABLE }));
    return NextResponse.json({ success: true, roster: result.Items || [] });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch roster' }, { status: 500 });
  }
}

// POST: Upload/replace the roster (from spreadsheet parse)
// Expects: { entries: [{ studentName, homeroom, studyHallTeacher }] }
export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ success: false, error: 'entries array is required' }, { status: 400 });
    }

    // Write entries in batches of 25
    const records = entries.map((entry: any, idx: number) => ({
      rosterId: `roster_${Date.now()}_${idx}`,
      studentName: entry.studentName || entry.name || '',
      homeroom: entry.homeroom || entry.homeroomTeacher || '',
      studyHallTeacher: entry.studyHallTeacher || entry.studyHall || '',
      grade: entry.grade || '',
      createdAt: new Date().toISOString(),
    }));

    for (let i = 0; i < records.length; i += 25) {
      const batch = records.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [ROSTER_TABLE]: batch.map(item => ({ PutRequest: { Item: item } }))
        }
      }));
    }

    return NextResponse.json({ success: true, count: records.length }, { status: 201 });
  } catch (error) {
    console.error('Error uploading roster:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload roster' }, { status: 500 });
  }
}
