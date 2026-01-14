import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const LESSON_MODULES_TABLE = process.env.DYNAMODB_LESSON_MODULES_TABLE || 'LessonModules';

// GET - Get single module
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;

    const command = new GetCommand({
      TableName: LESSON_MODULES_TABLE,
      Key: { moduleId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: response.Item,
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}

// PUT - Update module
export async function PUT(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const body = await request.json();
    const { title, description, introVideoUrl, thumbnail, status } = body;

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
    }

    if (description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (introVideoUrl !== undefined) {
      updateExpressions.push('#introVideoUrl = :introVideoUrl');
      expressionAttributeNames['#introVideoUrl'] = 'introVideoUrl';
      expressionAttributeValues[':introVideoUrl'] = introVideoUrl;
    }

    if (thumbnail !== undefined) {
      updateExpressions.push('#thumbnail = :thumbnail');
      expressionAttributeNames['#thumbnail'] = 'thumbnail';
      expressionAttributeValues[':thumbnail'] = thumbnail;
    }

    if (status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: LESSON_MODULES_TABLE,
      Key: { moduleId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);

    return NextResponse.json({
      success: true,
      module: response.Attributes,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update module' },
      { status: 500 }
    );
  }
}

// DELETE - Delete module
export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;

    const command = new DeleteCommand({
      TableName: LESSON_MODULES_TABLE,
      Key: { moduleId },
    });

    await docClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}
