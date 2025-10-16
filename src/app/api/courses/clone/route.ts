import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

// Helper function to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceCourseId, name, code, description } = body;

    if (!sourceCourseId || !name || !code) {
      return NextResponse.json(
        { error: 'Source course ID, name, and code are required' },
        { status: 400 }
      );
    }

    console.log('Cloning course:', { sourceCourseId, newName: name, newCode: code });

    // 1. Get the source course
    const sourceCourseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: sourceCourseId }
    }));

    const sourceCourse = sourceCourseResult.Item;
    if (!sourceCourse) {
      return NextResponse.json(
        { error: 'Source course not found' },
        { status: 404 }
      );
    }

    console.log('Found source course:', sourceCourse.name);

    // 2. Create the new course
    const newCourseId = generateId('course');
    const newCourse = {
      ...sourceCourse,
      courseId: newCourseId,
      id: newCourseId,
      name: name,
      code: code,
      description: description || sourceCourse.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Don't copy enrollment data
      enrolledStudents: [],
      studentCount: 0,
      // Keep instructor and co-instructor info
      instructorId: sourceCourse.instructorId,
      coInstructorId: sourceCourse.coInstructorId || null,
    };

    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: newCourse
    }));

    console.log('Created new course:', newCourseId);

    // 3. Get all assignments from the source course
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': sourceCourseId
      }
    }));

    const sourceAssignments = assignmentsResult.Items || [];
    console.log('Found assignments to clone:', sourceAssignments.length);

    // 4. Clone each assignment
    const clonedAssignments = await Promise.all(
      sourceAssignments.map(async (assignment) => {
        const newAssignmentId = generateId('assignment');
        const newAssignment = {
          ...assignment,
          assignmentId: newAssignmentId,
          id: newAssignmentId,
          courseId: newCourseId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Reset submission-related fields
          submissionCount: 0,
          gradedCount: 0,
          // Keep assignment settings, rubrics, etc.
        };

        await docClient.send(new PutCommand({
          TableName: ASSIGNMENTS_TABLE,
          Item: newAssignment
        }));

        console.log('Cloned assignment:', assignment.title, '→', newAssignmentId);
        return newAssignment;
      })
    );

    console.log('Successfully cloned course with', clonedAssignments.length, 'assignments');

    return NextResponse.json({
      success: true,
      message: 'Course cloned successfully',
      course: {
        id: newCourseId,
        name: newCourse.name,
        code: newCourse.code,
        assignmentsCloned: clonedAssignments.length
      }
    });

  } catch (error) {
    console.error('Error cloning course:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clone course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

