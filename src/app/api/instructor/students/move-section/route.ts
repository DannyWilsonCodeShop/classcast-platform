import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SECTIONS_TABLE = 'classcast-sections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, fromCourseId, toCourseId, toSectionId, studentName, studentEmail } = body;

    if (!studentId || !fromCourseId || !toCourseId || !toSectionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🔄 Moving student between sections:', {
      studentId,
      fromCourseId,
      toCourseId,
      toSectionId,
      studentName
    });

    // Get current course enrollment
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: fromCourseId }
    }));

    if (!courseResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseResult.Item;
    const enrollment = course.enrollment || { students: [] };

    // Find the student in the enrollment
    const studentIndex = enrollment.students.findIndex((student: any) => {
      if (typeof student === 'string') {
        return student === studentId;
      } else if (typeof student === 'object' && student.userId) {
        return student.userId === studentId;
      }
      return false;
    });

    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Student not found in course enrollment' },
        { status: 404 }
      );
    }

    // Get target section info
    const sectionResult = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId: toSectionId }
    }));

    if (!sectionResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Target section not found' },
        { status: 404 }
      );
    }

    const targetSection = sectionResult.Item;

    // Update student's section in the enrollment
    const updatedStudent = typeof enrollment.students[studentIndex] === 'string' 
      ? {
          userId: studentId,
          sectionId: toSectionId,
          sectionName: targetSection.sectionName,
          enrolledAt: new Date().toISOString()
        }
      : {
          ...enrollment.students[studentIndex],
          sectionId: toSectionId,
          sectionName: targetSection.sectionName,
          movedAt: new Date().toISOString()
        };

    enrollment.students[studentIndex] = updatedStudent;

    // Update the course with new enrollment data
    await docClient.send(new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: fromCourseId },
      UpdateExpression: 'SET enrollment = :enrollment, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':enrollment': enrollment,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log('✅ Student moved to new section successfully');

    return NextResponse.json({
      success: true,
      message: `Student moved to section ${targetSection.sectionName} successfully`,
      data: {
        studentId,
        newSectionId: toSectionId,
        newSectionName: targetSection.sectionName
      }
    });

  } catch (error) {
    console.error('Error moving student to section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to move student to section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}