import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '../../../lib/dynamodb';
import { Assignment } from '../../../types/dynamodb';
import { RealtimeNotifier } from '../websocket/route';

// GET /api/assignments - Get assignments with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const statuses = searchParams.get('statuses')?.split(',') || ['published'];
    const type = searchParams.get('type');
    const weekNumber = searchParams.get('weekNumber');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter expression
    let filterExpression = '';
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    if (courseId) {
      filterExpression += 'courseId = :courseId';
      expressionAttributeValues[':courseId'] = courseId;
    }

    if (statuses.length > 0) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'status IN (:status1, :status2, :status3)';
      expressionAttributeValues[':status1'] = statuses[0];
      expressionAttributeValues[':status2'] = statuses[1] || statuses[0];
      expressionAttributeValues[':status3'] = statuses[2] || statuses[0];
    }

    if (type) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += '#type = :type';
      expressionAttributeNames['#type'] = 'type';
      expressionAttributeValues[':type'] = type;
    }

    if (weekNumber) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'weekNumber = :weekNumber';
      expressionAttributeValues[':weekNumber'] = parseInt(weekNumber);
    }

    if (search) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'contains(title, :search) OR contains(description, :search)';
      expressionAttributeValues[':search'] = search;
    }

    // Build scan parameters
    const scanParams: any = {
      TableName: 'classcast-assignments',
      Limit: limit,
    };

    if (filterExpression) {
      scanParams.FilterExpression = filterExpression;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    // Get assignments
    const response = await dynamoDBService.scan(scanParams);
    let assignments = response.Items || [];

    // Sort assignments
    assignments.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssignments = assignments.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        pagination: {
          page,
          limit,
          total: assignments.length,
          totalPages: Math.ceil(assignments.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      courseId,
      courseName,
      dueDate,
      type = 'assignment',
      maxScore = 100,
      instructions,
      weekNumber,
      rubric,
    } = body;

    // Validate required fields
    if (!title || !description || !courseId || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, description, courseId, dueDate',
        },
        { status: 400 }
      );
    }

    // Generate assignment ID
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create assignment object
    const assignment: Assignment = {
      assignmentId,
      title,
      description,
      courseId,
      courseName: courseName || `Course ${courseId}`,
      dueDate: new Date(dueDate).toISOString(),
      status: 'draft',
      type,
      maxScore,
      instructions: instructions || '',
      weekNumber: weekNumber || null,
      rubric: rubric || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user', // This should be set from auth context
      submissions: [],
    };

    // Save to DynamoDB
    await dynamoDBService.put({
      TableName: 'classcast-assignments',
      Item: assignment,
    });

    // Send real-time notification
    try {
      await RealtimeNotifier.notifyAssignmentCreated(assignment, courseId);
    } catch (notificationError) {
      console.error('Failed to send real-time notification:', notificationError);
      // Don't fail the assignment creation if notification fails
    }

    // Send email notification to students
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assignment_created',
          userId: 'all-students', // This should be replaced with actual student IDs
          data: {
            assignmentTitle: assignment.title,
            courseName: assignment.courseName,
            dueDate: assignment.dueDate,
            type: assignment.type,
            maxScore: assignment.maxScore,
            instructions: assignment.instructions,
          },
        }),
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the assignment creation if email fails
    }

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assignments - Update an assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, ...updateData } = body;

    if (!assignmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment ID is required',
        },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();

    // Update assignment in DynamoDB
    await dynamoDBService.update({
      TableName: 'classcast-assignments',
      Key: { assignmentId },
      UpdateExpression: 'SET ' + Object.keys(updateData)
        .map(key => `#${key} = :${key}`)
        .join(', '),
      ExpressionAttributeNames: Object.keys(updateData).reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      }, {} as any),
      ExpressionAttributeValues: Object.keys(updateData).reduce((acc, key) => {
        acc[`:${key}`] = updateData[key];
        return acc;
      }, {} as any),
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments - Delete an assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignment ID is required',
        },
        { status: 400 }
      );
    }

    // Delete assignment from DynamoDB
    await dynamoDBService.delete({
      TableName: 'classcast-assignments',
      Key: { assignmentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
