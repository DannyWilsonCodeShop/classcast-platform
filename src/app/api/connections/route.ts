import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CONNECTIONS_TABLE = 'classcast-connections';

// GET /api/connections - Get user's connections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all connections where user is either requester or requested
    const result = await docClient.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'requesterId = :userId OR requestedId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const connections = result.Items || [];
    
    return NextResponse.json({
      success: true,
      connections
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch connections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/connections - Create or update connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requesterId, requestedId, status } = body;

    if (!requesterId || !requestedId) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (requesterId === requestedId) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const getResult = await docClient.send(new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { 
        connectionId: `${requesterId}_${requestedId}` 
      }
    }));

    const now = new Date().toISOString();

    if (getResult.Item) {
      // Update existing connection
      await docClient.send(new UpdateCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId: `${requesterId}_${requestedId}` },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status || 'pending',
          ':updatedAt': now
        }
      }));

      // Create notification when study buddy request is accepted
      if (status === 'accepted') {
        try {
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: requesterId, // Notify the original requester
              senderId: requestedId,
              senderName: body.accepterName || 'Your classmate',
              type: 'study_buddy_accepted',
              title: '🎉 Study Buddy Request Accepted!',
              message: `${body.accepterName || 'Your classmate'} accepted your study buddy request!`,
              relatedId: `${requesterId}_${requestedId}`,
              relatedType: 'connection',
              priority: 'medium',
              actionUrl: `/student/profile/${requestedId}`
            })
          });

          if (notificationResponse.ok) {
            console.log('✅ Study buddy acceptance notification created');
          } else {
            console.error('❌ Failed to create study buddy acceptance notification');
          }
        } catch (notifError) {
          console.error('❌ Error creating study buddy acceptance notification:', notifError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Connection updated',
        connection: {
          ...getResult.Item,
          status: status || 'pending',
          updatedAt: now
        }
      });
    } else {
      // Create new connection
      const connection = {
        connectionId: `${requesterId}_${requestedId}`,
        requesterId,
        requestedId,
        status: status || 'pending',
        createdAt: now,
        updatedAt: now
      };

      await docClient.send(new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: connection
      }));

      // Create notification for the requested user about the study buddy request
      try {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: requestedId,
            senderId: requesterId,
            senderName: body.requesterName || 'A classmate',
            type: 'study_buddy_request',
            title: '👥 New Study Buddy Request',
            message: `${body.requesterName || 'A classmate'} wants to connect as your study buddy!`,
            relatedId: connection.connectionId,
            relatedType: 'connection',
            priority: 'medium',
            actionUrl: `/student/profile/${requesterId}`
          })
        });

        if (notificationResponse.ok) {
          console.log('✅ Study buddy request notification created');
        } else {
          console.error('❌ Failed to create study buddy request notification');
        }
      } catch (notifError) {
        console.error('❌ Error creating study buddy request notification:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: 'Connection created',
        connection
      });
    }

  } catch (error) {
    console.error('Error creating/updating connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/update connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

