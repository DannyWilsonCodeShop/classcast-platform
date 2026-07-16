import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);
const COURSES_TABLE = awsConfig.dynamodb.tables.courses;
const USERS_TABLE = 'classcast-users';

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

    const normalizedInput = classCode.toUpperCase().trim();

    // Scan all courses to find the class code (could be on course or section)
    const scanResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
    }));

    let course: any = null;
    let matchedSectionId: string | null = null;
    let matchedSectionName: string | null = null;

    for (const item of scanResult.Items || []) {
      // Check course-level class code
      if (item.classCode && item.classCode.toUpperCase() === normalizedInput) {
        course = item;
        break;
      }
      // Check section-level class codes (inline sections array)
      const sections = item.sections || [];
      for (const sec of sections) {
        if (sec.classCode && sec.classCode.toUpperCase() === normalizedInput) {
          course = item;
          matchedSectionId = sec.sectionId || null;
          matchedSectionName = sec.sectionName || null;
          break;
        }
      }
      if (course) break;
    }

    // If not found in inline sections, check the classcast-sections table
    if (!course) {
      try {
        const sectionsResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-sections',
          FilterExpression: 'classCode = :code',
          ExpressionAttributeValues: { ':code': normalizedInput },
        }));
        if (sectionsResult.Items && sectionsResult.Items.length > 0) {
          const section = sectionsResult.Items[0];
          matchedSectionId = section.sectionId || null;
          matchedSectionName = section.sectionName || null;
          // Find the parent course
          const parentCourse = (scanResult.Items || []).find(c => c.courseId === section.courseId);
          if (parentCourse) {
            course = parentCourse;
          }
        }
      } catch (secErr) {
        console.warn('Error searching sections table:', secErr);
      }
    }

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

    // Check if enrollment is open
    if (course.settings?.enrollmentOpen === false) {
      return NextResponse.json(
        { success: false, error: 'Enrollment is currently closed for this course. Please contact your instructor.' },
        { status: 403 }
      );
    }

    // Check if course is full
    const currentEnrollment = course.currentEnrollment || 0;
    const maxStudents = course.maxStudents || 200;

    if (currentEnrollment >= maxStudents) {
      return NextResponse.json(
        { success: false, error: 'This course is full. Please contact the instructor.' },
        { status: 409 }
      );
    }

    // Enroll the student (include section info if matched via section code)
    const studentEntry: any = {
      userId: studentId,
      email: studentEmail || '',
      firstName: studentFirstName || '',
      lastName: studentLastName || '',
      enrolledAt: new Date().toISOString(),
      status: 'active',
    };

    if (matchedSectionId) {
      studentEntry.sectionId = matchedSectionId;
      studentEntry.sectionName = matchedSectionName;
    }

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

    // Assign school branding to student from the course instructor
    let instructor: any = null;
    try {
      if (course.instructorId) {
        const instructorResult = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': course.instructorId }
        }));
        instructor = instructorResult.Items?.[0];
        if (instructor && (instructor.schoolName || instructor.schoolLogo)) {
          await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId: studentId },
            UpdateExpression: 'SET schoolName = :schoolName, schoolLogo = :schoolLogo',
            ExpressionAttributeValues: {
              ':schoolName': instructor.schoolName || '',
              ':schoolLogo': instructor.schoolLogo || ''
            }
          }));
        }
      }
    } catch (schoolError) {
      console.error('Error assigning school branding:', schoolError);
    }

    return NextResponse.json({
      success: true,
      course: {
        courseId: course.courseId,
        title: course.title,
        code: course.code,
        sectionName: matchedSectionName,
      },
      school: instructor ? { schoolName: instructor.schoolName || '', schoolLogo: instructor.schoolLogo || '' } : undefined,
    });
  } catch (error) {
    console.error('Error joining course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
