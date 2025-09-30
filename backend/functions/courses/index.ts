// ============================================================================
// COURSES LAMBDA - Handles course operations
// ============================================================================

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CourseService } from '../shared/services/CourseService';
import { CreateCourseRequest, ApiResponse } from '../shared/types';

const courseService = new CourseService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const courseId = event.pathParameters?.['courseId'];
    const instructorId = event.queryStringParameters?.['instructorId'];

    switch (method) {
      case 'GET':
        if (courseId) {
          return await getCourse(courseId);
        } else if (instructorId) {
          return await getCoursesByInstructor(instructorId);
        } else {
          return await getAllCourses();
        }
      case 'POST':
        return await createCourse(event.body);
      case 'PUT':
        if (!courseId) {
          return createErrorResponse(400, 'Course ID is required');
        }
        return await updateCourse(courseId, event.body);
      case 'DELETE':
        if (!courseId) {
          return createErrorResponse(400, 'Course ID is required');
        }
        return await deleteCourse(courseId);
      default:
        return createErrorResponse(405, 'Method not allowed');
    }

  } catch (error) {
    console.error('Courses handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

async function getCourse(courseId: string): Promise<APIGatewayProxyResult> {
  try {
    const course = await courseService.getCourseById(courseId);

    if (!course) {
      return createErrorResponse(404, 'Course not found');
    }

    return createSuccessResponse({ course });

  } catch (error) {
    console.error('Get course error:', error);
    return createErrorResponse(500, 'Failed to get course');
  }
}

async function getAllCourses(): Promise<APIGatewayProxyResult> {
  try {
    const courses = await courseService.getAllCourses();
    return createSuccessResponse({ courses });

  } catch (error) {
    console.error('Get all courses error:', error);
    return createErrorResponse(500, 'Failed to get courses');
  }
}

async function getCoursesByInstructor(instructorId: string): Promise<APIGatewayProxyResult> {
  try {
    const courses = await courseService.getCoursesByInstructor(instructorId);
    return createSuccessResponse({ courses });

  } catch (error) {
    console.error('Get courses by instructor error:', error);
    return createErrorResponse(500, 'Failed to get courses');
  }
}

async function createCourse(body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const courseData = JSON.parse(body) as CreateCourseRequest & { instructorId: string };
    
    if (!courseData.instructorId) {
      return createErrorResponse(400, 'Instructor ID is required');
    }

    const course = await courseService.createCourse(courseData.instructorId, courseData);
    return createSuccessResponse({ course }, 'Course created successfully');

  } catch (error) {
    console.error('Create course error:', error);
    return createErrorResponse(500, 'Failed to create course');
  }
}

async function updateCourse(courseId: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const updates = JSON.parse(body);
    const course = await courseService.updateCourse(courseId, updates);
    
    return createSuccessResponse({ course }, 'Course updated successfully');

  } catch (error) {
    console.error('Update course error:', error);
    return createErrorResponse(500, 'Failed to update course');
  }
}

async function deleteCourse(courseId: string): Promise<APIGatewayProxyResult> {
  try {
    await courseService.deleteCourse(courseId);
    return createSuccessResponse({}, 'Course deleted successfully');

  } catch (error) {
    console.error('Delete course error:', error);
    return createErrorResponse(500, 'Failed to delete course');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSuccessResponse(data: any, message?: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data,
      message
    } as ApiResponse)
  };
}

function createErrorResponse(statusCode: number, error: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error
    } as ApiResponse)
  };
}
