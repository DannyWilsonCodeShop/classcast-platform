import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    // Get course from database
    let course = null;
    
    try {
      const courseResult = await docClient.send(new GetCommand({
        TableName: COURSES_TABLE,
        Key: { courseId: courseId }
      }));
      
      course = courseResult.Item;
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Course not found' 
          },
          { status: 404 }
        );
      }
      throw dbError;
    }

    if (!course) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Course not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch course' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();

    // Prepare update expression for DynamoDB
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Add updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Process each field
    const allowedFields = [
      'title', 'courseName', 'code', 'courseCode', 'description', 'semester', 'year',
      'maxStudents', 'maxEnrollment', 'credits', 'schedule', 'prerequisites',
      'learningObjectives', 'gradingPolicy', 'classCode', 'settings',
      // New visual identity fields
      'iconInitials', 'avatar', 'thumbnailUrl'
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        
        updateExpression.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    }

    console.log('📝 Course update data:', {
      updateExpression: updateExpression.join(', '),
      expressionAttributeNames,
      expressionAttributeValues
    });

    if (updateExpression.length === 1) { // Only updatedAt
      return NextResponse.json({
        success: true,
        message: 'No changes to update',
        data: body
      });
    }

    // Update course in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: { courseId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: result.Attributes
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update course',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}