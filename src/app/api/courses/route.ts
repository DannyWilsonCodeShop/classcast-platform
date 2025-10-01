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
      
      courses = coursesResult.Items || [];
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
      { error: 'Failed to fetch courses' },
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

    // Generate course ID
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create course object
    const course = {
      courseId,
      title,
      description,
      code,
      classCode,
      department,
      credits: credits || 3,
      semester,
      year: year || new Date().getFullYear(),
      instructorId,
      maxStudents: maxStudents || 30,
      startDate,
      endDate,
      prerequisites: prerequisites || [],
      learningObjectives: learningObjectives || [],
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
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}