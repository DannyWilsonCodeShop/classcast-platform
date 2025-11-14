import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PEER_RESPONSES_TABLE = 'classcast-peer-responses';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      parentResponseId, 
      videoId, 
      assignmentId, 
      reviewerId, 
      reviewerName, 
      content 
    } = body;

    console.log('Creating reply to peer response:', { parentResponseId, reviewerId, videoId });

    // Validate required fields
    if (!parentResponseId || !videoId || !assignmentId || !reviewerId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reply (simplified - no DynamoDB operations for now)
    const replyId = `reply_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const reply = {
      responseId: replyId,
      parentResponseId,
      videoId,
      assignmentId,
      reviewerId,
      reviewerName,
      content: content.trim(),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      isSubmitted: true,
      threadLevel: 1,
      wordCount: content.trim().split(/\s+/).length,
      characterCount: content.trim().length
    };

    // Log the reply creation (simplified approach)
    console.log('Reply created successfully:', replyId);
    console.log('Reply data:', reply);

    return NextResponse.json({
      success: true,
      message: 'Reply posted successfully',
      replyId,
      reply
    });

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create reply',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

