import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

// PUT: Update submission thumbnail URL
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const { thumbnailUrl } = await request.json();

    if (!submissionId || !thumbnailUrl) {
      return NextResponse.json({ success: false, error: 'submissionId and thumbnailUrl required' }, { status: 400 });
    }

    await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId },
      UpdateExpression: 'SET thumbnailUrl = :url',
      ExpressionAttributeValues: { ':url': thumbnailUrl },
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    return NextResponse.json({ success: false, error: 'Failed to update thumbnail' }, { status: 500 });
  }
}
