import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENT_LINKS_TABLE = 'classcast-assignment-links';

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;

    const body = await request.json();
    const { title, url, description, category = 'resource' } = body;

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const linkId = uuidv4();
    const now = new Date().toISOString();

    const linkData = {
      linkId,
      assignmentId,
      title,
      url,
      description: description || '',
      category,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    await docClient.send(new PutCommand({
      TableName: ASSIGNMENT_LINKS_TABLE,
      Item: linkData
    }));

    return NextResponse.json({
      success: true,
      data: {
        link: {
          linkId,
          title,
          url,
          description,
          category,
          createdAt: now
        }
      }
    });

  } catch (error) {
    console.error('Error adding assignment link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add link' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let scanParams: any = {
      TableName: ASSIGNMENT_LINKS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId,
        ':isActive': true
      }
    };

    // Filter by category if specified
    if (category) {
      scanParams.FilterExpression += ' AND category = :category';
      scanParams.ExpressionAttributeValues[':category'] = category;
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    const links = result.Items?.map(item => ({
      linkId: item.linkId,
      title: item.title,
      url: item.url,
      description: item.description,
      category: item.category,
      createdAt: item.createdAt
    })) || [];

    return NextResponse.json({
      success: true,
      data: { links }
    });

  } catch (error) {
    console.error('Error fetching assignment links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'Link ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await docClient.send(new PutCommand({
      TableName: ASSIGNMENT_LINKS_TABLE,
      Item: {
        linkId,
        assignmentId,
        isActive: false,
        deletedAt: new Date().toISOString()
      }
    }));

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}