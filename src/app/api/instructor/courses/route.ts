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
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching courses for instructor ID:', instructorId);

    // Get courses for the specific instructor
    const result = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    }));

    const courses = result.Items || [];
    console.log(`Found ${courses.length} courses for instructor ${instructorId}`);

    // If no courses found, let's also check for courses with different instructor ID patterns
    let allCourses = [];
    if (courses.length === 0) {
      console.log('No courses found with exact instructor ID match, checking all courses...');
      const allCoursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));
      allCourses = allCoursesResult.Items || [];
      console.log(`Found ${allCourses.length} total courses in database`);
      console.log('All instructor IDs in database:', allCourses.map(c => c.instructorId));
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course.courseId,
          courseId: course.courseId,
          title: course.title || course.courseName,
          courseName: course.courseName || course.title,
          description: course.description,
          studentCount: course.enrollment?.students?.length || 0,
          assignmentsDue: 0, // This would need to be calculated from assignments
          icon: course.icon || '📚',
          subject: course.subject || 'General',
          semester: course.semester,
          year: course.year,
          status: course.status || 'active',
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        })),
        debug: {
          requestedInstructorId: instructorId,
          coursesFound: courses.length,
          allInstructorIds: allCourses.map(c => c.instructorId),
          allCourseIds: allCourses.map(c => c.courseId)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
