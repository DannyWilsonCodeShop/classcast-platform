import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    // Get assignment from database using scan
    let assignment = null;
    
    try {
      const assignmentResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'assignmentId = :assignmentId',
        ExpressionAttributeValues: {
          ':assignmentId': assignmentId
        }
      }));
      
      assignment = assignmentResult.Items?.[0] || null;
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        );
      }
      throw dbError;
    }
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    // Transform assignment data to match expected interface
    const transformedAssignment = {
      id: assignment.assignmentId,
      assignmentId: assignment.assignmentId,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.description, // Use description as instructions
      dueDate: assignment.dueDate,
      points: assignment.maxScore || 100,
      status: 'not-started', // Default status
      submissionType: assignment.assignmentType === 'video' ? 'video' : 'file',
      allowedFileTypes: assignment.allowedFileTypes || [],
      maxFileSize: assignment.maxFileSize || 100 * 1024 * 1024, // 100MB default
      course: {
        id: assignment.courseId,
        name: 'Unknown Course', // Would need to fetch from course table
        code: 'N/A',
        instructor: {
          name: 'Unknown Instructor',
          email: 'unknown@example.com'
        }
      },
      resources: assignment.resources || [],
      submissions: [], // Would need to fetch from submissions table
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    };
    
    return NextResponse.json({
      success: true,
      data: {
        assignment: transformedAssignment
      }
    });
    
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}