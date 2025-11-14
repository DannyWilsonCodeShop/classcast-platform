import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const instructorId = searchParams.get('instructorId');

    console.log('🔍 SEARCH: Searching courses...');
    console.log('🔍 SEARCH: Table name:', COURSES_TABLE);
    console.log('🔍 SEARCH: Search term:', searchTerm);
    console.log('🔍 SEARCH: Instructor ID:', instructorId);

    // Get ALL courses first
    const allCoursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    const allCourses = allCoursesResult.Items || [];
    console.log(`🔍 SEARCH: Total courses in database: ${allCourses.length}`);
    
    // Log all courses with their details
    allCourses.forEach((course, index) => {
      console.log(`🔍 SEARCH: Course ${index + 1}:`, {
        courseId: course.courseId,
        title: course.title,
        department: course.department,
        instructorId: course.instructorId,
        createdAt: course.createdAt,
        coInstructorEmail: course.coInstructorEmail,
        coInstructorName: course.coInstructorName
      });
    });

    // Filter courses based on search criteria
    let filteredCourses = allCourses;

    if (searchTerm) {
      filteredCourses = allCourses.filter(course => 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`🔍 SEARCH: Courses matching "${searchTerm}": ${filteredCourses.length}`);
    }

    if (instructorId) {
      const instructorCourses = allCourses.filter(course => 
        course.instructorId === instructorId
      );
      console.log(`🔍 SEARCH: Courses for instructor ${instructorId}: ${instructorCourses.length}`);
      
      instructorCourses.forEach((course, index) => {
        console.log(`🔍 SEARCH: Instructor course ${index + 1}:`, {
          courseId: course.courseId,
          title: course.title,
          instructorId: course.instructorId
        });
      });
    }

    // Look specifically for Chemistry courses
    const chemistryCourses = allCourses.filter(course => 
      course.title?.toLowerCase().includes('chemistry') ||
      course.department?.toLowerCase().includes('chemistry')
    );
    console.log(`🔍 SEARCH: Chemistry courses found: ${chemistryCourses.length}`);
    
    chemistryCourses.forEach((course, index) => {
      console.log(`🔍 SEARCH: Chemistry course ${index + 1}:`, {
        courseId: course.courseId,
        title: course.title,
        department: course.department,
        instructorId: course.instructorId,
        createdAt: course.createdAt
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCourses: allCourses.length,
        searchResults: filteredCourses.length,
        chemistryCourses: chemistryCourses.length,
        allCourses: allCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          department: course.department,
          instructorId: course.instructorId,
          coInstructorEmail: course.coInstructorEmail,
          coInstructorName: course.coInstructorName,
          createdAt: course.createdAt
        })),
        chemistryCourses: chemistryCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          department: course.department,
          instructorId: course.instructorId,
          coInstructorEmail: course.coInstructorEmail,
          coInstructorName: course.coInstructorName,
          createdAt: course.createdAt
        })),
        filteredCourses: filteredCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          department: course.department,
          instructorId: course.instructorId,
          createdAt: course.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('🔍 SEARCH: Error searching courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}