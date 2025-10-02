import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';

export async function GET(request: NextRequest) {
  try {
    // Get courses from database
    let courses = [];
    
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));
      
      // Filter out private courses from public search
      courses = (coursesResult.Items || []).filter(course => 
        course.settings?.privacy !== 'private'
      );
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
    const {
      title,
      description,
      code,
      classCode,
      department,
      credits,
      semester,
      year,
      instructorId,
      maxStudents,
      startDate,
      endDate,
      prerequisites,
      learningObjectives,
      gradingPolicy,
      schedule,
      resources,
      settings
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

    if (credits && (typeof credits !== 'number' || credits < 1 || credits > 6)) {
      return NextResponse.json(
        { success: false, error: 'Credits must be a number between 1 and 6' },
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
      classCode: classCode.trim(),
      department: department?.trim() || '',
      credits: credits || 3,
      semester: semester || 'Spring',
      year: year || new Date().getFullYear(),
      instructorId: instructorId.trim(),
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
      schedule: schedule || {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '10:00 AM - 11:00 AM',
        location: 'TBD',
      },
      resources: resources || {
        textbooks: [],
        materials: [],
      },
      settings: settings || {
        allowLateSubmissions: true,
        latePenalty: 10,
        allowResubmissions: false,
        enableDiscussions: true,
        enableAnnouncements: true,
        privacy: 'public', // Default to public for backward compatibility
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