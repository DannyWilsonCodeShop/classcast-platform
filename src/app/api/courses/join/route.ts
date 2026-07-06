import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);
const COURSES_TABLE = awsConfig.dynamodb.tables.courses;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classCode, studentId, studentEmail, studentFirstName, studentLastName } = body;

    if (!classCode || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Class code and student ID are required' },
        { status: 400 }
      );
    }

    // Scan for a course matching the class code (case-insensitive)
    const scanResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'attribute_exists(classCode)',
    }));

    const normalizedInput = classCode.toUpperCase().trim();
    const course = scanResult.Items?.find(
      (item) => item.classCode && item.classCode.toUpperCase() === normalizedInput
    );

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'No course found with that class code' },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    const students = course.enrollment?.students || [];
    const alreadyEnrolled = students.some(
      (s: { userId: string }) => s.userId === studentId
    );

    if (alreadyEnrolled) {
      return NextResponse.json(
        { success: false, error: 'You are already enrolled in this course' },
        { status: 409 }
      );
    }

    // Check if course is full
    const currentEnrollment = course.currentEnrollment || 0;
    const maxStudents = course.maxStudents || 30;

    if (currentEnrollment >= maxStudents) {
      return NextResponse.json(
        { success: false, error: 'This course is full. Please contact the instructor.' },
        { status: 409 }
      );
    }

    // Enroll the student
    const studentEntry = {
      userId: studentId,
      email: studentEmail || '',
      firstName: studentFirstName || '',
      lastName: studentLastName || '',
      enrolledAt: new Date().toISOString(),
      status: 'active',
    };

    await docClient.send(new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: course.courseId },
      UpdateExpression: 'SET enrollment.students = list_append(if_not_exists(enrollment.students, :empty_list), :student), currentEnrollment = if_not_exists(currentEnrollment, :zero) + :one, updatedAt = :now',
      ExpressionAttributeValues: {
        ':student': [studentEntry],
        ':empty_list': [],
        ':zero': 0,
        ':one': 1,
        ':now': new Date().toISOString(),
      },
    }));

    return NextResponse.json({
      success: true,
      course: {
        courseId: course.courseId,
        title: course.title,
        code: course.code,
      },
    });
  } catch (error) {
    console.error('Error joining course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
