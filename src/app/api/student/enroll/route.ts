import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const { classCode, userId } = await request.json();

    if (!classCode || typeof classCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Class code is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Normalize the class code
    const normalizedClassCode = classCode.trim().toUpperCase();

    if (normalizedClassCode.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Class code must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Find course by code
    let course = null;
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'classCode = :classCode',
        ExpressionAttributeValues: {
          ':classCode': normalizedClassCode
        }
      }));
      
      course = coursesResult.Items?.[0];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }
      throw dbError;
    }

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    const currentStudents = course.enrollment?.students || [];
    if (currentStudents.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Add student to course
    const updatedStudents = [...currentStudents, userId];
    const enrollmentDates = {
      ...course.enrollment?.enrollmentDates,
      [userId]: new Date().toISOString()
    };

    await docClient.send(new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: course.courseId },
      UpdateExpression: 'SET enrollment.students = :students, enrollment.enrollmentDates = :enrollmentDates',
      ExpressionAttributeValues: {
        ':students': updatedStudents,
        ':enrollmentDates': enrollmentDates
      }
    }));

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${normalizedClassCode}`,
      class: {
        id: course.courseId,
        code: course.code,
        name: course.title,
        description: course.description,
        instructor: course.instructorName,
        startDate: course.startDate,
        endDate: course.endDate,
        progress: 0,
        assignmentCount: 0,
        studentCount: updatedStudents.length,
      },
    });

  } catch (error) {
    console.error('Error enrolling in class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in class' },
      { status: 500 }
    );
  }
}