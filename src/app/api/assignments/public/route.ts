import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('Fetching public assignments, search:', search, 'courseId:', courseId);

    // First, get all public courses
    let publicCourses = [];
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'privacy = :privacy',
        ExpressionAttributeValues: {
          ':privacy': 'public'
        }
      }));
      
      publicCourses = coursesResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
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

    const publicCourseIds = publicCourses.map(course => course.id);
    
    if (publicCourseIds.length === 0) {
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

    // Get assignments from public courses
    let assignments = [];
    try {
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: courseId 
          ? 'courseId = :courseId AND contains(:publicCourseIds, courseId)'
          : 'contains(:publicCourseIds, courseId)',
        ExpressionAttributeValues: courseId 
          ? {
              ':courseId': courseId,
              ':publicCourseIds': publicCourseIds
            }
          : {
              ':publicCourseIds': publicCourseIds
            }
      }));
      
      assignments = assignmentsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
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

    // Enrich assignments with course and instructor information
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          // Find the course
          const course = publicCourses.find(c => c.id === assignment.courseId);
          if (!course) return assignment;

          // Get instructor information
          let instructor = null;
          if (course.instructorId) {
            const instructorResult = await docClient.send(new ScanCommand({
              TableName: USERS_TABLE,
              FilterExpression: 'id = :instructorId',
              ExpressionAttributeValues: {
                ':instructorId': course.instructorId
              }
            }));
            
            const instructorData = instructorResult.Items?.[0];
            if (instructorData) {
              instructor = {
                id: instructorData.id,
                name: `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim(),
                email: instructorData.email,
                avatar: instructorData.avatar || null
              };
            }
          }

          return {
            ...assignment,
            course: {
              id: course.id,
              name: course.name,
              code: course.code,
              classCode: course.classCode,
              description: course.description,
              instructor
            }
          };
        } catch (error) {
          console.warn('Failed to enrich assignment:', assignment.id, error);
          return assignment;
        }
      })
    );

    // Apply search filter
    let filteredAssignments = enrichedAssignments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAssignments = enrichedAssignments.filter(assignment => 
        assignment.title?.toLowerCase().includes(searchLower) ||
        assignment.description?.toLowerCase().includes(searchLower) ||
        assignment.course?.name?.toLowerCase().includes(searchLower) ||
        assignment.course?.code?.toLowerCase().includes(searchLower) ||
        assignment.course?.instructor?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredAssignments.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

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
    console.error('Error fetching public assignments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch public assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
