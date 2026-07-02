import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const INTERACTIONS_TABLE = 'classcast-video-interactions';

// DELETE /api/videos/[videoId]/interactions/[interactionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string; interactionId: string }> }
) {
  try {
    const { videoId, interactionId } = await params;

    if (!interactionId) {
      return NextResponse.json({ success: false, error: 'Interaction ID required' }, { status: 400 });
    }

    // Delete the interaction
    await docClient.send(new DeleteCommand({
      TableName: INTERACTIONS_TABLE,
      Key: { id: interactionId },
    }));

    return NextResponse.json({ success: true, message: 'Interaction deleted' });
  } catch (error: any) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete interaction', details: error.message },
      { status: 500 }
    );
  }
}
