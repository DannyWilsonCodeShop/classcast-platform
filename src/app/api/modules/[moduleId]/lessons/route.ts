import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const LESSONS_TABLE = 'classcast-module-lessons';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;

    // Fetch lessons ordered by orderIndex
    const result = await docClient.send(new QueryCommand({
      TableName: LESSONS_TABLE,
      IndexName: 'ModuleSubmissionIdIndex',
      KeyConditionExpression: 'moduleSubmissionId = :moduleId',
      ExpressionAttributeValues: { ':moduleId': moduleId },
      ScanIndexForward: true,
    }));

    const lessons = result.Items || [];

    // Get assignment to determine required video count
    const assignmentResult = await docClient.send(new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: moduleId },
    }));
    const requiredVideos = assignmentResult.Item?.moduleConfig?.requiredVideos || 5;

    return NextResponse.json({
      success: true,
      data: {
        lessons,
        progress: {
          totalRequired: requiredVideos,
          totalUploaded: lessons.length,
          readyToSubmit: lessons.length >= requiredVideos,
        },
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const { title, description, videoUrl, authorId, duration, orderIndex } = body;

    if (!title || !videoUrl || !authorId) {
      return NextResponse.json({ success: false, error: 'title, videoUrl, and authorId are required' }, { status: 400 });
    }

    const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const lesson = {
      lessonId,
      moduleSubmissionId: moduleId,
      title,
      description: description || '',
      videoUrl,
      authorId,
      orderIndex: orderIndex ?? 0,
      duration: duration || 0,
      createdAt: now,
    };

    await docClient.send(new PutCommand({ TableName: LESSONS_TABLE, Item: lesson }));

    return NextResponse.json({ success: true, data: { lesson } });
  } catch (error) {
    console.error('Error adding module lesson:', error);
    return NextResponse.json({ success: false, error: 'Failed to add lesson' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const authorId = searchParams.get('authorId');

    if (!lessonId || !authorId) {
      return NextResponse.json({ success: false, error: 'lessonId and authorId are required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await docClient.send(new GetCommand({
      TableName: LESSONS_TABLE,
      Key: { lessonId },
    }));

    if (!existing.Item) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    if (existing.Item.authorId !== authorId) {
      return NextResponse.json({ success: false, error: 'Only the uploader can delete this lesson' }, { status: 403 });
    }

    await docClient.send(new DeleteCommand({ TableName: LESSONS_TABLE, Key: { lessonId } }));

    return NextResponse.json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete lesson' }, { status: 500 });
  }
}
