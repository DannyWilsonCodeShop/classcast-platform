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
    const instructorId = searchParams.get('instructorId');

    console.log('🔍 DEBUG: Checking courses table...');
    console.log('🔍 DEBUG: Table name:', COURSES_TABLE);
    console.log('🔍 DEBUG: Instructor ID:', instructorId);

    // Get ALL courses first to see what's in the table
    const allCoursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    const allCourses = allCoursesResult.Items || [];
    console.log(`🔍 DEBUG: Total courses in table: ${allCourses.length}`);
    
    // Log first few courses to see structure
    allCourses.slice(0, 3).forEach((course, index) => {
      console.log(`🔍 DEBUG: Course ${index + 1}:`, {
        courseId: course.courseId,
        title: course.title,
        instructorId: course.instructorId,
        createdAt: course.createdAt
      });
    });

    let filteredCourses = [];
    if (instructorId) {
      // Filter by instructor ID
      const filteredResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: {
          ':instructorId': instructorId
        }
      }));
      
      filteredCourses = filteredResult.Items || [];
      console.log(`🔍 DEBUG: Courses for instructor ${instructorId}: ${filteredCourses.length}`);
    }

    return NextResponse.json({
      success: true,
      debug: {
        tableName: COURSES_TABLE,
        instructorId,
        totalCourses: allCourses.length,
        filteredCourses: filteredCourses.length,
        allCourses: allCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          instructorId: course.instructorId,
          createdAt: course.createdAt
        })),
        filteredCourses: filteredCourses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          instructorId: course.instructorId,
          createdAt: course.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error checking courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to debug courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}