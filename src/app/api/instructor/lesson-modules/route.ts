import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const LESSON_MODULES_TABLE = process.env.DYNAMODB_LESSON_MODULES_TABLE || 'LessonModules';

// GET - List all lesson modules for instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const courseId = searchParams.get('courseId');

    let command;
    
    if (courseId) {
      // Query by course
      command = new QueryCommand({
        TableName: LESSON_MODULES_TABLE,
        IndexName: 'CourseIdIndex',
        KeyConditionExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId,
        },
      });
    } else {
      // Scan all modules (in production, use GSI for instructor)
      command = new ScanCommand({
        TableName: LESSON_MODULES_TABLE,
      });
    }

    const response = await docClient.send(command);
    const modules = response.Items || [];

    return NextResponse.json({
      success: true,
      modules: modules.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error) {
    console.error('Error fetching lesson modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson modules' },
      { status: 500 }
    );
  }
}

// POST - Create new lesson module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, courseId, introVideoUrl, thumbnail } = body;

    if (!title || !description || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const moduleId = `module_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const module = {
      moduleId,
      courseId,
      instructorId: 'current-instructor', // In production, get from auth
      title,
      description,
      thumbnail: thumbnail || '',
      introVideoUrl: introVideoUrl || '',
      status: 'draft',
      lessonCount: 0,
      studentCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: LESSON_MODULES_TABLE,
      Item: module,
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      module,
    });
  } catch (error) {
    console.error('Error creating lesson module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson module' },
      { status: 500 }
    );
  }
}
