import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);

const MODERATION_FLAGS_TABLE = process.env.MODERATION_FLAGS_TABLE || 'classcast-moderation-flags';

/**
 * POST - Create a moderation flag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentId,
      contentType, // 'peer-response', 'community-post', 'submission'
      content,
      authorId,
      authorName,
      courseId,
      assignmentId,
      flagReason,
      severity, // 'low', 'medium', 'high'
      categories, // Array of flagged categories
      moderationData // Full moderation result
    } = body;

    if (!contentId || !contentType || !content || !authorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const flagId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const flag = {
      flagId,
      contentId,
      contentType,
      content,
      authorId,
      authorName,
      courseId,
      assignmentId,
      flagReason,
      severity: severity || 'low',
      categories: categories || [],
      moderationData: moderationData || {},
      status: 'pending', // 'pending', 'approved', 'removed'
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: now,
      updatedAt: now
    };

    // Store in DynamoDB
    await dynamoDB.send(new PutCommand({
      TableName: MODERATION_FLAGS_TABLE,
      Item: flag
    }));

    console.log('✅ Moderation flag created:', flagId, severity, categories);

    return NextResponse.json({
      success: true,
      flagId,
      flag
    });

  } catch (error) {
    console.error('Error creating moderation flag:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create moderation flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get moderation flags
 * Query params:
 * - status: Filter by status (pending, approved, removed)
 * - courseId: Filter by course
 * - severity: Filter by severity
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const severity = searchParams.get('severity');

    // For now, scan all flags (in production, use GSI for better queries)
    const params: any = {
      TableName: MODERATION_FLAGS_TABLE
    };

    const result = await dynamoDB.send(new QueryCommand(params));
    let flags = result.Items || [];

    // Client-side filtering (move to DynamoDB query in production)
    if (status) {
      flags = flags.filter((f: any) => f.status === status);
    }
    if (courseId) {
      flags = flags.filter((f: any) => f.courseId === courseId);
    }
    if (severity) {
      flags = flags.filter((f: any) => f.severity === severity);
    }

    // Sort by creation date (newest first)
    flags.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      flags,
      count: flags.length
    });

  } catch (error) {
    console.error('Error fetching moderation flags:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch moderation flags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update moderation flag status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      flagId,
      status, // 'approved' or 'removed'
      reviewerId,
      reviewerName,
      reviewNotes
    } = body;

    if (!flagId || !status || !reviewerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await dynamoDB.send(new UpdateCommand({
      TableName: MODERATION_FLAGS_TABLE,
      Key: { flagId },
      UpdateExpression: 'SET #status = :status, reviewedBy = :reviewerId, reviewerName = :reviewerName, reviewedAt = :now, reviewNotes = :notes, updatedAt = :now',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':reviewerId': reviewerId,
        ':reviewerName': reviewerName,
        ':now': now,
        ':notes': reviewNotes || null
      }
    }));

    console.log('✅ Moderation flag updated:', flagId, status);

    return NextResponse.json({
      success: true,
      flagId,
      status
    });

  } catch (error) {
    console.error('Error updating moderation flag:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update moderation flag',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

