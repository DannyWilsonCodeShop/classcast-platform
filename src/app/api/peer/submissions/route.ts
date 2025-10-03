import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');
    const courseId = searchParams.get('courseId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching peer submissions for student:', studentId, 'assignment:', assignmentId, 'course:', courseId);

    // Get peer submissions (excluding the current student's own submissions)
    let submissions = [];
    
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: assignmentId 
          ? 'assignmentId = :assignmentId AND studentId <> :studentId'
          : courseId
          ? 'courseId = :courseId AND studentId <> :studentId'
          : 'studentId <> :studentId',
        ExpressionAttributeValues: assignmentId
          ? {
              ':assignmentId': assignmentId,
              ':studentId': studentId
            }
          : courseId
          ? {
              ':courseId': courseId,
              ':studentId': studentId
            }
          : {
              ':studentId': studentId
            }
      }));
      
      submissions = submissionsResult.Items || [];
      
      // Sort by submittedAt in descending order (most recent first)
      submissions.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          submissions: [],
          count: 0
        });
      }
      throw dbError;
    }

    // Enrich submissions with student, course, and assignment information
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let studentName = 'Unknown Student';
      let studentEmail = 'unknown@example.com';
      let courseName = 'Unknown Course';
      let assignmentTitle = 'Untitled Assignment';
      
      try {
        // Get student information
        if (submission.studentId) {
          const studentResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: submission.studentId }
          }));
          if (studentResult.Item) {
            studentName = `${studentResult.Item.firstName || ''} ${studentResult.Item.lastName || ''}`.trim() || 'Unknown Student';
            studentEmail = studentResult.Item.email || 'unknown@example.com';
          }
        }
        
        // Get course information
        if (submission.courseId) {
          const courseResult = await docClient.send(new GetCommand({
            TableName: COURSES_TABLE,
            Key: { courseId: submission.courseId }
          }));
          if (courseResult.Item) {
            courseName = courseResult.Item.title || courseResult.Item.name || 'Unknown Course';
          }
        }
        
        // Get assignment information
        if (submission.assignmentId) {
          const assignmentResult = await docClient.send(new GetCommand({
            TableName: ASSIGNMENTS_TABLE,
            Key: { assignmentId: submission.assignmentId }
          }));
          if (assignmentResult.Item) {
            assignmentTitle = assignmentResult.Item.title || 'Untitled Assignment';
          }
        }
      } catch (error) {
        console.error('Error enriching submission data:', error);
        // Use fallback values if enrichment fails
      }
      
      return {
        id: submission.submissionId || submission.id,
        submissionId: submission.submissionId || submission.id,
        studentId: submission.studentId,
        studentName,
        studentEmail,
        assignmentId: submission.assignmentId,
        assignmentTitle,
        courseId: submission.courseId,
        courseName,
        videoUrl: submission.videoUrl,
        videoTitle: submission.videoTitle || 'Video Submission',
        videoDescription: submission.videoDescription || '',
        duration: submission.duration || 0,
        fileSize: submission.fileSize || 0,
        fileType: submission.fileType || 'video/webm',
        submittedAt: submission.submittedAt || submission.createdAt,
        status: submission.status || 'submitted',
        grade: submission.grade,
        maxPoints: submission.maxPoints || 100,
        feedback: submission.instructorFeedback,
        likes: submission.likes || 0,
        comments: submission.comments || [],
        peerReviews: submission.peerReviews || [],
        isRecorded: submission.isRecorded || false,
        isUploaded: submission.isUploaded || false,
        thumbnailUrl: submission.thumbnailUrl || '/api/placeholder/300/200'
      };
    }));

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions,
      count: enrichedSubmissions.length
    });

  } catch (error) {
    console.error('Error fetching peer submissions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch peer submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
