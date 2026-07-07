import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BANKS_TABLE = 'classcast-problem-banks';
const PROBLEMS_TABLE = 'classcast-problems';

export async function POST(request: NextRequest, { params }: { params: { bankId: string } }) {
  try {
    const { bankId } = params;
    const body = await request.json();
    const { problems } = body;

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json({ success: false, error: 'problems array is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get current problem count for ordering
    const existingResult = await docClient.send(new QueryCommand({
      TableName: PROBLEMS_TABLE,
      IndexName: 'bankId-index',
      KeyConditionExpression: 'bankId = :bankId',
      ExpressionAttributeValues: { ':bankId': bankId },
      Select: 'COUNT',
    }));
    const startIndex = existingResult.Count || 0;

    // Add each problem
    const newProblems = [];
    for (let i = 0; i < problems.length; i++) {
      const problem = {
        problemId: `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
        bankId,
        content: problems[i].content || '',
        imageUrl: problems[i].imageUrl || null,
        orderIndex: startIndex + i,
        createdAt: now,
      };
      await docClient.send(new PutCommand({ TableName: PROBLEMS_TABLE, Item: problem }));
      newProblems.push(problem);
    }

    // Update bank problem count
    await docClient.send(new UpdateCommand({
      TableName: BANKS_TABLE,
      Key: { bankId },
      UpdateExpression: 'SET problemCount = problemCount + :count, updatedAt = :now',
      ExpressionAttributeValues: { ':count': problems.length, ':now': now },
    }));

    return NextResponse.json({ success: true, data: { problems: newProblems } }, { status: 201 });
  } catch (error) {
    console.error('Error adding problems:', error);
    return NextResponse.json({ success: false, error: 'Failed to add problems' }, { status: 500 });
  }
}
