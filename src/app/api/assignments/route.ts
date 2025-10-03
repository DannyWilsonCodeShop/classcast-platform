import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = awsConfig.dynamodb.tables.assignments;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      assignmentType,
      dueDate,
      maxScore,
      weight,
      requirements,
      allowLateSubmission,
      latePenalty,
      maxSubmissions,
      groupAssignment,
      maxGroupSize,
      allowedFileTypes,
      maxFileSize,
      status,
      courseId,
      instructorId,
      rubric,
      // Peer Review Settings
      peerReview,
      peerReviewScope,
      peerReviewCount,
      peerReviewDeadline,
      anonymousReview,
      allowSelfReview,
      instructorReview,
      peerReviewInstructions,
      targetSections,
      resources
    } = body;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!instructorId || typeof instructorId !== 'string' || instructorId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    if (maxScore && (typeof maxScore !== 'number' || maxScore < 1 || maxScore > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Max score must be a number between 1 and 1000' },
        { status: 400 }
      );
    }

    if (weight && (typeof weight !== 'number' || weight < 0 || weight > 100)) {
      return NextResponse.json(
        { success: false, error: 'Weight must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxSubmissions && (typeof maxSubmissions !== 'number' || maxSubmissions < 1 || maxSubmissions > 10)) {
      return NextResponse.json(
        { success: false, error: 'Max submissions must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    if (maxGroupSize && (typeof maxGroupSize !== 'number' || maxGroupSize < 2 || maxGroupSize > 20)) {
      return NextResponse.json(
        { success: false, error: 'Max group size must be a number between 2 and 20' },
        { status: 400 }
      );
    }

    if (latePenalty && (typeof latePenalty !== 'number' || latePenalty < 0 || latePenalty > 100)) {
      return NextResponse.json(
        { success: false, error: 'Late penalty must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate due date format if provided
    if (dueDate && typeof dueDate === 'string') {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Due date must be a valid date' },
          { status: 400 }
        );
      }
    }

    // Generate assignment ID
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create assignment object with sanitized data
    const assignment = {
      assignmentId,
      courseId: courseId.trim(),
      instructorId: instructorId.trim(),
      title: title.trim(),
      description: description?.trim() || '',
      assignmentType: assignmentType || 'video',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxScore: maxScore || 100,
      weight: weight || 10,
      requirements: Array.isArray(requirements) ? requirements : [],
      allowLateSubmission: allowLateSubmission || false,
      latePenalty: latePenalty || 0,
      maxSubmissions: maxSubmissions || 1,
      groupAssignment: groupAssignment || false,
      maxGroupSize: maxGroupSize || 4,
      allowedFileTypes: Array.isArray(allowedFileTypes) ? allowedFileTypes : ['mp4', 'mov', 'avi'],
      maxFileSize: maxFileSize || 100 * 1024 * 1024, // 100MB
      status: status || 'draft',
      rubric: rubric || null,
      // Peer Review Settings
      peerReview: peerReview || false,
      peerReviewScope: peerReviewScope || 'section',
      peerReviewCount: peerReviewCount || 3,
      peerReviewDeadline: peerReviewDeadline || 7,
      anonymousReview: anonymousReview !== undefined ? anonymousReview : true,
      allowSelfReview: allowSelfReview || false,
      instructorReview: instructorReview !== undefined ? instructorReview : true,
      peerReviewInstructions: peerReviewInstructions?.trim() || '',
      targetSections: Array.isArray(targetSections) ? targetSections : [],
      resources: Array.isArray(resources) ? resources : [],
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    // Save to database
    await docClient.send(new PutCommand({
      TableName: ASSIGNMENTS_TABLE,
      Item: assignment
    }));

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create assignment' 
      },
      { status: 500 }
    );
  }
}