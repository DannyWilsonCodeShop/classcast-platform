import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const LESSON_VIDEOS_TABLE = process.env.DYNAMODB_LESSON_VIDEOS_TABLE || 'LessonVideos';

// DELETE - Remove a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; lessonId: string }> }
) {
  try {
    const { moduleId, lessonId } = await params;

    await docClient.send(new DeleteCommand({
      TableName: LESSON_VIDEOS_TABLE,
      Key: { moduleId, lessonId },
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; lessonId: string }> }
) {
  try {
    const { moduleId, lessonId } = await params;
    const body = await request.json();
    const { title, description, videoUrl, content, type, quiz, order } = body;

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };

    if (title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionNames['#title'] = 'title';
      expressionValues[':title'] = title;
    }
    if (description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionNames['#description'] = 'description';
      expressionValues[':description'] = description;
    }
    if (videoUrl !== undefined) {
      updateExpressions.push('videoUrl = :videoUrl');
      expressionValues[':videoUrl'] = videoUrl;
    }
    if (content !== undefined) {
      updateExpressions.push('content = :content');
      expressionValues[':content'] = content;
    }
    if (type !== undefined) {
      updateExpressions.push('#type = :type');
      expressionNames['#type'] = 'type';
      expressionValues[':type'] = type;
    }
    if (quiz !== undefined) {
      updateExpressions.push('quiz = :quiz');
      expressionValues[':quiz'] = quiz;
    }
    if (order !== undefined) {
      updateExpressions.push('#order = :order');
      expressionNames['#order'] = 'order';
      expressionValues[':order'] = order;
    }

    await docClient.send(new UpdateCommand({
      TableName: LESSON_VIDEOS_TABLE,
      Key: { moduleId, lessonId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}
