import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

// GET: Find all submissions that have a videoUrl but no thumbnailUrl
export async function GET(request: NextRequest) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'attribute_exists(videoUrl) AND (attribute_not_exists(thumbnailUrl) OR thumbnailUrl = :empty)',
      ExpressionAttributeValues: { ':empty': '' },
      ProjectionExpression: 'submissionId, videoUrl, thumbnailUrl, studentId',
    }));

    const submissions = (result.Items || []).map(item => ({
      submissionId: item.submissionId,
      videoUrl: item.videoUrl,
      thumbnailUrl: item.thumbnailUrl || null,
      studentId: item.studentId,
    }));

    return NextResponse.json({ success: true, submissions, total: submissions.length });
  } catch (error) {
    console.error('Error fetching missing thumbnails:', error);
    return NextResponse.json({ success: false, error: 'Failed to scan submissions' }, { status: 500 });
  }
}
