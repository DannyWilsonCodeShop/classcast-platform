import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SECTIONS_TABLE = 'classcast-sections';

// GET /api/sections/[sectionId] - Get section details
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    
    console.log('Fetching section:', sectionId);

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const result = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    const section = result.Item;

    return NextResponse.json({
      success: true,
      data: {
        sectionId: section.sectionId,
        courseId: section.courseId,
        sectionName: section.sectionName,
        sectionCode: section.sectionCode,
        classCode: section.classCode,
        description: section.description,
        maxEnrollment: section.maxEnrollment,
        currentEnrollment: section.currentEnrollment,
        schedule: section.schedule,
        location: section.location,
        instructorId: section.instructorId,
        isActive: section.isActive,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[sectionId] - Update section
export async function PUT(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const body = await request.json();
    
    console.log('Updating section:', sectionId, body);

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (body.sectionName !== undefined) {
      updateExpression.push('#sectionName = :sectionName');
      expressionAttributeNames['#sectionName'] = 'sectionName';
      expressionAttributeValues[':sectionName'] = body.sectionName;
    }

    if (body.sectionCode !== undefined) {
      updateExpression.push('#sectionCode = :sectionCode');
      expressionAttributeNames['#sectionCode'] = 'sectionCode';
      expressionAttributeValues[':sectionCode'] = body.sectionCode;
    }

    if (body.classCode !== undefined) {
      updateExpression.push('#classCode = :classCode');
      expressionAttributeNames['#classCode'] = 'classCode';
      expressionAttributeValues[':classCode'] = body.classCode;
    }

    if (body.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = body.description;
    }

    if (body.maxEnrollment !== undefined) {
      updateExpression.push('#maxEnrollment = :maxEnrollment');
      expressionAttributeNames['#maxEnrollment'] = 'maxEnrollment';
      expressionAttributeValues[':maxEnrollment'] = body.maxEnrollment;
    }

    if (body.schedule !== undefined) {
      updateExpression.push('#schedule = :schedule');
      expressionAttributeNames['#schedule'] = 'schedule';
      expressionAttributeValues[':schedule'] = body.schedule;
    }

    if (body.location !== undefined) {
      updateExpression.push('#location = :location');
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = body.location;
    }

    if (body.isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = body.isActive;
    }

    if (updateExpression.length === 1) {
      return NextResponse.json({
        success: true,
        message: 'No changes to update',
        data: body
      });
    }

    await docClient.send(new UpdateCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return NextResponse.json({
      success: true,
      message: 'Section updated successfully'
    });

  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[sectionId] - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    
    console.log('Deleting section:', sectionId);

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    await docClient.send(new DeleteCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}