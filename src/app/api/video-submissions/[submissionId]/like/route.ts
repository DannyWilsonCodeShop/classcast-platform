import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { submissionId } = params;
    const { action } = await request.json(); // 'like' or 'unlike'

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    // Get current submission to check likes
    const getResult = await docClient.send(new GetCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId }
    }));

    if (!getResult.Item) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const currentLikes = getResult.Item.likes || 0;
    const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    // Update likes count
    await docClient.send(new UpdateCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET likes = :likes',
      ExpressionAttributeValues: {
        ':likes': newLikes
      }
    }));

    return NextResponse.json({ 
      success: true, 
      likes: newLikes 
    });

  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
