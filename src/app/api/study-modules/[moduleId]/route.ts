import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const LESSON_VIDEOS_TABLE = process.env.DYNAMODB_LESSON_VIDEOS_TABLE || 'LessonVideos';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const PROGRESS_TABLE = 'classcast-lesson-progress';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch the assignment (module) details
    let moduleTitle = 'Study Module';
    let moduleDescription = '';
    try {
      const aResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'assignmentId = :id',
        ExpressionAttributeValues: { ':id': moduleId },
      }));
      if (aResult.Items && aResult.Items.length > 0) {
        moduleTitle = aResult.Items[0].title || moduleTitle;
        moduleDescription = aResult.Items[0].description || '';
      }
    } catch {}

    // Fetch lessons for this module
    let lessons: any[] = [];
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: LESSON_VIDEOS_TABLE,
        KeyConditionExpression: 'moduleId = :moduleId',
        ExpressionAttributeValues: { ':moduleId': moduleId },
      }));
      lessons = result.Items || [];
    } catch (err: any) {
      // If table doesn't exist or query fails, try scan with filter
      if (err.name === 'ResourceNotFoundException') {
        lessons = [];
      } else {
        try {
          const result = await docClient.send(new ScanCommand({
            TableName: LESSON_VIDEOS_TABLE,
            FilterExpression: 'moduleId = :moduleId',
            ExpressionAttributeValues: { ':moduleId': moduleId },
          }));
          lessons = result.Items || [];
        } catch {
          lessons = [];
        }
      }
    }

    // Sort by order
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Fetch user progress if userId provided
    let completedLessonIds: string[] = [];
    if (userId) {
      try {
        const progressResult = await docClient.send(new GetCommand({
          TableName: PROGRESS_TABLE,
          Key: { userId, moduleId },
        }));
        if (progressResult.Item) {
          completedLessonIds = progressResult.Item.completedLessons || [];
        }
      } catch {
        // Progress table might not exist yet — that's fine
      }
    }

    // Build lesson list with completion and lock status
    const formattedLessons = lessons.map((lesson, index) => {
      const isCompleted = completedLessonIds.includes(lesson.lessonId);
      // A lesson is locked if the previous lesson is not completed (except the first)
      const previousCompleted = index === 0 || completedLessonIds.includes(lessons[index - 1]?.lessonId);
      const isLocked = !previousCompleted && !isCompleted;

      return {
        id: lesson.lessonId,
        moduleId: lesson.moduleId,
        title: lesson.title,
        description: lesson.description || '',
        type: lesson.type || 'video',
        order: lesson.order || index + 1,
        duration: lesson.duration ? `${lesson.duration} min` : undefined,
        videoUrl: lesson.videoUrl || '',
        content: lesson.content || '',
        quiz: lesson.quiz || null,
        isCompleted,
        isLocked,
      };
    });

    const completedCount = formattedLessons.filter(l => l.isCompleted).length;
    const totalCount = formattedLessons.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      success: true,
      module: {
        id: moduleId,
        title: moduleTitle,
        description: moduleDescription,
        totalLessons: totalCount,
        completedLessons: completedCount,
        progress,
        estimatedTime: `${totalCount * 10} min`,
        lessons: formattedLessons,
      },
    });
  } catch (error) {
    console.error('Error fetching study module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study module' },
      { status: 500 }
    );
  }
}
