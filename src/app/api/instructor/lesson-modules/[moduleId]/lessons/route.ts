import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const LESSON_VIDEOS_TABLE = process.env.DYNAMODB_LESSON_VIDEOS_TABLE || 'LessonVideos';
const LESSON_MODULES_TABLE = process.env.DYNAMODB_LESSON_MODULES_TABLE || 'LessonModules';

// GET - List all lessons for a module
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;

    const command = new QueryCommand({
      TableName: LESSON_VIDEOS_TABLE,
      KeyConditionExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':moduleId': moduleId,
      },
    });

    const response = await docClient.send(command);
    const lessons = response.Items || [];

    // Sort by order
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST - Create new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const body = await request.json();
    const { title, description, videoUrl, duration, type, content, quiz } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get current lesson count to determine order
    const queryCommand = new QueryCommand({
      TableName: LESSON_VIDEOS_TABLE,
      KeyConditionExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':moduleId': moduleId,
      },
      Select: 'COUNT',
    });

    const countResponse = await docClient.send(queryCommand);
    const order = (countResponse.Count || 0) + 1;

    const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const lesson: any = {
      lessonId,
      moduleId,
      title,
      description: description || '',
      type: type || 'video',
      videoUrl: videoUrl || '',
      content: content || '',
      duration: duration || 0,
      order,
      quiz: quiz || null,
      createdAt: now,
    };

    const putCommand = new PutCommand({
      TableName: LESSON_VIDEOS_TABLE,
      Item: lesson,
    });

    await docClient.send(putCommand);

    // Update module lesson count
    const updateModuleCommand = new UpdateCommand({
      TableName: LESSON_MODULES_TABLE,
      Key: { moduleId },
      UpdateExpression: 'SET lessonCount = if_not_exists(lessonCount, :zero) + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': now,
      },
    });

    try {
      await docClient.send(updateModuleCommand);
    } catch (updateErr) {
      // Module may not exist in LessonModules table if using assignmentId as moduleId
      console.warn('Could not update module lessonCount:', updateErr);
    }

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
