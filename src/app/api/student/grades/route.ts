import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const VIDEO_SUBMISSIONS_TABLE = 'classcast-video-submissions';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';

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

    console.log('🎯 Fetching grades for user:', userId);

    // Fetch all video submissions for the user
    const submissionsResponse = await docClient.send(new ScanCommand({
      TableName: VIDEO_SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :studentId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':studentId': userId,
        ':status': 'graded'
      }
    }));

    const submissions = submissionsResponse.Items || [];
    console.log('📊 Found graded submissions:', submissions.length);

    // Fetch assignment and course details for each submission
    const gradesWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        try {
          // Fetch assignment details
          let assignment = null;
          try {
            const assignmentResponse = await docClient.send(new ScanCommand({
              TableName: ASSIGNMENTS_TABLE,
              FilterExpression: 'assignmentId = :assignmentId',
              ExpressionAttributeValues: {
                ':assignmentId': submission.assignmentId
              }
            }));
            assignment = assignmentResponse.Items?.[0] || null;
          } catch (error) {
            console.warn('Could not fetch assignment:', submission.assignmentId, error);
          }

          // Fetch course details
          let course = null;
          if (submission.courseId) {
            try {
              const courseResponse = await docClient.send(new GetCommand({
                TableName: COURSES_TABLE,
                Key: { courseId: submission.courseId }
              }));
              course = courseResponse.Item || null;
            } catch (error) {
              console.warn('Could not fetch course:', submission.courseId, error);
            }
          }

          return {
            id: submission.submissionId,
            assignmentTitle: assignment?.title || 'Unknown Assignment',
            courseName: course?.courseName || course?.title || 'Unknown Course',
            courseCode: course?.courseCode || course?.code || 'N/A',
            grade: submission.grade || 0,
            maxPoints: assignment?.maxScore || 100,
            submittedAt: submission.submittedAt || submission.createdAt,
            gradedAt: submission.gradedAt || submission.updatedAt,
            feedback: submission.instructorFeedback || '',
            status: 'graded' as const,
            assignmentId: submission.assignmentId,
            courseId: submission.courseId
          };
        } catch (error) {
          console.error('Error processing submission:', submission.submissionId, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by graded date (most recent first)
    const validGrades = gradesWithDetails
      .filter(grade => grade !== null)
      .sort((a, b) => {
        const dateA = new Date(a.gradedAt).getTime();
        const dateB = new Date(b.gradedAt).getTime();
        return dateB - dateA; // Most recent first
      });

    // Calculate statistics
    const totalGrades = validGrades.length;
    const totalPoints = validGrades.reduce((sum, grade) => sum + grade.grade, 0);
    const maxTotalPoints = validGrades.reduce((sum, grade) => sum + grade.maxPoints, 0);
    const averageGrade = maxTotalPoints > 0 ? Math.round((totalPoints / maxTotalPoints) * 100) : 0;

    // Also fetch pending submissions (submitted but not graded)
    const pendingResponse = await docClient.send(new ScanCommand({
      TableName: VIDEO_SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :studentId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':studentId': userId,
        ':status': 'submitted'
      }
    }));

    const pendingSubmissions = pendingResponse.Items || [];
    console.log('⏳ Found pending submissions:', pendingSubmissions.length);

    // Add pending submissions to grades list
    const pendingGrades = await Promise.all(
      pendingSubmissions.map(async (submission) => {
        try {
          // Fetch assignment details
          let assignment = null;
          try {
            const assignmentResponse = await docClient.send(new ScanCommand({
              TableName: ASSIGNMENTS_TABLE,
              FilterExpression: 'assignmentId = :assignmentId',
              ExpressionAttributeValues: {
                ':assignmentId': submission.assignmentId
              }
            }));
            assignment = assignmentResponse.Items?.[0] || null;
          } catch (error) {
            console.warn('Could not fetch assignment:', submission.assignmentId, error);
          }

          // Fetch course details
          let course = null;
          if (submission.courseId) {
            try {
              const courseResponse = await docClient.send(new GetCommand({
                TableName: COURSES_TABLE,
                Key: { courseId: submission.courseId }
              }));
              course = courseResponse.Item || null;
            } catch (error) {
              console.warn('Could not fetch course:', submission.courseId, error);
            }
          }

          return {
            id: submission.submissionId,
            assignmentTitle: assignment?.title || 'Unknown Assignment',
            courseName: course?.courseName || course?.title || 'Unknown Course',
            courseCode: course?.courseCode || course?.code || 'N/A',
            grade: 0,
            maxPoints: assignment?.maxScore || 100,
            submittedAt: submission.submittedAt || submission.createdAt,
            gradedAt: '',
            feedback: '',
            status: 'pending' as const,
            assignmentId: submission.assignmentId,
            courseId: submission.courseId
          };
        } catch (error) {
          console.error('Error processing pending submission:', submission.submissionId, error);
          return null;
        }
      })
    );

    const validPendingGrades = pendingGrades.filter(grade => grade !== null);

    // Combine graded and pending submissions
    const allGrades = [...validGrades, ...validPendingGrades].sort((a, b) => {
      // Sort by submitted date, most recent first
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return dateB - dateA;
    });

    const stats = {
      averageGrade,
      totalAssignments: allGrades.length,
      completedAssignments: validGrades.length,
      pendingGrades: validPendingGrades.length
    };

    console.log('📈 Grade statistics:', stats);

    return NextResponse.json({
      success: true,
      grades: allGrades,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching student grades:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch grades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}