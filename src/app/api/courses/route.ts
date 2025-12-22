import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';
import { isRequestFromDemoUser, getDemoTargetFromRequest } from '@/lib/demo-mode-middleware';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    
    // Handle demo mode - redirect to target user
    if (isRequestFromDemoUser(request)) {
      const demoTargetUser = getDemoTargetFromRequest(request);
      if (demoTargetUser) {
        userId = demoTargetUser;
        console.log(`🎭 Demo mode: Fetching courses for target user ${userId}`);
      }
    }
    
    // Get courses from database
    let courses = [];
    
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));
      
      let allCourses = coursesResult.Items || [];
      
      // If userId is provided, filter to show only courses the user is enrolled in
      if (userId) {
        courses = allCourses.filter(course => 
          course.enrollment?.students?.some((student: any) => student.userId === userId)
        );
        console.log(`📚 Found ${courses.length} courses for user ${userId}`);
      } else {
        // Filter out private courses from public search
        courses = allCourses.filter(course => 
          course.settings?.privacy !== 'private'
        );
      }
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: {
            courses: [],
            pagination: {
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 0,
            }
          }
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: 1,
          limit: 12,
          total: courses.length,
          totalPages: Math.ceil(courses.length / 12),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug: Log received data
    console.log('🔍 Courses API: Received course creation request:', {
      title: body.title,
      instructorId: body.instructorId,
      coInstructorEmail: body.coInstructorEmail,
      coInstructorName: body.coInstructorName,
      classCode: body.classCode,
      backgroundColor: body.backgroundColor,
      settings: body.settings
    });
    
    const {
      title,
      description,
      code,
      classCode,
      department,
      semester,
      year,
      instructorId,
      maxStudents,
      startDate,
      endDate,
      prerequisites,
      learningObjectives,
      gradingPolicy,
      resources,
      settings,
      backgroundColor, // Add backgroundColor from body
      coInstructorId, // NEW: Co-instructor support
      coInstructorEmail, // NEW: Co-instructor email
      coInstructorName // NEW: Co-instructor name
    } = body;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!instructorId || typeof instructorId !== 'string' || instructorId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course code is required' },
        { status: 400 }
      );
    }

    if (!classCode || typeof classCode !== 'string' || classCode.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Class code is required' },
        { status: 400 }
      );
    }


    if (maxStudents && (typeof maxStudents !== 'number' || maxStudents < 1 || maxStudents > 500)) {
      return NextResponse.json(
        { success: false, error: 'Max students must be a number between 1 and 500' },
        { status: 400 }
      );
    }

    if (year && (typeof year !== 'number' || year < 2020 || year > 2030)) {
      return NextResponse.json(
        { success: false, error: 'Year must be a number between 2020 and 2030' },
        { status: 400 }
      );
    }

    // Generate course ID
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create course object with sanitized data
    const course = {
      courseId,
      title: title.trim(),
      description: description?.trim() || '',
      code: code.trim(),
      classCode: classCode?.trim() || '',
      department: department?.trim() || '',
      credits: 3, // Default credits
      semester: semester || 'Fall+Spring',
      year: year || new Date().getFullYear(),
      backgroundColor: backgroundColor || '#4A90E2', // Add backgroundColor
      instructorId: instructorId.trim(),
      coInstructorId: coInstructorId?.trim() || null, // NEW: Add co-instructor
      coInstructorEmail: coInstructorEmail?.trim() || null,
      coInstructorName: coInstructorName?.trim() || null,
      maxStudents: maxStudents || 30,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
      gradingPolicy: gradingPolicy || {
        assignments: 40,
        quizzes: 20,
        exams: 30,
        participation: 5,
        final: 5,
      },
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '10:00 AM - 11:00 AM',
        location: 'TBD',
      },
      resources: resources || {
        textbooks: [],
        materials: [],
      },
      settings: {
        allowLateSubmissions: true,
        latePenalty: 10,
        allowResubmissions: false,
        enableDiscussions: true,
        enableAnnouncements: true,
        privacy: 'public', // Default to public for backward compatibility
        backgroundColor: backgroundColor || '#4A90E2',
        ...(settings || {})
      },
      status: 'published', // Set course as published so students can enroll
      currentEnrollment: 0, // Initialize enrollment count
      enrollment: {
        students: [], // Initialize empty students array
        enrollmentDates: {} // Track when each student enrolled
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save to database
    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: course
    }));

    console.log('✅ Course created successfully:', {
      courseId: course.courseId,
      title: course.title,
      instructorId: course.instructorId,
      coInstructorEmail: course.coInstructorEmail,
      coInstructorName: course.coInstructorName,
      backgroundColor: course.backgroundColor,
      tableName: COURSES_TABLE
    });

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}