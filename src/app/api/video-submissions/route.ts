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
        TableName: 'classcast-submissions'
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
      sectionId, // Add sectionId
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

    // Generate thumbnail URL (placeholder for now, in production you'd generate actual thumbnails)
    const thumbnailUrl = `/api/placeholder/400/300?text=${encodeURIComponent(videoTitle || 'Video')}`;

    const submission = {
      submissionId,
      assignmentId,
      studentId,
      courseId,
      sectionId: sectionId || null, // Add sectionId to submission
      videoUrl,
      videoId: videoId || null,
      videoTitle: videoTitle || 'Video Submission',
      videoDescription: videoDescription || '',
      duration: duration || 0,
      fileName: fileName || 'video.webm',
      fileSize: fileSize || 0,
      fileType: fileType || 'video/webm',
      thumbnailUrl, // Add thumbnail URL
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

    // Save to submissions table
    const putCommand = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });

    await docClient.send(putCommand);

    // Update assignment status to 'submitted' for this student
    try {
      const updateAssignmentCommand = new UpdateCommand({
        TableName: 'classcast-assignments',
        Key: { assignmentId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'submitted',
          ':updatedAt': new Date().toISOString()
        }
      });

      await docClient.send(updateAssignmentCommand);
    } catch (assignmentError) {
      console.warn('Could not update assignment status:', assignmentError);
      // Don't fail the submission if assignment update fails
    }

    // Also create an entry in the videos table for community display
    try {
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get course name for the video entry
      let courseName = 'Unknown Course';
      try {
        const courseResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-courses',
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          },
          Limit: 1
        }));
        
        if (courseResult.Items && courseResult.Items.length > 0) {
          courseName = courseResult.Items[0].courseName || courseName;
        }
      } catch (courseError) {
        console.warn('Could not fetch course name:', courseError);
      }

      // Get student name for the video entry
      let studentName = 'Unknown Student';
      try {
        const userResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-users',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': studentId
          },
          Limit: 1
        }));
        
        if (userResult.Items && userResult.Items.length > 0) {
          const user = userResult.Items[0];
          studentName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || studentName;
        }
      } catch (userError) {
        console.warn('Could not fetch student name:', userError);
      }

      const videoData = {
        id: videoId,
        title: videoTitle || 'Video Submission',
        description: videoDescription || '',
        videoUrl,
        thumbnail: '/api/placeholder/300/200', // Default thumbnail
        duration: duration || 0,
        courseId,
        userId: studentId,
        courseName,
        author: {
          name: studentName,
          avatar: '/api/placeholder/40/40'
        },
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          responses: 0,
          averageRating: 0,
          totalRatings: 0
        },
        createdAt: now,
        updatedAt: now,
        submissionId, // Link back to the submission
        isSubmission: true // Flag to indicate this is a submission video
      };

      const videoPutCommand = new PutCommand({
        TableName: 'classcast-videos',
        Item: videoData
      });

      await docClient.send(videoPutCommand);
      console.log('Video entry created for community display:', videoId);
    } catch (videoError) {
      console.error('Error creating video entry for community display:', videoError);
      // Don't fail the submission if video creation fails
    }

    return NextResponse.json({
      success: true,
      submission,
      message: 'Video submission created successfully'
    });

  } catch (error) {
    console.error('Error creating video submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video submission',
      details: error instanceof Error ? error.message : 'Unknown error'
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
      TableName: 'classcast-submissions',
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
