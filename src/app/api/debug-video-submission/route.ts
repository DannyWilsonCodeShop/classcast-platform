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
    console.log('Debug video submission - received body:', body);
    
    const {
      assignmentId,
      studentId,
      courseId,
      videoUrl,
      videoTitle
    } = body;

    console.log('Debug video submission - extracted fields:', { assignmentId, studentId, courseId, videoUrl, videoTitle });

    if (!assignmentId || !studentId || !courseId || !videoUrl) {
      console.log('Debug video submission - missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: assignmentId, studentId, courseId, videoUrl'
      }, { status: 400 });
    }

    const submissionId = `debug_submission_${Date.now()}`;
    const now = new Date().toISOString();

    const submission = {
      submissionId,
      assignmentId: assignmentId || 'debug-assignment',
      studentId: studentId || 'debug-student',
      courseId: courseId || 'debug-course',
      videoUrl: videoUrl || 'debug-url',
      videoId: null,
      videoTitle: videoTitle || 'Debug Video',
      videoDescription: 'Debug Description',
      duration: 0,
      fileName: 'debug.webm',
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

    console.log('Debug video submission - attempting to put submission:', submission);

    const putCommand = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });

    const result = await docClient.send(putCommand);
    console.log('Debug video submission - putCommand result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Debug video submission created successfully',
      submission,
      result
    });

  } catch (error) {
    console.error('Debug video submission error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
