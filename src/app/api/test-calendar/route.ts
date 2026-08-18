import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE = 'classcast-test-calendar';

// GET: Fetch tests for a month (or specific date)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // specific date YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM

    if (date) {
      // Query by specific date using GSI
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE,
        IndexName: 'testDate-index',
        KeyConditionExpression: 'testDate = :date',
        ExpressionAttributeValues: { ':date': date },
      }));
      return NextResponse.json({ success: true, tests: result.Items || [] });
    }

    if (month) {
      // Scan with filter for the month (YYYY-MM prefix)
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(testDate, :month)',
        ExpressionAttributeValues: { ':month': month },
      }));
      return NextResponse.json({ success: true, tests: result.Items || [] });
    }

    // Default: return all (for small datasets)
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    return NextResponse.json({ success: true, tests: result.Items || [] });
  } catch (error) {
    console.error('Error fetching test calendar:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tests' }, { status: 500 });
  }
}

// POST: Add a test to the calendar
export async function POST(request: NextRequest) {
  try {
    const { teacherName, subject, testType, testDate } = await request.json();

    if (!teacherName || !subject || !testType || !testDate) {
      return NextResponse.json({ success: false, error: 'teacherName, subject, testType, and testDate are required' }, { status: 400 });
    }

    // Check how many tests already exist on this date
    const existingResult = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'testDate-index',
      KeyConditionExpression: 'testDate = :date',
      ExpressionAttributeValues: { ':date': testDate },
    }));

    const existingTests = existingResult.Items || [];
    const count = existingTests.length;

    // Block if already 2 tests on this day
    if (count >= 2) {
      // Find next available day with fewer than 2 tests
      const suggestedDate = await findNextAvailableDay(testDate);
      return NextResponse.json({
        success: false,
        error: 'This day already has 2 assessments scheduled. Students should not have more than 2 tests on the same day.',
        blocked: true,
        existingTests: existingTests.map(t => ({ teacherName: t.teacherName, subject: t.subject, testType: t.testType })),
        suggestedDate,
      }, { status: 409 });
    }

    // Create the entry
    const entry = {
      entryId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      teacherName,
      subject,
      testType, // 'summative' or 'formative'
      testDate, // YYYY-MM-DD
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLE, Item: entry }));

    return NextResponse.json({
      success: true,
      entry,
      warning: count === 1 ? `There is already 1 assessment on ${testDate}. This will be the 2nd (maximum).` : undefined,
      existingTests: count > 0 ? existingTests.map(t => ({ teacherName: t.teacherName, subject: t.subject, testType: t.testType })) : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding test:', error);
    return NextResponse.json({ success: false, error: 'Failed to add test' }, { status: 500 });
  }
}

// DELETE: Remove a test from the calendar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ success: false, error: 'entryId is required' }, { status: 400 });
    }

    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { entryId } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete test' }, { status: 500 });
  }
}

// Helper: Find the next weekday with fewer than 2 tests
async function findNextAvailableDay(fromDate: string): Promise<string> {
  const date = new Date(fromDate + 'T12:00:00');
  
  for (let i = 1; i <= 30; i++) {
    date.setDate(date.getDate() + 1);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const candidate = date.toISOString().split('T')[0];
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'testDate-index',
      KeyConditionExpression: 'testDate = :date',
      ExpressionAttributeValues: { ':date': candidate },
      Select: 'COUNT',
    }));
    
    if ((result.Count || 0) < 2) {
      return candidate;
    }
  }
  
  // Fallback: return next weekday
  const fallback = new Date(fromDate + 'T12:00:00');
  fallback.setDate(fallback.getDate() + 1);
  while (fallback.getDay() === 0 || fallback.getDay() === 6) fallback.setDate(fallback.getDate() + 1);
  return fallback.toISOString().split('T')[0];
}
