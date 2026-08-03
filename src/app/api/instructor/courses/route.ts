import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;
const USERS_TABLE = awsConfig.dynamodb.tables.users;

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

    // Get all courses for this instructor
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    }));

    // Get all students to count enrollments per course
    const studentsResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': 'student' },
    }));

    // Build enrollment counts per course
    const enrollmentCounts: Record<string, number> = {};
    for (const student of studentsResult.Items || []) {
      const enrolled = student.enrolledCourses || [];
      for (const enrollment of enrolled) {
        const cId = typeof enrollment === 'string' ? enrollment : enrollment.courseId;
        if (cId) {
          enrollmentCounts[cId] = (enrollmentCounts[cId] || 0) + 1;
        }
      }
    }

    const courses = (coursesResult.Items || []).map(course => ({
      id: course.courseId,
      courseId: course.courseId,
      title: course.title,
      courseName: course.courseName || course.title,
      courseCode: course.courseCode || course.code,
      code: course.code || course.courseCode,
      classCode: course.classCode || '',
      description: course.description,
      semester: course.semester,
      year: course.year,
      status: course.status,
      studentCount: enrollmentCounts[course.courseId] || 0,
      enrollmentCount: enrollmentCounts[course.courseId] || 0,
      maxEnrollment: course.maxEnrollment || course.maxStudents,
      assignmentsDue: 0,
      backgroundColor: course.backgroundColor || course.settings?.backgroundColor || '#4A90E2',
      coInstructorEmail: course.coInstructorEmail,
      coInstructorName: course.coInstructorName,
      userRole: course.coInstructorEmail ? 'primary' : 'primary',
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

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