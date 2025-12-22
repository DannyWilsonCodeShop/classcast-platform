import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { isRequestFromDemoUser, getDemoTargetFromRequest } from '@/lib/demo-mode-middleware';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    let studentId = searchParams.get('studentId');
    
    // Handle demo mode - redirect to target user
    if (isRequestFromDemoUser(request)) {
      const demoTargetUser = getDemoTargetFromRequest(request);
      if (demoTargetUser) {
        studentId = demoTargetUser;
        console.log(`🎭 Demo mode: Fetching submissions for target user ${studentId}`);
      }
    }
    
    // Get submissions from database
    let submissions = [];
    
    try {
      const filterExpressions = [];
      const expressionAttributeNames: any = {};
      const expressionAttributeValues: any = {};
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = status;
      }
      
      if (studentId) {
        filterExpressions.push('studentId = :studentId');
        expressionAttributeValues[':studentId'] = studentId;
      }
      
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        ...(filterExpressions.length > 0 && {
          FilterExpression: filterExpressions.join(' AND '),
          ...(Object.keys(expressionAttributeNames).length > 0 && {
            ExpressionAttributeNames: expressionAttributeNames
          }),
          ExpressionAttributeValues: expressionAttributeValues
        })
      }));
      
      submissions = submissionsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: {
            submissions: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      }
      throw dbError;
    }

    // Filter by status if specified
    let filteredSubmissions = submissions;
    if (status) {
      filteredSubmissions = submissions.filter(submission => submission.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        totalCount: filteredSubmissions.length,
        currentPage: page,
        totalPages: Math.ceil(filteredSubmissions.length / limit),
        hasNextPage: endIndex < filteredSubmissions.length,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch submissions' 
      },
      { status: 500 }
    );
  }
}
