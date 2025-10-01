import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SECTIONS_TABLE = 'classcast-sections';

// GET /api/sections/[sectionId] - Get a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    const result = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    if (!result.Item) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.Item
    });

  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch section' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[sectionId] - Update a section
export async function PUT(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const body = await request.json();
    const {
      sectionName,
      sectionCode,
      description,
      maxEnrollment,
      schedule,
      location,
      isActive
    } = body;

    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (sectionName !== undefined) {
      updateExpressions.push('#sectionName = :sectionName');
      expressionAttributeNames['#sectionName'] = 'sectionName';
      expressionAttributeValues[':sectionName'] = sectionName;
    }

    if (sectionCode !== undefined) {
      updateExpressions.push('#sectionCode = :sectionCode');
      expressionAttributeNames['#sectionCode'] = 'sectionCode';
      expressionAttributeValues[':sectionCode'] = sectionCode;
    }

    if (description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (maxEnrollment !== undefined) {
      updateExpressions.push('#maxEnrollment = :maxEnrollment');
      expressionAttributeNames['#maxEnrollment'] = 'maxEnrollment';
      expressionAttributeValues[':maxEnrollment'] = maxEnrollment;
    }

    if (schedule !== undefined) {
      updateExpressions.push('#schedule = :schedule');
      expressionAttributeNames['#schedule'] = 'schedule';
      expressionAttributeValues[':schedule'] = schedule;
    }

    if (location !== undefined) {
      updateExpressions.push('#location = :location');
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = location;
    }

    if (isActive !== undefined) {
      updateExpressions.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = isActive;
    }

    if (updateExpressions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No fields to update' 
        },
        { status: 400 }
      );
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    // Fetch updated section
    const result = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    return NextResponse.json({
      success: true,
      data: result.Item,
      message: 'Section updated successfully'
    });

  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update section' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[sectionId] - Delete a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    // Check if section exists
    const existingSection = await docClient.send(new GetCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId }
    }));

    if (!existingSection.Item) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section not found' 
        },
        { status: 404 }
      );
    }

    // Check if section has enrollments
    if (existingSection.Item.currentEnrollment > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete section with active enrollments. Please transfer or drop all students first.' 
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await docClient.send(new UpdateCommand({
      TableName: SECTIONS_TABLE,
      Key: { sectionId },
      UpdateExpression: 'SET #isActive = :isActive, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':isActive': false,
        ':updatedAt': new Date().toISOString()
      }
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
        error: 'Failed to delete section' 
      },
      { status: 500 }
    );
  }
}
