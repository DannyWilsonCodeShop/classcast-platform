import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BANKS_TABLE = 'classcast-problem-banks';
const PROBLEMS_TABLE = 'classcast-problems';

export async function POST(request: NextRequest, { params }: { params: { bankId: string } }) {
  try {
    const { bankId } = params;

    // Fetch original bank
    const bankResult = await docClient.send(new GetCommand({
      TableName: BANKS_TABLE,
      Key: { bankId },
    }));
    if (!bankResult.Item) {
      return NextResponse.json({ success: false, error: 'Problem bank not found' }, { status: 404 });
    }

    const originalBank = bankResult.Item;

    // Fetch original problems
    const problemsResult = await docClient.send(new QueryCommand({
      TableName: PROBLEMS_TABLE,
      IndexName: 'bankId-index',
      KeyConditionExpression: 'bankId = :bankId',
      ExpressionAttributeValues: { ':bankId': bankId },
      ScanIndexForward: true,
    }));
    const originalProblems = problemsResult.Items || [];

    // Create new bank
    const newBankId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newBank = {
      bankId: newBankId,
      instructorId: originalBank.instructorId,
      courseId: originalBank.courseId,
      title: `${originalBank.title} (Copy)`,
      description: originalBank.description || '',
      problemCount: originalProblems.length,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: BANKS_TABLE, Item: newBank }));

    // Duplicate problems with new IDs
    const newProblems = originalProblems.map((p: any, idx: number) => ({
      problemId: `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idx}`,
      bankId: newBankId,
      content: p.content || '',
      imageUrl: p.imageUrl || null,
      orderIndex: p.orderIndex ?? idx,
      createdAt: now,
    }));

    for (let i = 0; i < newProblems.length; i += 25) {
      const batch = newProblems.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: { [PROBLEMS_TABLE]: batch.map(item => ({ PutRequest: { Item: item } })) },
      }));
    }

    return NextResponse.json({
      success: true,
      data: { bank: newBank, problemCount: newProblems.length },
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating problem bank:', error);
    return NextResponse.json({ success: false, error: 'Failed to duplicate bank' }, { status: 500 });
  }
}
