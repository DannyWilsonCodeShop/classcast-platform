import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;
const USERS_TABLE = awsConfig.dynamodb.tables.users;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 INSTRUCTORS: Checking instructor data...');

    // Get all courses to see what instructor IDs are used
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    const courses = coursesResult.Items || [];
    const instructorIds = [...new Set(courses.map(course => course.instructorId).filter(Boolean))];
    
    console.log(`🔍 INSTRUCTORS: Found ${instructorIds.length} unique instructor IDs in courses:`, instructorIds);

    // Get all users to see what instructor accounts exist
    let users = [];
    try {
      const usersResult = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE
      }));
      users = usersResult.Items || [];
    } catch (error) {
      console.log('🔍 INSTRUCTORS: Could not access users table:', error);
    }

    const instructorUsers = users.filter(user => user.role === 'instructor');
    console.log(`🔍 INSTRUCTORS: Found ${instructorUsers.length} instructor users:`, 
      instructorUsers.map(user => ({ id: user.userId, email: user.email, name: `${user.firstName} ${user.lastName}` }))
    );

    // Cross-reference courses with instructor users
    const coursesByInstructor = {};
    instructorIds.forEach(instructorId => {
      const instructorCourses = courses.filter(course => course.instructorId === instructorId);
      const instructorUser = instructorUsers.find(user => user.userId === instructorId);
      
      coursesByInstructor[instructorId] = {
        instructorId,
        instructorUser: instructorUser ? {
          email: instructorUser.email,
          name: `${instructorUser.firstName} ${instructorUser.lastName}`
        } : null,
        courseCount: instructorCourses.length,
        courses: instructorCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          department: course.department,
          createdAt: course.createdAt
        }))
      };
    });

    console.log('🔍 INSTRUCTORS: Courses by instructor:', coursesByInstructor);

    return NextResponse.json({
      success: true,
      data: {
        totalCourses: courses.length,
        uniqueInstructorIds: instructorIds.length,
        instructorUsers: instructorUsers.length,
        instructorIds,
        instructorUsers: instructorUsers.map(user => ({
          userId: user.userId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        })),
        coursesByInstructor
      }
    });

  } catch (error) {
    console.error('🔍 INSTRUCTORS: Error checking instructors:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check instructors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}