import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
      try {
        const result = await docClient.send(new QueryCommand({
          TableName: SECTIONS_TABLE,
          IndexName: 'courseId-index',
          KeyConditionExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        }));
        sections = result.Items || [];
      } catch (gsiError: any) {
        // Fallback to scan if GSI doesn't exist
        if (gsiError.name === 'ValidationException' || gsiError.name === 'ResourceNotFoundException') {
          console.warn('GSI not found, falling back to scan operation');
          const scanResult = await docClient.send(new ScanCommand({
            TableName: SECTIONS_TABLE,
            FilterExpression: 'courseId = :courseId',
            ExpressionAttributeValues: {
              ':courseId': courseId
            }
          }));
          sections = scanResult.Items || [];
        } else {
          throw gsiError;
        }
      }
    } else if (instructorId) {
      // Get sections for a specific instructor
      try {
        const result = await docClient.send(new QueryCommand({
          TableName: SECTIONS_TABLE,
          IndexName: 'instructorId-index',
          KeyConditionExpression: 'instructorId = :instructorId',
          ExpressionAttributeValues: {
            ':instructorId': instructorId
          }
        }));
        sections = result.Items || [];
      } catch (gsiError: any) {
        // Fallback to scan if GSI doesn't exist
        if (gsiError.name === 'ValidationException' || gsiError.name === 'ResourceNotFoundException') {
          console.warn('GSI not found, falling back to scan operation');
          const scanResult = await docClient.send(new ScanCommand({
            TableName: SECTIONS_TABLE,
            FilterExpression: 'instructorId = :instructorId',
            ExpressionAttributeValues: {
              ':instructorId': instructorId
            }
          }));
          sections = scanResult.Items || [];
        } else {
          throw gsiError;
        }
      }
    } else {
      // Get all sections
      const result = await docClient.send(new ScanCommand({
        TableName: SECTIONS_TABLE
      }));
      sections = result.Items || [];
    }

    // Apply filters
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      sections = sections.filter(section => section.isActive === activeFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      sections = sections.filter(section => 
        section.sectionName.toLowerCase().includes(searchLower) ||
        section.sectionCode?.toLowerCase().includes(searchLower) ||
        section.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: sections,
      count: sections.length
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
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
    const courseResult = await docClient.send(new QueryCommand({
      TableName: COURSES_TABLE,
      KeyConditionExpression: 'courseId = :courseId',
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
      data: section,
      message: 'Section created successfully'
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
