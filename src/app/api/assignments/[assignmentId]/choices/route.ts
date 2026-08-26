import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

// GET: Get slot counts for each choice in an assignment (per section)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    // Get all submissions for this assignment that have a choiceId
    const result = await docClient.send(new QueryCommand({
      TableName: SUBMISSIONS_TABLE,
      IndexName: 'assignmentId-index',
      KeyConditionExpression: 'assignmentId = :aid',
      ExpressionAttributeValues: { ':aid': assignmentId },
    }));

    const submissions = result.Items || [];

    // Count submissions per choice (optionally filtered by section)
    const slotCounts: Record<string, number> = {};
    for (const sub of submissions) {
      if (!sub.choiceId) continue;
      // If sectionId filter provided, only count submissions from that section
      if (sectionId && sub.sectionId !== sectionId) continue;
      slotCounts[sub.choiceId] = (slotCounts[sub.choiceId] || 0) + 1;
    }

    return NextResponse.json({ success: true, slotCounts });
  } catch (error) {
    console.error('Error fetching choice slots:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch slots' }, { status: 500 });
  }
}
