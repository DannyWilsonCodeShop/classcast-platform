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
    const sectionId = searchParams.get('sectionId');
    const assignmentId = searchParams.get('assignmentId');
    const instructorId = searchParams.get('instructorId');

    console.log('Video submissions API called with:', { courseId, sectionId, assignmentId, instructorId });

    let submissions: any[] = [];

    if (assignmentId) {
      // Get submissions for a specific assignment
      console.log('Fetching submissions for assignment:', assignmentId);
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
      console.log('Found submissions for assignment:', submissions.length);
    } else if (courseId) {
      // Get all submissions for a course (optionally filtered by section)
      console.log('Fetching submissions for course:', courseId, 'section:', sectionId);
      
      let filterExpression = 'courseId = :courseId';
      let expressionAttributeValues: any = {
        ':courseId': courseId
      };

      if (sectionId) {
        filterExpression += ' AND sectionId = :sectionId';
        expressionAttributeValues[':sectionId'] = sectionId;
      }

      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      console.log('Found submissions for course/section:', submissions.length);
    } else if (instructorId) {
      // Get all submissions for instructor's courses
      console.log('Fetching submissions for instructor:', instructorId);
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
        console.log('Found submissions for instructor courses:', submissions.length);
      }
    } else {
      // Get all submissions
      console.log('Fetching all submissions');
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions'
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      console.log('Found all submissions:', submissions.length);
    }

    // Enrich submissions with student and assignment data
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        try {
          console.log('Enriching submission:', submission.submissionId);
          
          // Get student info from users table
          let studentInfo = null;
          try {
            const studentScanCommand = new ScanCommand({
              TableName: 'classcast-users',
              FilterExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': submission.studentId
              }
            });
            const studentResult = await docClient.send(studentScanCommand);
            studentInfo = studentResult.Items?.[0] || null;
          } catch (error) {
            console.error('Error fetching student info:', error);
          }

          // Get assignment info from assignments table
          let assignmentInfo = null;
          try {
            const assignmentScanCommand = new ScanCommand({
              TableName: 'classcast-assignments',
              FilterExpression: 'assignmentId = :assignmentId',
              ExpressionAttributeValues: {
                ':assignmentId': submission.assignmentId
              }
            });
            const assignmentResult = await docClient.send(assignmentScanCommand);
            assignmentInfo = assignmentResult.Items?.[0] || null;
          } catch (error) {
            console.error('Error fetching assignment info:', error);
          }

          return {
            ...submission,
            student: studentInfo ? {
              id: studentInfo.userId,
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
              id: assignmentInfo.assignmentId,
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
