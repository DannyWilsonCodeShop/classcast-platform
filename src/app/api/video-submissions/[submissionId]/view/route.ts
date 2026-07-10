import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * POST /api/video-submissions/[submissionId]/view
 * Increments the view count on a submission record.
 * Body: { userId?: string } (optional, for tracking unique views later)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID required' },
        { status: 400 }
      );
    }

    // Increment viewCount atomically
    const result = await docClient.send(new UpdateCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET viewCount = if_not_exists(viewCount, :zero) + :inc',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    }));

    const newViewCount = result.Attributes?.viewCount || 1;

    return NextResponse.json({
      success: true,
      viewCount: newViewCount,
    });
  } catch (error: any) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
