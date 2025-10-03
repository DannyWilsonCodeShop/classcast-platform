import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SECTIONS_TABLE = 'classcast-sections';
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

// GET /api/sections/[sectionId]/enrollments - Get students enrolled in a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    
    console.log('Fetching enrollments for section:', sectionId);

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // First, get the section details
    const sectionResult = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    if (!sectionResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    const section = sectionResult.Item;
    console.log('Section found:', section.sectionName);

    // Get the course to find enrolled students
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: section.courseId }
    }));

    if (!courseResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseResult.Item;
    console.log('Course found:', course.title);

    // Get all students enrolled in this course
    const enrolledStudents = course.enrollment?.students || [];
    console.log('Total enrolled students in course:', enrolledStudents.length);

    // Filter students by section (if they have sectionId property)
    // For now, we'll return all students in the course since we need to implement
    // section-specific enrollment tracking
    const sectionStudents = enrolledStudents.filter((student: any) => {
      // If student has sectionId, check if it matches
      if (student.sectionId) {
        return student.sectionId === sectionId;
      }
      // For now, return all students until we implement section-specific enrollment
      return true;
    });

    console.log('Students in section:', sectionStudents.length);

    // Get detailed user information for each student
    const studentsWithDetails = [];
    for (const student of sectionStudents) {
      try {
        const userResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: student.userId }
        }));

        if (userResult.Item) {
          studentsWithDetails.push({
            userId: student.userId,
            email: student.email || userResult.Item.email,
            firstName: student.firstName || userResult.Item.firstName,
            lastName: student.lastName || userResult.Item.lastName,
            enrolledAt: student.enrolledAt || student.enrollmentDates?.[student.userId] || new Date().toISOString(),
            status: student.status || 'active',
            avatar: userResult.Item.avatar,
            sectionId: student.sectionId || sectionId
          });
        }
      } catch (userError) {
        console.warn(`Failed to fetch user details for ${student.userId}:`, userError);
        // Add student with basic info if user details can't be fetched
        studentsWithDetails.push({
          userId: student.userId,
          email: student.email || 'unknown@email.com',
          firstName: student.firstName || 'Unknown',
          lastName: student.lastName || 'Student',
          enrolledAt: student.enrolledAt || new Date().toISOString(),
          status: student.status || 'active',
          avatar: undefined,
          sectionId: student.sectionId || sectionId
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: studentsWithDetails,
      count: studentsWithDetails.length,
      section: {
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        sectionCode: section.sectionCode,
        classCode: section.classCode,
        maxEnrollment: section.maxEnrollment,
        currentEnrollment: studentsWithDetails.length
      }
    });

  } catch (error) {
    console.error('Error fetching section enrollments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch section enrollments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}