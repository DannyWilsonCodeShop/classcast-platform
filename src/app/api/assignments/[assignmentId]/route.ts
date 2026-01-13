import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';

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
    
    // Fetch course information
    let courseInfo = null;
    if (assignment.courseId) {
      try {
        const courseResult = await docClient.send(new GetCommand({
          TableName: COURSES_TABLE,
          Key: { courseId: assignment.courseId }
        }));
        courseInfo = courseResult.Item;
      } catch (error) {
        console.warn('Could not fetch course info:', error);
      }
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
      maxFileSize: assignment.maxFileSize || 2048 * 1024 * 1024, // 2GB default
      courseId: assignment.courseId,
      courseName: courseInfo?.title || courseInfo?.courseName || 'Unknown Course',
      courseCode: courseInfo?.courseCode || courseInfo?.code || 'N/A',
      course: {
        id: assignment.courseId,
        name: courseInfo?.title || courseInfo?.courseName || 'Unknown Course',
        code: courseInfo?.courseCode || courseInfo?.code || 'N/A',
        instructor: {
          name: courseInfo?.instructorName || 'Unknown Instructor',
          email: courseInfo?.instructorEmail || 'unknown@example.com'
        }
      },
      resources: assignment.resources || [],
      submissions: [], // Would need to fetch from submissions table
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      enablePeerResponses: assignment.enablePeerResponses || false,
      minResponsesRequired: assignment.minResponsesRequired || 0,
      maxResponsesPerVideo: assignment.maxResponsesPerVideo || 0
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

// PUT /api/assignments/[assignmentId] - Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const body = await request.json();
    
    console.log('Updating assignment:', assignmentId, body);
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    // Add updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    // Map of allowed fields to update
    const fieldMapping: { [key: string]: string } = {
      title: 'title',
      description: 'description',
      dueDate: 'dueDate',
      maxScore: 'maxScore',
      status: 'status',
      assignmentType: 'assignmentType',
      requirements: 'requirements',
      allowLateSubmission: 'allowLateSubmission',
      latePenalty: 'latePenalty',
      maxSubmissions: 'maxSubmissions',
      groupAssignment: 'groupAssignment',
      maxGroupSize: 'maxGroupSize',
      allowedFileTypes: 'allowedFileTypes',
      maxFileSize: 'maxFileSize',
      enablePeerResponses: 'enablePeerResponses',
      minResponsesRequired: 'minResponsesRequired',
      maxResponsesPerVideo: 'maxResponsesPerVideo',
      responseDueDate: 'responseDueDate',
      responseWordLimit: 'responseWordLimit',
      responseCharacterLimit: 'responseCharacterLimit',
      hidePeerVideosUntilInstructorPosts: 'hidePeerVideosUntilInstructorPosts',
      peerReviewScope: 'peerReviewScope',
      coverPhoto: 'coverPhoto',
      emoji: 'emoji',
      color: 'color',
      requireLiveRecording: 'requireLiveRecording',
      allowYouTubeUrl: 'allowYouTubeUrl',
      resources: 'resources',
      instructionalVideoUrl: 'instructionalVideoUrl', // MISSING: Instructional video URL
      rubric: 'rubric' // MISSING: Rubric data
    };
    
    // Process each field in the body
    for (const [bodyKey, dbKey] of Object.entries(fieldMapping)) {
      if (body[bodyKey] !== undefined) {
        const attrName = `#${dbKey}`;
        const attrValue = `:${dbKey}`;
        
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = dbKey;
        expressionAttributeValues[attrValue] = body[bodyKey];
      }
    }
    
    if (updateExpressions.length === 1) {
      // Only updatedAt, nothing to update
      return NextResponse.json({
        success: true,
        message: 'No changes to save'
      });
    }
    
    // Update the assignment in DynamoDB
    const updateCommand = {
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW' as const
    };
    
    const result = await docClient.send(new UpdateCommand(updateCommand));
    
    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: result.Attributes
    });
    
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[assignmentId] - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    
    console.log('Deleting assignment:', assignmentId);
    
    // Verify assignment exists first
    const existingAssignment = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));
    
    if (!existingAssignment.Items || existingAssignment.Items.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Assignment not found' 
        },
        { status: 404 }
      );
    }
    
    // Delete the assignment
    await docClient.send(new DeleteCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId }
    }));
    
    console.log('Assignment deleted successfully:', assignmentId);
    
    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}