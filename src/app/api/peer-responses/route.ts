import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const videoId = searchParams.get('videoId');

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams: any = {
      TableName: 'classcast-peer-responses',
      IndexName: 'assignment-index',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    };

    // Add filters if provided
    if (studentId) {
      queryParams.FilterExpression = 'reviewerId = :studentId';
      queryParams.ExpressionAttributeValues[':studentId'] = studentId;
    }

    if (videoId) {
      if (queryParams.FilterExpression) {
        queryParams.FilterExpression += ' AND videoId = :videoId';
      } else {
        queryParams.FilterExpression = 'videoId = :videoId';
      }
      queryParams.ExpressionAttributeValues[':videoId'] = videoId;
    }

    const result = await dynamodbService.query(queryParams);
    const responses = result.Items || [];

    // Fetch replies for each response to build threaded conversations
    const responsesWithReplies = await Promise.all(
      responses.map(async (response: any) => {
        if (response.replies && response.replies.length > 0) {
          // Fetch each reply
          const replyPromises = response.replies.map(async (replyId: string) => {
            try {
              const replyResult = await dynamodbService.getItem(
                'classcast-peer-responses',
                { responseId: replyId }
              );
              return replyResult.Item;
            } catch (error) {
              console.error(`Error fetching reply ${replyId}:`, error);
              return null;
            }
          });
          
          const fetchedReplies = await Promise.all(replyPromises);
          return {
            ...response,
            replies: fetchedReplies.filter(r => r !== null)
          };
        }
        return response;
      })
    );

    return NextResponse.json({
      success: true,
      data: responsesWithReplies,
      count: result.Count || 0
    });
  } catch (error) {
    console.error('Error fetching peer responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch peer responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reviewerId,
      reviewerName,
      videoId,
      assignmentId,
      content,
      isSubmitted = false
    } = body;

    if (!reviewerId || !videoId || !assignmentId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const responseId = `response_${videoId}_${reviewerId}_${Date.now()}`;
    const now = new Date().toISOString();

    const peerResponse = {
      id: responseId,
      responseId: responseId,
      reviewerId,
      reviewerName,
      videoId,
      assignmentId,
      content: content.trim(),
      wordCount: content.trim().split(/\s+/).length,
      characterCount: content.length,
      isSubmitted,
      submittedAt: now,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
      threadLevel: 0,
      replies: []
    };

    await dynamodbService.putItem('classcast-peer-responses', peerResponse);

    return NextResponse.json({
      success: true,
      data: peerResponse,
      message: isSubmitted ? 'Response submitted successfully' : 'Response saved as draft'
    });
  } catch (error) {
    console.error('Error creating peer response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create peer response' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      content,
      isSubmitted = false
    } = body;

    if (!id || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const updateExpression = 'SET content = :content, wordCount = :wordCount, characterCount = :characterCount, isSubmitted = :isSubmitted, lastSavedAt = :lastSavedAt, updatedAt = :updatedAt';
    
    if (isSubmitted) {
      updateExpression += ', submittedAt = :submittedAt';
    }

    const expressionAttributeValues: any = {
      ':content': content.trim(),
      ':wordCount': content.trim().split(/\s+/).length,
      ':characterCount': content.length,
      ':isSubmitted': isSubmitted,
      ':lastSavedAt': now,
      ':updatedAt': now
    };

    if (isSubmitted) {
      expressionAttributeValues[':submittedAt'] = now;
    }

    await dynamodbService.updateItem(
      'classcast-peer-responses',
      { id },
      updateExpression,
      expressionAttributeValues
    );

    return NextResponse.json({
      success: true,
      message: isSubmitted ? 'Response submitted successfully' : 'Response updated successfully'
    });
  } catch (error) {
    console.error('Error updating peer response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update peer response' },
      { status: 500 }
    );
  }
}
