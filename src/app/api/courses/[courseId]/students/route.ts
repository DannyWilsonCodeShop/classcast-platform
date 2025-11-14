import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get course details
    const courseResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    if (!courseResult.Items || courseResult.Items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseResult.Items[0];
    const studentIds = course.enrollment?.students || [];

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Get student details
    const students = await Promise.all(
      studentIds.map(async (studentId: string) => {
        try {
          const studentResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: studentId }
          }));

          if (studentResult.Item) {
            return {
              studentId: studentResult.Item.userId,
              name: `${studentResult.Item.firstName || ''} ${studentResult.Item.lastName || ''}`.trim() || 'Unknown Student',
              email: studentResult.Item.email || '',
              avatar: studentResult.Item.avatar || '/api/placeholder/40/40',
              enrollmentDate: course.enrollment?.enrollmentDates?.[studentId] || new Date().toISOString(),
              status: 'active',
              grade: null
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching student ${studentId}:`, error);
          return {
            studentId,
            name: 'Unknown Student',
            email: '',
            avatar: '/api/placeholder/40/40',
            enrollmentDate: new Date().toISOString(),
            status: 'active',
            grade: null
          };
        }
      })
    );

    // Filter out null results
    const validStudents = students.filter(student => student !== null);

    return NextResponse.json({
      success: true,
      data: validStudents
    });

  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
