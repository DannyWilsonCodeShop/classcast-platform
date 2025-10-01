import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SECTION_ENROLLMENTS_TABLE = 'classcast-section-enrollments';
const SECTIONS_TABLE = 'classcast-sections';
const USERS_TABLE = 'classcast-users';

// GET /api/sections/[sectionId]/enrollments - Get enrollments for a section
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let enrollments = [];

    const result = await docClient.send(new QueryCommand({
      TableName: SECTION_ENROLLMENTS_TABLE,
      IndexName: 'sectionId-index',
      KeyConditionExpression: 'sectionId = :sectionId',
      ExpressionAttributeValues: {
        ':sectionId': sectionId
      }
    }));

    enrollments = result.Items || [];

    // Apply status filter
    if (status) {
      enrollments = enrollments.filter(enrollment => enrollment.status === status);
    }

    // Enrich with student information
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          const studentResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: enrollment.studentId }
          }));

          return {
            ...enrollment,
            studentName: studentResult.Item?.firstName + ' ' + studentResult.Item?.lastName,
            studentEmail: studentResult.Item?.email
          };
        } catch (error) {
          console.error('Error fetching student info:', error);
          return enrollment;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedEnrollments,
      count: enrichedEnrollments.length
    });

  } catch (error) {
    console.error('Error fetching section enrollments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch section enrollments' 
      },
      { status: 500 }
    );
  }
}

// POST /api/sections/[sectionId]/enrollments - Enroll a student in a section
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student ID is required' 
        },
        { status: 400 }
      );
    }

    // Check if section exists and is active
    const sectionResult = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    if (!sectionResult.Item) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section not found' 
        },
        { status: 404 }
      );
    }

    if (!sectionResult.Item.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section is not active' 
        },
        { status: 400 }
      );
    }

    // Check if section is at capacity
    if (sectionResult.Item.currentEnrollment >= sectionResult.Item.maxEnrollment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section is at maximum capacity' 
        },
        { status: 400 }
      );
    }

    // Check if student is already enrolled
    const existingEnrollment = await docClient.send(new QueryCommand({
      TableName: SECTION_ENROLLMENTS_TABLE,
      IndexName: 'sectionId-studentId-index',
      KeyConditionExpression: 'sectionId = :sectionId AND studentId = :studentId',
      ExpressionAttributeValues: {
        ':sectionId': sectionId,
        ':studentId': studentId
      }
    }));

    if (existingEnrollment.Items && existingEnrollment.Items.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student is already enrolled in this section' 
        },
        { status: 400 }
      );
    }

    const enrollmentId = uuidv4();
    const now = new Date().toISOString();

    const enrollment = {
      enrollmentId,
      sectionId,
      studentId,
      enrolledAt: now,
      status: 'active'
    };

    // Create enrollment
    await docClient.send(new PutCommand({
      TableName: SECTION_ENROLLMENTS_TABLE,
      Item: enrollment
    }));

    // Update section enrollment count
    await docClient.send(new UpdateCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId },
      UpdateExpression: 'SET currentEnrollment = currentEnrollment + :inc, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updatedAt': now
      }
    }));

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Student enrolled successfully'
    });

  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enroll student' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[sectionId]/enrollments - Remove a student from a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student ID is required' 
        },
        { status: 400 }
      );
    }

    // Find the enrollment
    const enrollmentResult = await docClient.send(new QueryCommand({
      TableName: SECTION_ENROLLMENTS_TABLE,
      IndexName: 'sectionId-studentId-index',
      KeyConditionExpression: 'sectionId = :sectionId AND studentId = :studentId',
      ExpressionAttributeValues: {
        ':sectionId': sectionId,
        ':studentId': studentId
      }
    }));

    if (!enrollmentResult.Items || enrollmentResult.Items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enrollment not found' 
        },
        { status: 404 }
      );
    }

    const enrollment = enrollmentResult.Items[0];

    // Delete enrollment
    await docClient.send(new DeleteCommand({
      TableName: SECTION_ENROLLMENTS_TABLE,
      Key: { enrollmentId: enrollment.enrollmentId }
    }));

    // Update section enrollment count
    await docClient.send(new UpdateCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId },
      UpdateExpression: 'SET currentEnrollment = currentEnrollment - :dec, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':updatedAt': new Date().toISOString()
      }
    }));

    return NextResponse.json({
      success: true,
      message: 'Student removed from section successfully'
    });

  } catch (error) {
    console.error('Error removing student from section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove student from section' 
      },
      { status: 500 }
    );
  }
}
