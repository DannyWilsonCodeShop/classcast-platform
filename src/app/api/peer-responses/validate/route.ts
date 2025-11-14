import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PEER_RESPONSES_TABLE = 'classcast-peer-responses';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      assignmentId, 
      videoId, 
      studentId, 
      content,
      assignment 
    } = body;

    // Validate response limits
    const validation = {
      canSubmit: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check if peer responses are enabled
    if (!assignment?.enablePeerResponses) {
      validation.canSubmit = false;
      validation.errors.push('Peer responses are not enabled for this assignment');
      return NextResponse.json({ validation });
    }

    // Check if response is within due date
    if (assignment.responseDueDate) {
      const now = new Date();
      const responseDueDate = new Date(assignment.responseDueDate);
      
      if (now > responseDueDate) {
        validation.canSubmit = false;
        validation.errors.push('Response due date has passed');
        return NextResponse.json({ validation });
      }
    }

    // Check word count
    if (assignment.responseWordLimit) {
      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount < assignment.responseWordLimit) {
        validation.canSubmit = false;
        validation.errors.push(`Response must be at least ${assignment.responseWordLimit} words (currently ${wordCount})`);
      }
    }

    // Check character count
    if (assignment.responseCharacterLimit) {
      const characterCount = content.length;
      if (characterCount > assignment.responseCharacterLimit) {
        validation.canSubmit = false;
        validation.errors.push(`Response must be no more than ${assignment.responseCharacterLimit} characters (currently ${characterCount})`);
      }
    }

    // Check if student has reached minimum responses required
    if (assignment.minResponsesRequired) {
      const studentResponseCount = await getStudentResponseCount(assignmentId, studentId);
      
      if (studentResponseCount >= assignment.minResponsesRequired) {
        validation.warnings.push(`You have already submitted ${studentResponseCount} responses (minimum required: ${assignment.minResponsesRequired})`);
      }
    }

    // Check if video has reached maximum responses
    if (assignment.maxResponsesPerVideo) {
      const videoResponseCount = await getVideoResponseCount(videoId);
      
      if (videoResponseCount >= assignment.maxResponsesPerVideo) {
        validation.canSubmit = false;
        validation.errors.push(`This video has reached the maximum number of responses (${assignment.maxResponsesPerVideo})`);
      }
    }

    return NextResponse.json({ validation });

  } catch (error) {
    console.error('Error validating peer response:', error);
    return NextResponse.json(
      { error: 'Failed to validate peer response' },
      { status: 500 }
    );
  }
}

// Real database functions
async function getStudentResponseCount(assignmentId: string, studentId: string): Promise<number> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: PEER_RESPONSES_TABLE,
      FilterExpression: 'assignmentId = :assignmentId AND studentId = :studentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId,
        ':studentId': studentId
      }
    }));
    
    return result.Items?.length || 0;
  } catch (dbError: any) {
    if (dbError.name === 'ResourceNotFoundException') {
      return 0; // Table doesn't exist yet
    }
    throw dbError;
  }
}

async function getVideoResponseCount(videoId: string): Promise<number> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: PEER_RESPONSES_TABLE,
      FilterExpression: 'videoId = :videoId',
      ExpressionAttributeValues: {
        ':videoId': videoId
      }
    }));
    
    return result.Items?.length || 0;
  } catch (dbError: any) {
    if (dbError.name === 'ResourceNotFoundException') {
      return 0; // Table doesn't exist yet
    }
    throw dbError;
  }
}