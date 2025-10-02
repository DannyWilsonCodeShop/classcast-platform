import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      studentId,
      courseId,
      videoUrl,
      videoTitle
    } = body;

    console.log('Test video submission data:', { assignmentId, studentId, courseId, videoUrl, videoTitle });

    const submissionId = `test_submission_${Date.now()}`;
    const now = new Date().toISOString();

    const submission = {
      submissionId,
      assignmentId: assignmentId || 'test-assignment',
      studentId: studentId || 'test-student',
      courseId: courseId || 'test-course',
      videoUrl: videoUrl || 'test-url',
      videoId: null,
      videoTitle: videoTitle || 'Test Video',
      videoDescription: 'Test Description',
      duration: 0,
      fileName: 'test.webm',
      fileSize: 0,
      fileType: 'video/webm',
      isRecorded: false,
      isUploaded: false,
      isLocalStorage: false,
      status: 'submitted',
      grade: null,
      instructorFeedback: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      gradedAt: null
    };

    console.log('Attempting to put submission:', submission);

    const putCommand = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });

    const result = await docClient.send(putCommand);
    console.log('PutCommand result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Test video submission created successfully',
      submission,
      result
    });

  } catch (error) {
    console.error('Test video submission error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
