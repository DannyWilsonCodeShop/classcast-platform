import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '../../../lib/dynamodb';
import { Course, CreateCourseData, UpdateCourseData } from '../../../types/course';
import { RealtimeNotifier } from '../websocket/route';

// GET /api/courses - Get courses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter expression
    let filterExpression = '';
    const expressionAttributeValues: any = {};

    if (instructorId) {
      filterExpression = 'instructorId = :instructorId';
      expressionAttributeValues[':instructorId'] = instructorId;
    }

    if (department) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'department = :department';
      expressionAttributeValues[':department'] = department;
    }

    if (semester) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'semester = :semester';
      expressionAttributeValues[':semester'] = semester;
    }

    if (year) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += '#year = :year';
      expressionAttributeValues[':year'] = parseInt(year);
    }

    if (status) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += '#status = :status';
      expressionAttributeValues[':status'] = status;
    }

    if (search) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'contains(title, :search) OR contains(description, :search) OR contains(code, :search)';
      expressionAttributeValues[':search'] = search;
    }

    // Build scan parameters
    const scanParams: any = {
      TableName: 'classcast-courses',
      Limit: limit * 2, // Get more to account for filtering
    };

    if (filterExpression) {
      scanParams.FilterExpression = filterExpression;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
      scanParams.ExpressionAttributeNames = {
        '#year': 'year',
        '#status': 'status',
      };
    }

    // Get courses
    const response = await dynamoDBService.scan(scanParams);
    let courses = response.Items || [];

    // Sort courses
    courses.sort((a: any, b: any) => {
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
    const paginatedCourses = courses.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        courses: paginatedCourses,
        pagination: {
          page,
          limit,
          total: courses.length,
          totalPages: Math.ceil(courses.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courseData: CreateCourseData = body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'code', 'department', 'credits', 'semester', 'year', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !courseData[field as keyof CreateCourseData]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate course ID
    const courseId = `${courseData.code.toLowerCase().replace(/\s+/g, '-')}-${courseData.semester.toLowerCase().replace(/\s+/g, '-')}-${courseData.year}`;

    // Check if course already exists
    try {
      const existingCourse = await dynamoDBService.get({
        TableName: 'classcast-courses',
        Key: { courseId },
      });

      if (existingCourse.Item) {
        return NextResponse.json(
          {
            success: false,
            error: 'Course with this code already exists for this semester',
          },
          { status: 409 }
        );
      }
    } catch (error) {
      // Course doesn't exist, continue
    }

    // Get instructor details (in a real app, this would come from auth context)
    const instructorId = 'current-instructor'; // This should be set from auth context
    const instructorName = 'Current Instructor'; // This should be set from auth context
    const instructorEmail = 'instructor@classcast.com'; // This should be set from auth context

    // Create course object
    const course: Course = {
      courseId,
      title: courseData.title,
      description: courseData.description,
      code: courseData.code,
      department: courseData.department,
      credits: courseData.credits,
      semester: courseData.semester,
      year: courseData.year,
      instructorId,
      instructorName,
      instructorEmail,
      status: 'draft',
      startDate: new Date(courseData.startDate).toISOString(),
      endDate: new Date(courseData.endDate).toISOString(),
      maxStudents: courseData.maxStudents || 30,
      currentEnrollment: 0,
      prerequisites: courseData.prerequisites || [],
      learningObjectives: courseData.learningObjectives || [],
      gradingPolicy: courseData.gradingPolicy || {
        assignments: 40,
        quizzes: 20,
        exams: 30,
        participation: 5,
        final: 5,
      },
      schedule: courseData.schedule || {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '10:00 AM - 11:00 AM',
        location: 'TBD',
      },
      resources: courseData.resources || {
        textbooks: [],
        materials: [],
      },
      settings: courseData.settings || {
        allowLateSubmissions: true,
        latePenalty: 10,
        allowResubmissions: false,
        requireAttendance: false,
        enableDiscussions: true,
        enableAnnouncements: true,
      },
      enrollment: {
        students: [],
        waitlist: [],
      },
      statistics: {
        totalAssignments: 0,
        totalSubmissions: 0,
        averageGrade: 0,
        completionRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: instructorId,
    };

    // Save to DynamoDB
    await dynamoDBService.put({
      TableName: 'classcast-courses',
      Item: course,
    });

    // Send real-time notification
    try {
      await RealtimeNotifier.notifyAnnouncement({
        type: 'course_created',
        title: 'New Course Created',
        message: `Course "${course.title}" has been created and is ready for enrollment`,
        courseId: course.courseId,
        instructorId: course.instructorId,
      });
    } catch (notificationError) {
      console.error('Failed to send real-time notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully',
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/courses - Update a course
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, ...updateData }: { courseId: string } & UpdateCourseData = body;

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID is required',
        },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();

    // Update course in DynamoDB
    const updateExpression = 'SET ' + Object.keys(updateData)
      .map(key => `#${key} = :${key}`)
      .join(', ');

    const expressionAttributeNames = Object.keys(updateData).reduce((acc, key) => {
      acc[`#${key}`] = key;
      return acc;
    }, {} as any);

    const expressionAttributeValues = Object.keys(updateData).reduce((acc, key) => {
      acc[`:${key}`] = updateData[key];
      return acc;
    }, {} as any);

    await dynamoDBService.update({
      TableName: 'classcast-courses',
      Key: { courseId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    // Send real-time notification if course was published
    if (updateData.status === 'published') {
      try {
        await RealtimeNotifier.notifyAnnouncement({
          type: 'course_published',
          title: 'Course Published',
          message: `Course "${updateData.title || courseId}" is now available for enrollment`,
          courseId,
        });
      } catch (notificationError) {
        console.error('Failed to send real-time notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses - Delete a course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID is required',
        },
        { status: 400 }
      );
    }

    // Check if course has enrolled students
    const course = await dynamoDBService.get({
      TableName: 'classcast-courses',
      Key: { courseId },
    });

    if (course.Item && course.Item.enrollment?.students?.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete course with enrolled students. Please archive it instead.',
        },
        { status: 400 }
      );
    }

    // Delete course from DynamoDB
    await dynamoDBService.delete({
      TableName: 'classcast-courses',
      Key: { courseId },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
