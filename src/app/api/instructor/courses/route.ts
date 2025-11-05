import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';

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

    // Get all courses for this instructor
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    }));

    const courses = (coursesResult.Items || []).map(course => ({
      courseId: course.courseId,
      courseName: course.courseName || course.title,
      courseCode: course.courseCode || course.code,
      description: course.description,
      semester: course.semester,
      year: course.year,
      status: course.status,
      enrollmentCount: course.currentEnrollment || course.enrollmentCount || 0,
      maxEnrollment: course.maxEnrollment || course.maxStudents,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

    console.log(`📊 Found ${courses.length} courses for instructor`);

    return NextResponse.json({
      success: true,
      courses: courses
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