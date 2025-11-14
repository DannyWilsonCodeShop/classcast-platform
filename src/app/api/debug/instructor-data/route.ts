import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// GET /api/debug/instructor-data - Debug instructor's courses and submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');

    if (!instructorId) {
      return NextResponse.json({
        success: false,
        error: 'instructorId parameter is required'
      }, { status: 400 });
    }

    console.log('🔍 Debugging instructor data for:', instructorId);

    // 1. Check if instructor exists in users table
    const instructorScanCommand = new ScanCommand({
      TableName: 'classcast-users',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': instructorId
      }
    });

    const instructorResult = await docClient.send(instructorScanCommand);
    const instructor = instructorResult.Items?.[0] || null;

    console.log('👤 Instructor found:', !!instructor);
    if (instructor) {
      console.log('👤 Instructor details:', {
        name: `${instructor.firstName} ${instructor.lastName}`,
        email: instructor.email,
        role: instructor.role
      });
    }

    // 2. Get all courses for this instructor
    const coursesScanCommand = new ScanCommand({
      TableName: 'classcast-courses',
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    });

    const coursesResult = await docClient.send(coursesScanCommand);
    const courses = coursesResult.Items || [];
    const courseIds = courses.map(course => course.courseId);

    console.log('📚 Courses found:', courses.length);
    console.log('📚 Course IDs:', courseIds);

    // 3. Get all assignments for instructor's courses
    let assignments: any[] = [];
    if (courseIds.length > 0) {
      const courseConditions = courseIds.map((_, index) => `courseId = :courseId${index}`).join(' OR ');
      let filterExpression = `(${courseConditions})`;
      
      let expressionAttributeValues: any = {};
      courseIds.forEach((courseId, index) => {
        expressionAttributeValues[`:courseId${index}`] = courseId;
      });

      const assignmentsScanCommand = new ScanCommand({
        TableName: 'classcast-assignments',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const assignmentsResult = await docClient.send(assignmentsScanCommand);
      assignments = assignmentsResult.Items || [];
    }

    console.log('📝 Assignments found:', assignments.length);

    // 4. Get all submissions for instructor's courses
    let submissions: any[] = [];
    if (courseIds.length > 0) {
      const courseConditions = courseIds.map((_, index) => `courseId = :courseId${index}`).join(' OR ');
      let filterExpression = `(${courseConditions})`;
      
      let expressionAttributeValues: any = {};
      courseIds.forEach((courseId, index) => {
        expressionAttributeValues[`:courseId${index}`] = courseId;
      });

      const submissionsScanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const submissionsResult = await docClient.send(submissionsScanCommand);
      submissions = submissionsResult.Items || [];
    }

    console.log('📹 Submissions found:', submissions.length);

    // 5. Get all students enrolled in instructor's courses
    let enrolledStudents: any[] = [];
    for (const course of courses) {
      if (course.students && Array.isArray(course.students)) {
        enrolledStudents.push(...course.students.map((student: any) => ({
          ...student,
          courseName: course.courseName,
          courseId: course.courseId
        })));
      }
    }

    console.log('👥 Enrolled students found:', enrolledStudents.length);

    return NextResponse.json({
      success: true,
      debug: {
        instructorId,
        instructor: instructor ? {
          name: `${instructor.firstName} ${instructor.lastName}`,
          email: instructor.email,
          role: instructor.role,
          userId: instructor.userId
        } : null,
        courses: courses.map(course => ({
          courseId: course.courseId,
          courseName: course.courseName,
          courseCode: course.courseCode,
          instructorId: course.instructorId,
          studentsCount: course.students?.length || 0
        })),
        assignments: assignments.map(assignment => ({
          assignmentId: assignment.assignmentId,
          title: assignment.title,
          courseId: assignment.courseId,
          status: assignment.status
        })),
        submissions: submissions.map(submission => ({
          submissionId: submission.submissionId,
          assignmentId: submission.assignmentId,
          courseId: submission.courseId,
          studentId: submission.studentId,
          status: submission.status,
          hasVideo: !!submission.videoUrl
        })),
        enrolledStudents: enrolledStudents.map(student => ({
          userId: student.userId,
          email: student.email,
          courseName: student.courseName,
          courseId: student.courseId
        })),
        summary: {
          coursesCount: courses.length,
          assignmentsCount: assignments.length,
          submissionsCount: submissions.length,
          studentsCount: enrolledStudents.length
        }
      }
    });

  } catch (error) {
    console.error('Error debugging instructor data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug instructor data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}