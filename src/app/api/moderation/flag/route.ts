import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
      moderationData, // Full moderation result
      isAnonymous, // Whether the report is anonymous
      reporterId // ID of the reporter (omitted if anonymous)
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
      isAnonymous: isAnonymous || false,
      // Don't store reporterId if anonymous
      ...(isAnonymous ? {} : { reporterId }),
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

    // Auto-suspend: If this content has 2+ reports, suspend it automatically
    let autoSuspended = false;
    try {
      const existingFlags = await dynamoDB.send(new ScanCommand({
        TableName: MODERATION_FLAGS_TABLE,
        FilterExpression: 'contentId = :cid AND #s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':cid': contentId, ':pending': 'pending' }
      }));

      const flagCount = (existingFlags.Items || []).length;
      console.log(`📊 Content ${contentId} now has ${flagCount} pending reports`);

      if (flagCount >= 2 && contentType === 'submission') {
        // Suspend the submission by marking it as hidden
        await dynamoDB.send(new UpdateCommand({
          TableName: 'classcast-submissions',
          Key: { submissionId: contentId },
          UpdateExpression: 'SET hidden = :hidden, suspendedAt = :now, suspendReason = :reason, updatedAt = :now',
          ExpressionAttributeValues: {
            ':hidden': true,
            ':now': now,
            ':reason': `Auto-suspended: ${flagCount} reports received`,
          }
        }));
        autoSuspended = true;
        console.log(`🚫 Auto-suspended submission ${contentId} — ${flagCount} reports`);
      }
    } catch (suspendError) {
      console.warn('Auto-suspend check failed (non-critical):', suspendError);
    }

    return NextResponse.json({
      success: true,
      flagId,
      flag,
      autoSuspended
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

    // Scan all flags (use ScanCommand for getting all items)
    const params: any = {
      TableName: MODERATION_FLAGS_TABLE
    };

    const result = await dynamoDB.send(new ScanCommand(params));
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

    // If approved (content is OK), un-suspend the submission
    if (status === 'approved') {
      try {
        // Get the flag to find the contentId
        const flagResult = await dynamoDB.send(new ScanCommand({
          TableName: MODERATION_FLAGS_TABLE,
          FilterExpression: 'flagId = :fid',
          ExpressionAttributeValues: { ':fid': flagId }
        }));
        const flagItem = flagResult.Items?.[0];
        
        if (flagItem && flagItem.contentType === 'submission' && flagItem.contentId) {
          await dynamoDB.send(new UpdateCommand({
            TableName: 'classcast-submissions',
            Key: { submissionId: flagItem.contentId },
            UpdateExpression: 'SET hidden = :hidden, suspendedAt = :null, suspendReason = :null, updatedAt = :now',
            ExpressionAttributeValues: {
              ':hidden': false,
              ':null': null,
              ':now': now,
            }
          }));
          console.log(`✅ Submission ${flagItem.contentId} un-suspended (approved by moderator)`);
        }
      } catch (unsuspendError) {
        console.warn('Failed to un-suspend submission:', unsuspendError);
      }
    }

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

