import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    console.log('DEBUG: Fetching all submissions from table:', SUBMISSIONS_TABLE);
    
    // Get ALL submissions to see what's in the database
    const result = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      Limit: 50 // Limit to first 50 to avoid overwhelming response
    }));
    
    const allSubmissions = result.Items || [];
    console.log('DEBUG: Total submissions found:', allSubmissions.length);
    
    // If studentId provided, show what would be filtered
    if (studentId) {
      const peerSubmissions = allSubmissions.filter(sub => sub.studentId !== studentId);
      const mySubmissions = allSubmissions.filter(sub => sub.studentId === studentId);
      
      return NextResponse.json({
        success: true,
        debug: {
          totalSubmissions: allSubmissions.length,
          mySubmissions: {
            count: mySubmissions.length,
            items: mySubmissions
          },
          peerSubmissions: {
            count: peerSubmissions.length,
            items: peerSubmissions
          },
          studentId: studentId
        }
      });
    }
    
    // Return all submissions with their key fields
    return NextResponse.json({
      success: true,
      debug: {
        totalSubmissions: allSubmissions.length,
        submissions: allSubmissions.map(sub => ({
          submissionId: sub.submissionId || sub.id,
          studentId: sub.studentId,
          courseId: sub.courseId,
          assignmentId: sub.assignmentId,
          status: sub.status,
          submittedAt: sub.submittedAt || sub.createdAt,
          videoUrl: sub.videoUrl ? 'present' : 'missing'
        }))
      }
    });
    
  } catch (error) {
    console.error('DEBUG: Error fetching submissions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    }, { status: 500 });
  }
}

