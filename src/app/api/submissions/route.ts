import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    // Get submissions from database
    let submissions = [];
    
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        ...(status && {
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': status
          }
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
