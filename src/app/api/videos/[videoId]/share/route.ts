import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const snsClient = new SNSClient({
  region: process.env.REGION || 'us-east-1',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { userId, shareType, recipientIds, message } = await request.json();
    const { videoId } = params;

    if (!userId || !shareType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, shareType' },
        { status: 400 }
      );
    }

    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Create share record
    const share = {
      shareId,
      videoId,
      userId,
      shareType, // 'internal' or 'external'
      recipientIds: recipientIds || [],
      message: message || '',
      createdAt: timestamp
    };

    const putCommand = new PutCommand({
      TableName: process.env.SHARES_TABLE_NAME || 'ClassCastShares',
      Item: share
    });

    await docClient.send(putCommand);

    // Send notifications for internal shares
    if (shareType === 'internal' && recipientIds && recipientIds.length > 0) {
      try {
        const notificationMessage = {
          type: 'video_shared',
          videoId,
          sharedBy: userId,
          message: message || 'A classmate shared a video with you!',
          videoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/mobile/assignment/${videoId}`,
          timestamp
        };

        // Send to each recipient
        for (const recipientId of recipientIds) {
          const publishCommand = new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: JSON.stringify(notificationMessage),
            MessageAttributes: {
              recipientId: {
                DataType: 'String',
                StringValue: recipientId
              },
              type: {
                DataType: 'String',
                StringValue: 'video_share'
              }
            }
          });

          await snsClient.send(publishCommand);
        }
      } catch (snsError) {
        console.error('Error sending SNS notification:', snsError);
        // Don't fail the request if notification fails
      }
    }

    // Generate shareable link for external shares
    let shareableLink = null;
    if (shareType === 'external') {
      shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/video/${videoId}`;
    }

    return NextResponse.json({
      success: true,
      share: {
        ...share,
        shareableLink
      }
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
