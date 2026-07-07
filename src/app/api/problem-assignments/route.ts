import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { distributeProblemSet } from '@/lib/problemDistribution';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const ASSIGNMENTS_TABLE = 'classcast-problem-assignments';
const PROBLEMS_TABLE = 'classcast-problems';
const COURSES_TABLE = 'classcast-courses';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    if (studentId && assignmentId) {
      // Student lookup — get their specific problem
      const result = await docClient.send(new QueryCommand({
        TableName: ASSIGNMENTS_TABLE,
        IndexName: 'studentId-index',
        KeyConditionExpression: 'studentId = :studentId AND assignmentId = :assignmentId',
        ExpressionAttributeValues: { ':studentId': studentId, ':assignmentId': assignmentId },
      }));
      const assignment = result.Items?.[0] || null;

      // If found, fetch the actual problem content
      if (assignment) {
        const problemResult = await docClient.send(new QueryCommand({
          TableName: PROBLEMS_TABLE,
          KeyConditionExpression: 'problemId = :problemId',
          ExpressionAttributeValues: { ':problemId': assignment.problemId },
        }));
        return NextResponse.json({ success: true, data: { assignment, problem: problemResult.Items?.[0] || null } }, { headers: { 'Cache-Control': 'no-store' } });
      }
      return NextResponse.json({ success: true, data: { assignment: null, problem: null } });
    }

    if (assignmentId) {
      // Instructor view — full distribution
      const result = await docClient.send(new QueryCommand({
        TableName: ASSIGNMENTS_TABLE,
        IndexName: 'assignmentId-index',
        KeyConditionExpression: 'assignmentId = :assignmentId',
        ExpressionAttributeValues: { ':assignmentId': assignmentId },
      }));
      return NextResponse.json({ success: true, data: { assignments: result.Items || [] } });
    }

    return NextResponse.json({ success: false, error: 'assignmentId or studentId+assignmentId required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching problem assignments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, bankId, courseId } = body;

    if (!assignmentId || !bankId || !courseId) {
      return NextResponse.json({ success: false, error: 'assignmentId, bankId, and courseId are required' }, { status: 400 });
    }

    // Fetch problems from bank
    const problemsResult = await docClient.send(new QueryCommand({
      TableName: PROBLEMS_TABLE,
      IndexName: 'bankId-index',
      KeyConditionExpression: 'bankId = :bankId',
      ExpressionAttributeValues: { ':bankId': bankId },
      ScanIndexForward: true,
    }));
    const problems = problemsResult.Items || [];

    // Fetch enrolled students
    const courseResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: { ':courseId': courseId },
    }));
    const course = courseResult.Items?.[0];
    const students = course?.enrollment?.students || [];
    const studentIds = students.map((s: any) => s.userId).filter(Boolean);

    if (problems.length < studentIds.length) {
      return NextResponse.json({ success: false, error: `Not enough problems (${problems.length}) for ${studentIds.length} students` }, { status: 400 });
    }

    // Distribute
    const problemIds = problems.map((p: any) => p.problemId);
    const distribution = distributeProblemSet(problemIds, studentIds);

    // Batch write assignments
    const now = new Date().toISOString();
    const records = distribution.map(d => ({
      id: `pa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assignmentId,
      studentId: d.studentId,
      problemId: d.problemId,
      bankId,
      assignedAt: now,
    }));

    for (let i = 0; i < records.length; i += 25) {
      const batch = records.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: { [ASSIGNMENTS_TABLE]: batch.map(item => ({ PutRequest: { Item: item } })) }
      }));
    }

    // Update the assignment record with problemBankId
    await docClient.send(new UpdateCommand({
      TableName: 'classcast-assignments',
      Key: { assignmentId },
      UpdateExpression: 'SET problemBankId = :bankId',
      ExpressionAttributeValues: { ':bankId': bankId },
    }));

    return NextResponse.json({ success: true, data: { distributed: records.length, unassignedProblems: problems.length - studentIds.length } });
  } catch (error: any) {
    console.error('Error distributing problems:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to distribute' }, { status: 500 });
  }
}
