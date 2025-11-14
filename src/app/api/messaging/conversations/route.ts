import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const MESSAGES_TABLE = 'classcast-messages';

// GET /api/messaging/conversations - Get all conversations for a user
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

    // Get all messages where the user is involved
    const result = await docClient.send(new ScanCommand({
      TableName: MESSAGES_TABLE
    }));

    const allMessages = result.Items || [];
    
    // Group messages by conversation and determine the other participant
    const conversations = new Map<string, any>();
    
    allMessages.forEach((message) => {
      const isFromUser = message.fromUserId === userId;
      const isToUser = message.toUserId === userId;
      
      if (!isFromUser && !isToUser) return; // Not relevant to this user
      
      const otherUserId = isFromUser ? message.toUserId : message.fromUserId;
      const otherUserName = isFromUser ? message.toName : message.fromName;
      const otherUserAvatar = isFromUser ? message.toAvatar : message.fromAvatar;
      
      // Use a consistent key for the conversation
      const conversationKey = [userId, otherUserId].sort().join('_');
      
      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          userId: otherUserId,
          userName: otherUserName,
          userAvatar: otherUserAvatar,
          lastMessage: message.content,
          lastTimestamp: message.timestamp,
          unreadCount: 0
        });
      } else {
        const conversation = conversations.get(conversationKey);
        
        // Update if this is a more recent message
        if (new Date(message.timestamp) > new Date(conversation.lastTimestamp)) {
          conversation.lastMessage = message.content;
          conversation.lastTimestamp = message.timestamp;
        }
        
        // Count unread messages (messages to the user that aren't read)
        if (isToUser && !message.read) {
          conversation.unreadCount += 1;
        }
      }
    });

    // Convert map to array and sort by last message timestamp
    const conversationsArray = Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());

    return NextResponse.json({
      success: true,
      conversations: conversationsArray
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
