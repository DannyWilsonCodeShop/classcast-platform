import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get assignments from database
    let assignments = [];
    
    try {
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        ...(courseId && {
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        })
      }));
      
      assignments = assignmentsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: {
            assignments: [],
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

    // Filter by course if specified
    let filteredAssignments = assignments;
    if (courseId) {
      filteredAssignments = assignments.filter(assignment => assignment.courseId === courseId);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        totalCount: filteredAssignments.length,
        currentPage: page,
        totalPages: Math.ceil(filteredAssignments.length / limit),
        hasNextPage: endIndex < filteredAssignments.length,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch assignments' 
      },
      { status: 500 }
    );
  }
}