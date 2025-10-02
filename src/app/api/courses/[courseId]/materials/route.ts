import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSE_MATERIALS_TABLE = 'classcast-course-materials';
const USERS_TABLE = 'classcast-users';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // For now, return empty array since we don't have a course materials table yet
    // This prevents the frontend from showing loading states indefinitely
    const materials = [];

    return NextResponse.json({
      success: true,
      materials,
      count: materials.length
    });

  } catch (error) {
    console.error('Error fetching course materials:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch course materials',
        materials: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
