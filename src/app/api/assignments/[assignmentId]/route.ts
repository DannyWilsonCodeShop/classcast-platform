import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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
      maxResponsesPerVideo: assignment.maxResponsesPerVideo || 0,
      instructionalVideoUrl: assignment.instructionalVideoUrl || '' // ADD INSTRUCTIONAL VIDEO URL
    };
    
    return NextResponse.json({
      success: true,
      data: {
        assignment: transformedAssignment
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
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
    
    console.log('🔄 Assignment update request received:', {
      assignmentId,
      bodyKeys: Object.keys(body),
      instructionalVideoUrl: body.instructionalVideoUrl
    });
    
    // Debug authentication
    console.log('🔐 Authentication Debug:', {
      cookies: request.headers.get('cookie') ? 'present' : 'missing',
      authorization: request.headers.get('authorization') ? 'present' : 'missing',
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    });
    
    // Add CORS headers for the response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Verify the assignment exists first
    const existingAssignment = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));
    
    if (!existingAssignment.Items || existingAssignment.Items.length === 0) {
      console.log('❌ Assignment not found:', assignmentId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Assignment not found' 
        },
        { status: 404, headers }
      );
    }
    
    console.log('✅ Assignment found, proceeding with update');
    
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
      instructionalVideoUrl: 'instructionalVideoUrl',
      rubric: 'rubric'
    };
    
    // Process each field in the body
    for (const [bodyKey, dbKey] of Object.entries(fieldMapping)) {
      if (body[bodyKey] !== undefined) {
        const attrName = `#${dbKey}`;
        const attrValue = `:${dbKey}`;
        
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = dbKey;
        expressionAttributeValues[attrValue] = body[bodyKey];
        
        if (bodyKey === 'instructionalVideoUrl') {
          console.log('🎬 Updating instructionalVideoUrl:', body[bodyKey]);
        }
      }
    }
    
    if (updateExpressions.length === 1) {
      // Only updatedAt, nothing to update
      console.log('ℹ️ No changes to save');
      return NextResponse.json({
        success: true,
        message: 'No changes to save'
      }, { headers });
    }
    
    console.log('🔧 Update expressions:', updateExpressions);
    
    // Update the assignment in DynamoDB
    const updateCommand = {
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW' as const
    };
    
    console.log('📤 Sending update command to DynamoDB');
    const result = await docClient.send(new UpdateCommand(updateCommand));
    console.log('✅ Assignment updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: result.Attributes
    }, { headers });
    
  } catch (error) {
    console.error('❌ Error updating assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
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
    
    console.log('🗑️ Deleting assignment:', assignmentId);
    
    // Delete the assignment directly (DynamoDB won't error if it doesn't exist)
    await docClient.send(new DeleteCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId }
    }));
    
    console.log('✅ Assignment deleted successfully:', assignmentId);
    
    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting assignment:', error);
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