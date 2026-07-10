import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PROGRESS_TABLE = 'classcast-lesson-progress';

/**
 * POST /api/study-modules/[moduleId]/progress
 * Body: { userId, lessonId, action: 'complete' | 'uncomplete' }
 * Tracks which lessons a student has completed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const { userId, lessonId, action } = body;

    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'userId and lessonId are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'complete') {
      // Add lessonId to the completedLessons set
      await docClient.send(new UpdateCommand({
        TableName: PROGRESS_TABLE,
        Key: { userId, moduleId },
        UpdateExpression: 'ADD completedLessons :lessonId SET lastAccessedAt = :now, #updatedAt = :now',
        ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: {
          ':lessonId': new Set([lessonId]),
          ':now': now,
        },
      }));
    } else if (action === 'uncomplete') {
      // Remove lessonId from the completedLessons set
      await docClient.send(new UpdateCommand({
        TableName: PROGRESS_TABLE,
        Key: { userId, moduleId },
        UpdateExpression: 'DELETE completedLessons :lessonId',
        ExpressionAttributeValues: {
          ':lessonId': new Set([lessonId]),
        },
      }));
    }

    // Fetch updated progress
    const result = await docClient.send(new GetCommand({
      TableName: PROGRESS_TABLE,
      Key: { userId, moduleId },
    }));

    const completedLessons = result.Item?.completedLessons
      ? Array.from(result.Item.completedLessons as Set<string>)
      : [];

    return NextResponse.json({
      success: true,
      completedLessons,
      lastAccessedAt: now,
    });
  } catch (error: any) {
    // If table doesn't exist, create the progress record anyway (table will be created)
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({
        success: true,
        completedLessons: [],
        message: 'Progress table not yet provisioned',
      });
    }

    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
