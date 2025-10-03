import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('Fetching public courses, search:', search);

    // Get all public courses
    let courses = [];
    
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'privacy = :privacy',
        ExpressionAttributeValues: {
          ':privacy': 'public'
        }
      }));
      
      courses = coursesResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          data: {
            courses: [],
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

    // Enrich courses with instructor information
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        try {
          if (course.instructorId) {
            const instructorResult = await docClient.send(new ScanCommand({
              TableName: USERS_TABLE,
              FilterExpression: 'id = :instructorId',
              ExpressionAttributeValues: {
                ':instructorId': course.instructorId
              }
            }));
            
            const instructor = instructorResult.Items?.[0];
            if (instructor) {
              course.instructor = {
                id: instructor.id,
                name: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim(),
                email: instructor.email,
                avatar: instructor.avatar || null
              };
            }
          }
          
          return course;
        } catch (error) {
          console.warn('Failed to fetch instructor for course:', course.id, error);
          return course;
        }
      })
    );

    // Apply search filter
    let filteredCourses = enrichedCourses;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCourses = enrichedCourses.filter(course => 
        course.name?.toLowerCase().includes(searchLower) ||
        course.code?.toLowerCase().includes(searchLower) ||
        course.classCode?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.instructor?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        courses: paginatedCourses,
        totalCount: filteredCourses.length,
        currentPage: page,
        totalPages: Math.ceil(filteredCourses.length / limit),
        hasNextPage: endIndex < filteredCourses.length,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch public courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
