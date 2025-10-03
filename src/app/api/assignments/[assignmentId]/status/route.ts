import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const { status, studentId } = await request.json();

    if (!assignmentId || !status) {
      return NextResponse.json(
        { error: 'Assignment ID and status are required' },
        { status: 400 }
      );
    }

    // Get current assignment to check if it exists
    const getCommand = new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId }
    });

    const assignment = await docClient.send(getCommand);
    
    if (!assignment.Item) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Update assignment status
    const updateCommand = new UpdateCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      message: 'Assignment status updated successfully',
      assignment: result.Attributes
    });

  } catch (error) {
    console.error('Error updating assignment status:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment status' },
      { status: 500 }
    );
  }
}
