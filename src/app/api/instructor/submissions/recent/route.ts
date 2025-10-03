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
    // Get recent submissions from database
    let submissions = [];
    
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        Limit: 10 // Get only the most recent 10 submissions
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
        // Table doesn't exist yet, return empty array
        return NextResponse.json([]);
      }
      throw dbError;
    }

    // Enrich submissions with actual data from other tables
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let studentName = 'Unknown Student';
      let courseName = 'Unknown Course';
      let assignmentTitle = 'Untitled Assignment';
      
      try {
        // Get student information
        if (submission.studentId) {
          const studentResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { id: submission.studentId }
          }));
          if (studentResult.Item) {
            studentName = studentResult.Item.name || studentResult.Item.fullName || 'Unknown Student';
          }
        }
        
        // Get course information
        if (submission.courseId) {
          const courseResult = await docClient.send(new GetCommand({
            TableName: COURSES_TABLE,
            Key: { id: submission.courseId }
          }));
          if (courseResult.Item) {
            courseName = courseResult.Item.title || courseResult.Item.name || 'Unknown Course';
          }
        }
        
        // Get assignment information
        if (submission.assignmentId) {
          const assignmentResult = await docClient.send(new GetCommand({
            TableName: ASSIGNMENTS_TABLE,
            Key: { id: submission.assignmentId }
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
        studentName,
        studentId: submission.studentId,
        assignmentTitle,
        assignmentId: submission.assignmentId,
        submittedAt: submission.submittedAt || submission.createdAt,
        courseName,
        courseCode: submission.courseCode,
        status: submission.status || 'pending_review',
        submissionType: submission.submissionType || 'video',
        duration: submission.duration || 0,
        fileSize: submission.fileSize || 0,
        grade: submission.grade,
        maxPoints: submission.maxPoints || 100
      };
    }));

    return NextResponse.json(enrichedSubmissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent submissions' },
      { status: 500 }
    );
  }
}
