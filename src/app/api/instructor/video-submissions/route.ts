import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
  // Remove explicit credentials to use IAM role
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// GET /api/instructor/video-submissions - Get video submissions for instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const assignmentId = searchParams.get('assignmentId');
    const instructorId = searchParams.get('instructorId');

    let submissions: any[] = [];

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
    } else if (instructorId) {
      // Get all submissions for instructor's courses
      // First, get all courses for this instructor
      const coursesScanCommand = new ScanCommand({
        TableName: 'classcast-courses',
        FilterExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: {
          ':instructorId': instructorId
        }
      });

      const coursesResult = await docClient.send(coursesScanCommand);
      const courseIds = coursesResult.Items?.map(course => course.courseId) || [];

      if (courseIds.length > 0) {
        // Get submissions for all instructor's courses
        const submissionsScanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: 'courseId IN (:courseIds)',
          ExpressionAttributeValues: {
            ':courseIds': courseIds
          }
        });

        const submissionsResult = await docClient.send(submissionsScanCommand);
        submissions = (submissionsResult.Items || []) as any[];
      }
    } else {
      // Get all submissions
      const scanCommand = new ScanCommand({
        TableName: process.env.VIDEO_SUBMISSIONS_TABLE_NAME || 'ClassCastVideoSubmissions'
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
    }

    // Enrich submissions with student and assignment data
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        try {
          // Get student info
          const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/profile?userId=${submission.studentId}`, {
            credentials: 'include'
          });
          let studentInfo = null;
          if (studentResponse.ok) {
            const studentData = await studentResponse.json();
            studentInfo = studentData.data || studentData;
          }

          // Get assignment info
          const assignmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/assignments/${submission.assignmentId}`, {
            credentials: 'include'
          });
          let assignmentInfo = null;
          if (assignmentResponse.ok) {
            const assignmentData = await assignmentResponse.json();
            assignmentInfo = assignmentData.assignment || assignmentData;
          }

          return {
            ...submission,
            student: studentInfo ? {
              id: studentInfo.id || studentInfo.userId,
              name: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || 'Unknown Student',
              email: studentInfo.email || 'unknown@example.com',
              avatar: studentInfo.avatar || null
            } : {
              id: submission.studentId,
              name: 'Unknown Student',
              email: 'unknown@example.com',
              avatar: null
            },
            assignment: assignmentInfo ? {
              id: assignmentInfo.assignmentId || assignmentInfo.id,
              title: assignmentInfo.title || 'Unknown Assignment',
              description: assignmentInfo.description || '',
              dueDate: assignmentInfo.dueDate || null
            } : {
              id: submission.assignmentId,
              title: 'Unknown Assignment',
              description: '',
              dueDate: null
            }
          };
        } catch (error) {
          console.error('Error enriching submission:', error);
          return {
            ...submission,
            student: {
              id: submission.studentId,
              name: 'Unknown Student',
              email: 'unknown@example.com',
              avatar: null
            },
            assignment: {
              id: submission.assignmentId,
              title: 'Unknown Assignment',
              description: '',
              dueDate: null
            }
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions,
      count: enrichedSubmissions.length
    });

  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video submissions'
    }, { status: 500 });
  }
}
