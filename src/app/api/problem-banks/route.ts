import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BANKS_TABLE = 'classcast-problem-banks';
const PROBLEMS_TABLE = 'classcast-problems';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    if (!instructorId) return NextResponse.json({ success: false, error: 'instructorId required' }, { status: 400 });

    const result = await docClient.send(new QueryCommand({
      TableName: BANKS_TABLE,
      IndexName: 'instructorId-index',
      KeyConditionExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: { ':instructorId': instructorId },
      ScanIndexForward: false,
    }));

    return NextResponse.json({ success: true, data: { banks: result.Items || [] } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching problem banks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch banks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, courseId, instructorId, problems } = body;

    if (!title || !instructorId || !problems || !Array.isArray(problems)) {
      return NextResponse.json({ success: false, error: 'title, instructorId, and problems array are required' }, { status: 400 });
    }

    const bankId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create bank record
    const bank = { bankId, instructorId, courseId: courseId || '', title, description: description || '', problemCount: problems.length, createdAt: now, updatedAt: now };
    await docClient.send(new PutCommand({ TableName: BANKS_TABLE, Item: bank }));

    // Batch write problems (DynamoDB max 25 per batch)
    const problemRecords = problems.map((p: any, idx: number) => ({
      problemId: `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idx}`,
      bankId,
      content: p.content || '',
      imageUrl: p.imageUrl || null,
      orderIndex: idx,
      createdAt: now,
    }));

    // Write in batches of 25
    for (let i = 0; i < problemRecords.length; i += 25) {
      const batch = problemRecords.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: { [PROBLEMS_TABLE]: batch.map(item => ({ PutRequest: { Item: item } })) }
      }));
    }

    return NextResponse.json({ success: true, data: { bank, problemIds: problemRecords.map(p => p.problemId) } }, { status: 201 });
  } catch (error) {
    console.error('Error creating problem bank:', error);
    return NextResponse.json({ success: false, error: 'Failed to create bank' }, { status: 500 });
  }
}
