import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

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

    // Transform the data to match the expected format
    const recentSubmissions = submissions.map(submission => ({
      id: submission.submissionId || submission.id,
      studentName: submission.studentName || 'Unknown Student',
      studentId: submission.studentId,
      assignmentTitle: submission.assignmentTitle || submission.title || 'Untitled Assignment',
      assignmentId: submission.assignmentId,
      submittedAt: submission.submittedAt || submission.createdAt,
      courseName: submission.courseName || 'Unknown Course',
      courseCode: submission.courseCode,
      status: submission.status || 'pending_review',
      submissionType: submission.submissionType || 'video',
      duration: submission.duration || 0,
      fileSize: submission.fileSize || 0,
      grade: submission.grade,
      maxPoints: submission.maxPoints || 100
    }));

    return NextResponse.json(recentSubmissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent submissions' },
      { status: 500 }
    );
  }
}
