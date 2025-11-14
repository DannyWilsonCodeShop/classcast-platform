import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');

    if (!instructorId) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    console.log('📚 Fetching courses for instructor:', instructorId);
    console.log('📚 Using table:', COURSES_TABLE);

    // First, get all courses to see what's in the table
    const allCoursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));
    
    console.log(`📚 Total courses in table: ${(allCoursesResult.Items || []).length}`);
    
    // Log a few courses to see the structure
    (allCoursesResult.Items || []).slice(0, 2).forEach((course, index) => {
      console.log(`📚 Sample course ${index + 1}:`, {
        courseId: course.courseId,
        title: course.title,
        instructorId: course.instructorId,
        createdAt: course.createdAt
      });
    });

    // Get all courses for this instructor
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    }));

    const courses = (coursesResult.Items || []).map(course => ({
      id: course.courseId, // Dashboard expects 'id'
      courseId: course.courseId,
      title: course.title, // Dashboard expects 'title'
      courseName: course.courseName || course.title,
      courseCode: course.courseCode || course.code,
      description: course.description,
      semester: course.semester,
      year: course.year,
      status: course.status,
      studentCount: course.currentEnrollment || course.enrollmentCount || 0, // Dashboard expects 'studentCount'
      enrollmentCount: course.currentEnrollment || course.enrollmentCount || 0,
      maxEnrollment: course.maxEnrollment || course.maxStudents,
      assignmentsDue: 0, // Dashboard expects this field
      backgroundColor: course.backgroundColor || course.settings?.backgroundColor || '#4A90E2',
      // Co-instructor info
      coInstructorEmail: course.coInstructorEmail,
      coInstructorName: course.coInstructorName,
      userRole: course.coInstructorEmail ? 'primary' : 'primary', // Could be enhanced to detect co-instructor role
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

    console.log(`📊 Found ${courses.length} courses for instructor`);

    return NextResponse.json({
      success: true,
      data: {
        courses: courses
      }
    });

  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch instructor courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}