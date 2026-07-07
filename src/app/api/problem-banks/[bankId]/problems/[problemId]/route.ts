import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BANKS_TABLE = 'classcast-problem-banks';
const PROBLEMS_TABLE = 'classcast-problems';

export async function PUT(request: NextRequest, { params }: { params: { bankId: string; problemId: string } }) {
  try {
    const { problemId } = params;
    const body = await request.json();
    const { content, imageUrl } = body;

    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = {};

    if (content !== undefined) {
      updateExpressions.push('content = :content');
      expressionValues[':content'] = content;
    }
    if (imageUrl !== undefined) {
      updateExpressions.push('imageUrl = :imageUrl');
      expressionValues[':imageUrl'] = imageUrl;
    }

    if (updateExpressions.length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    await docClient.send(new UpdateCommand({
      TableName: PROBLEMS_TABLE,
      Key: { problemId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
    }));

    return NextResponse.json({ success: true, message: 'Problem updated' });
  } catch (error) {
    console.error('Error updating problem:', error);
    return NextResponse.json({ success: false, error: 'Failed to update problem' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { bankId: string; problemId: string } }) {
  try {
    const { bankId, problemId } = params;
    const now = new Date().toISOString();

    // Delete the problem
    await docClient.send(new DeleteCommand({
      TableName: PROBLEMS_TABLE,
      Key: { problemId },
    }));

    // Decrement problem count on bank
    await docClient.send(new UpdateCommand({
      TableName: BANKS_TABLE,
      Key: { bankId },
      UpdateExpression: 'SET problemCount = problemCount - :one, updatedAt = :now',
      ExpressionAttributeValues: { ':one': 1, ':now': now },
    }));

    return NextResponse.json({ success: true, message: 'Problem deleted' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete problem' }, { status: 500 });
  }
}
