import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { assignRandomGroups } from '@/lib/groupAssignment';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const GROUPS_TABLE = 'classcast-discussion-groups';
const COURSES_TABLE = 'classcast-courses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;

    const result = await docClient.send(new QueryCommand({
      TableName: GROUPS_TABLE,
      IndexName: 'DiscussionIdIndex',
      KeyConditionExpression: 'discussionId = :discussionId',
      ExpressionAttributeValues: { ':discussionId': discussionId },
    }));

    return NextResponse.json({
      success: true,
      data: { groups: result.Items || [] },
    });
  } catch (error) {
    console.error('Error fetching discussion groups:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;
    const body = await request.json();
    const { courseId, groupSize } = body;

    if (!courseId || !groupSize) {
      return NextResponse.json({ success: false, error: 'courseId and groupSize are required' }, { status: 400 });
    }

    // Fetch enrolled students from the course
    const courseResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: { ':courseId': courseId },
    }));

    const course = courseResult.Items?.[0];
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const students = course.enrollment?.students || [];
    const studentIds = students.map((s: any) => s.userId).filter(Boolean);

    if (studentIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No students enrolled in this course' }, { status: 400 });
    }

    // Create random groups
    const groupArrays = assignRandomGroups(studentIds, groupSize);

    // Persist groups to DynamoDB
    const groups = await Promise.all(
      groupArrays.map(async (memberIds) => {
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const group = {
          groupId,
          discussionId,
          studentIds: memberIds,
          groupSize,
        };
        await docClient.send(new PutCommand({ TableName: GROUPS_TABLE, Item: group }));
        return group;
      })
    );

    return NextResponse.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('Error creating discussion groups:', error);
    return NextResponse.json({ success: false, error: 'Failed to create groups' }, { status: 500 });
  }
}
