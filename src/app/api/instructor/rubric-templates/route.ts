import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = 'classcast-users';

/**
 * GET /api/instructor/rubric-templates?instructorId={id}
 * Returns the instructor's saved custom rubric templates (stored on user record)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    if (!instructorId) return NextResponse.json({ success: false, error: 'instructorId required' }, { status: 400 });

    const result = await docClient.send(new GetCommand({
      TableName: TABLE,
      Key: { userId: instructorId },
      ProjectionExpression: 'rubricTemplates',
    }));

    return NextResponse.json({
      success: true,
      data: { rubricTemplates: result.Item?.rubricTemplates || null },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching rubric templates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/rubric-templates
 * Saves an instructor's custom default rubric categories to their user record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instructorId, rubricTemplates } = body;

    if (!instructorId || !rubricTemplates) {
      return NextResponse.json({ success: false, error: 'instructorId and rubricTemplates required' }, { status: 400 });
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId: instructorId },
      UpdateExpression: 'SET rubricTemplates = :templates, rubricTemplatesUpdatedAt = :now',
      ExpressionAttributeValues: {
        ':templates': rubricTemplates,
        ':now': new Date().toISOString(),
      },
    }));

    return NextResponse.json({ success: true, message: 'Templates saved' });
  } catch (error) {
    console.error('Error saving rubric templates:', error);
    return NextResponse.json({ success: false, error: 'Failed to save templates' }, { status: 500 });
  }
}
