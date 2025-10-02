import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
  // Remove explicit credentials to use IAM role
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// GET /api/video-submissions - Get video submissions for an assignment or student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    let submissions = [];

    if (assignmentId) {
      // Get submissions for a specific assignment
      const queryCommand = new QueryCommand({
        TableName: 'classcast-submissions',
        IndexName: 'AssignmentIdIndex',
        KeyConditionExpression: 'assignmentId = :assignmentId',
        ExpressionAttributeValues: {
          ':assignmentId': assignmentId
        }
      });

      const result = await docClient.send(queryCommand);
      submissions = result.Items || [];
    } else if (studentId) {
      // Get submissions for a specific student
      const queryCommand = new QueryCommand({
        TableName: 'classcast-submissions',
        IndexName: 'StudentIdIndex',
        KeyConditionExpression: 'studentId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      });

      const result = await docClient.send(queryCommand);
      submissions = result.Items || [];
    } else if (courseId) {
      // Get all submissions for a course
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
    } else {
      // Get all submissions
      const scanCommand = new ScanCommand({
        TableName: process.env.VIDEO_SUBMISSIONS_TABLE_NAME || 'ClassCastVideoSubmissions'
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
    }

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length
    });

  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video submissions'
    }, { status: 500 });
  }
}

// POST /api/video-submissions - Create a new video submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      studentId,
      courseId,
      videoUrl,
      videoId,
      videoTitle,
      videoDescription,
      duration,
      fileName,
      fileSize,
      fileType,
      isRecorded = false,
      isUploaded = false,
      isLocalStorage = false
    } = body;

    if (!assignmentId || !studentId || !courseId || !videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: assignmentId, studentId, courseId, videoUrl'
      }, { status: 400 });
    }

    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const submission = {
      submissionId,
      assignmentId,
      studentId,
      courseId,
      videoUrl,
      videoId: videoId || null,
      videoTitle: videoTitle || 'Video Submission',
      videoDescription: videoDescription || '',
      duration: duration || 0,
      fileName: fileName || 'video.webm',
      fileSize: fileSize || 0,
      fileType: fileType || 'video/webm',
      isRecorded,
      isUploaded,
      isLocalStorage,
      status: 'submitted', // submitted, graded, returned
      grade: null,
      instructorFeedback: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      gradedAt: null
    };

    const putCommand = new PutCommand({
      TableName: process.env.VIDEO_SUBMISSIONS_TABLE_NAME || 'ClassCastVideoSubmissions',
      Item: submission
    });

    await docClient.send(putCommand);

    return NextResponse.json({
      success: true,
      submission,
      message: 'Video submission created successfully'
    });

  } catch (error) {
    console.error('Error creating video submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video submission'
    }, { status: 500 });
  }
}

// PUT /api/video-submissions - Update a video submission (for grading)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      grade,
      instructorFeedback,
      status = 'graded'
    } = body;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: submissionId'
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updateCommand: any = {
      TableName: process.env.VIDEO_SUBMISSIONS_TABLE_NAME || 'ClassCastVideoSubmissions',
      Key: { submissionId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, gradedAt = :gradedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': now,
        ':gradedAt': now
      }
    };

    // Add grade and feedback if provided
    if (grade !== undefined) {
      updateCommand.UpdateExpression += ', grade = :grade';
      updateCommand.ExpressionAttributeValues[':grade'] = grade;
    }

    if (instructorFeedback !== undefined) {
      updateCommand.UpdateExpression += ', instructorFeedback = :feedback';
      updateCommand.ExpressionAttributeValues[':feedback'] = instructorFeedback;
    }

    await docClient.send(new UpdateCommand(updateCommand));

    return NextResponse.json({
      success: true,
      message: 'Video submission updated successfully'
    });

  } catch (error) {
    console.error('Error updating video submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update video submission'
    }, { status: 500 });
  }
}
