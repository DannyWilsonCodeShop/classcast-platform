import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';

export async function GET(request: NextRequest) {
  try {
    // Get courses from database
    let courses = [];
    
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));
      
      courses = coursesResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: {
            courses: [],
            pagination: {
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 0,
            }
          }
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: 1,
          limit: 12,
          total: courses.length,
          totalPages: Math.ceil(courses.length / 12),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}