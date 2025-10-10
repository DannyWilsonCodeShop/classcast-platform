import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // Scan the submissions table
    const scanCommand = new ScanCommand({
      TableName: 'classcast-submissions',
      Limit: 50
    });

    const result = await docClient.send(scanCommand);
    const allSubmissions = result.Items || [];
    
    // If studentId provided, filter
    if (studentId) {
      const peerSubmissions = allSubmissions.filter(sub => sub.studentId !== studentId);
      const mySubmissions = allSubmissions.filter(sub => sub.studentId === studentId);
      
      return NextResponse.json({
        success: true,
        message: 'DynamoDB scan successful',
        totalSubmissions: allSubmissions.length,
        mySubmissions: {
          count: mySubmissions.length,
          items: mySubmissions.map(sub => ({
            submissionId: sub.submissionId,
            studentId: sub.studentId,
            courseId: sub.courseId,
            assignmentId: sub.assignmentId,
            videoTitle: sub.videoTitle,
            status: sub.status,
            submittedAt: sub.submittedAt || sub.createdAt
          }))
        },
        peerSubmissions: {
          count: peerSubmissions.length,
          items: peerSubmissions.map(sub => ({
            submissionId: sub.submissionId,
            studentId: sub.studentId,
            courseId: sub.courseId,
            assignmentId: sub.assignmentId,
            videoTitle: sub.videoTitle,
            status: sub.status,
            submittedAt: sub.submittedAt || sub.createdAt
          }))
        },
        itemCount: result.Count,
        scannedCount: result.ScannedCount
      });
    }
    
    // Return all submissions
    return NextResponse.json({
      success: true,
      message: 'DynamoDB scan successful',
      totalSubmissions: allSubmissions.length,
      submissions: allSubmissions.map(sub => ({
        submissionId: sub.submissionId,
        studentId: sub.studentId,
        courseId: sub.courseId,
        assignmentId: sub.assignmentId,
        videoTitle: sub.videoTitle,
        status: sub.status,
        submittedAt: sub.submittedAt || sub.createdAt,
        hasVideoUrl: !!sub.videoUrl
      })),
      itemCount: result.Count,
      scannedCount: result.ScannedCount
    });

  } catch (error) {
    console.error('DynamoDB test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}
