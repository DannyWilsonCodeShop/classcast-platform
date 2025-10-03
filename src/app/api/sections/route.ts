import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SECTIONS_TABLE = 'classcast-sections';
const COURSES_TABLE = 'classcast-courses';

// GET /api/sections - Get sections with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const instructorId = searchParams.get('instructorId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    let sections = [];

    if (courseId) {
      // Get sections for a specific course
      const result = await docClient.send(new ScanCommand({
        TableName: SECTIONS_TABLE,
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      }));
      sections = result.Items || [];
    } else if (instructorId) {
      // Get sections for a specific instructor
      const result = await docClient.send(new ScanCommand({
        TableName: SECTIONS_TABLE,
        FilterExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: {
          ':instructorId': instructorId
        }
      }));
      sections = result.Items || [];
    } else {
      // Get all sections
      const result = await docClient.send(new ScanCommand({
        TableName: SECTIONS_TABLE
      }));
      sections = result.Items || [];
    }

    // Apply additional filters
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      sections = sections.filter(section => section.isActive === activeFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      sections = sections.filter(section =>
        section.sectionName?.toLowerCase().includes(searchLower) ||
        section.sectionCode?.toLowerCase().includes(searchLower) ||
        section.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: sections,
      count: sections.length
    });

  } catch (error: any) {
    console.error('Error fetching sections:', error);
    
    // If table doesn't exist, return empty array instead of error
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sections' 
      },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseId,
      sectionName,
      sectionCode,
      classCode,
      description,
      maxEnrollment = 30,
      schedule,
      location,
      instructorId
    } = body;

    // Validate required fields
    if (!courseId || !sectionName || !instructorId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Course ID, section name, and instructor ID are required' 
        },
        { status: 400 }
      );
    }

    // Verify course exists
    const courseResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    if (!courseResult.Items || courseResult.Items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Course not found' 
        },
        { status: 404 }
      );
    }

    const sectionId = uuidv4();
    const now = new Date().toISOString();

    const section = {
      sectionId,
      courseId,
      sectionName,
      sectionCode,
      classCode,
      description,
      maxEnrollment,
      currentEnrollment: 0,
      schedule: schedule || null,
      location,
      instructorId,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    // Save section
    await docClient.send(new PutCommand({
      TableName: SECTIONS_TABLE,
      Item: section
    }));

    return NextResponse.json({
      success: true,
      message: 'Section created successfully',
      data: section
    });

  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create section' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/sections - Update an existing section
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sectionId,
      sectionName,
      sectionCode,
      description,
      maxEnrollment,
      schedule,
      location,
      isActive
    } = body;

    if (!sectionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section ID is required' 
        },
        { status: 400 }
      );
    }

    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (sectionName !== undefined) {
      updateExpression.push('#sectionName = :sectionName');
      expressionAttributeNames['#sectionName'] = 'sectionName';
      expressionAttributeValues[':sectionName'] = sectionName;
    }

    if (sectionCode !== undefined) {
      updateExpression.push('#sectionCode = :sectionCode');
      expressionAttributeNames['#sectionCode'] = 'sectionCode';
      expressionAttributeValues[':sectionCode'] = sectionCode;
    }

    if (description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (maxEnrollment !== undefined) {
      updateExpression.push('#maxEnrollment = :maxEnrollment');
      expressionAttributeNames['#maxEnrollment'] = 'maxEnrollment';
      expressionAttributeValues[':maxEnrollment'] = maxEnrollment;
    }

    if (schedule !== undefined) {
      updateExpression.push('#schedule = :schedule');
      expressionAttributeNames['#schedule'] = 'schedule';
      expressionAttributeValues[':schedule'] = schedule;
    }

    if (location !== undefined) {
      updateExpression.push('#location = :location');
      expressionAttributeNames['#location'] = 'location';
      expressionAttributeValues[':location'] = location;
    }

    if (isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = isActive;
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
        error: 'Failed to update section' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sections - Delete a section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Section ID is required' 
        },
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
        error: 'Failed to delete section' 
      },
      { status: 500 }
    );
  }
}