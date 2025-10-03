import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const { classCode, userId, sectionId } = await request.json();
    
    console.log('Enrollment request:', { classCode, userId, sectionId });

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

    // Find course by code (search both classCode and courseCode)
    let course = null;
    try {
      console.log('Searching for course with classCode:', normalizedClassCode);
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'classCode = :classCode OR courseCode = :courseCode',
        ExpressionAttributeValues: {
          ':classCode': normalizedClassCode,
          ':courseCode': normalizedClassCode
        }
      }));
      
      console.log('Course search result:', { 
        itemCount: coursesResult.Items?.length || 0,
        items: coursesResult.Items 
      });
      
      course = coursesResult.Items?.[0];
    } catch (dbError: any) {
      console.error('Database error during course search:', dbError);
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
    const isAlreadyEnrolled = currentStudents.some((student: any) => 
      (typeof student === 'string' && student === userId) ||
      (typeof student === 'object' && student.userId === userId)
    );
    
    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Add student to course with section information
    const studentEntry = {
      userId: userId,
      email: '', // Will be filled by the frontend
      firstName: '',
      lastName: '',
      enrolledAt: new Date().toISOString(),
      status: 'active',
      sectionId: sectionId || null // Add section ID if provided
    };
    
    const updatedStudents = [...currentStudents, studentEntry];
    const enrollmentDates = {
      ...course.enrollment?.enrollmentDates,
      [userId]: new Date().toISOString()
    };

    // Ensure enrollment object exists
    const enrollmentUpdate = {
      students: updatedStudents,
      enrollmentDates: enrollmentDates
    };

    console.log('Updating course enrollment:', {
      courseId: course.courseId,
      enrollmentUpdate
    });

    // Use SET to create or update the entire enrollment object and increment currentEnrollment
    await docClient.send(new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: course.courseId },
      UpdateExpression: 'SET enrollment = :enrollment, currentEnrollment = :currentEnrollment',
      ExpressionAttributeValues: {
        ':enrollment': enrollmentUpdate,
        ':currentEnrollment': updatedStudents.length
      }
    }));

    console.log('Course enrollment updated successfully');

    // If sectionId is provided, update section enrollment count
    if (sectionId) {
      try {
        // Update section enrollment count
        await docClient.send(new UpdateCommand({
          TableName: 'classcast-sections',
          Key: { sectionId },
          UpdateExpression: 'SET currentEnrollment = currentEnrollment + :increment',
          ExpressionAttributeValues: {
            ':increment': 1
          }
        }));
        console.log('Section enrollment count updated');
      } catch (sectionError) {
        console.error('Error updating section enrollment count:', sectionError);
        // Don't fail the enrollment if section update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${normalizedClassCode}${sectionId ? ' and assigned to section' : ''}`,
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