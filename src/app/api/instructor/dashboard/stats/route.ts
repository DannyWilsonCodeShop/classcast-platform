import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { serverCache } from '@/lib/cache';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    // Get instructor ID from query params
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Instant repeat loads during a demo. Prefix 'instructor-' so the grade-save route's
    // serverCache.invalidate('instructor-') clears this too (ungraded count can change).
    const cacheKey = `instructor-dashboard-stats:${instructorId}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'HIT' } });
    }

    // Batch: scan courses + assignments + submissions ONCE each, then filter in memory.
    // (Was an N+1: a scan per course for assignments, then a scan per assignment for
    // submissions — dozens of full-table scans on the instructor landing page.)
    const [coursesResult, assignmentsResult, submissionsResult] = await Promise.all([
      docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: { ':instructorId': instructorId },
      })),
      docClient.send(new ScanCommand({ TableName: ASSIGNMENTS_TABLE, ProjectionExpression: 'assignmentId, courseId' })),
      docClient.send(new ScanCommand({ TableName: SUBMISSIONS_TABLE, ProjectionExpression: 'assignmentId, courseId, grade, #s, hidden', ExpressionAttributeNames: { '#s': 'status' } })),
    ]);

    const courses = coursesResult.Items || [];
    const courseIdSet = new Set(courses.map(c => c.courseId));

    // Assignments belonging to this instructor's courses
    const myAssignmentIds = new Set(
      (assignmentsResult.Items || [])
        .filter(a => courseIdSet.has(a.courseId))
        .map(a => a.assignmentId)
    );

    // Ungraded submissions within this instructor's assignments
    const ungradedAssignments = (submissionsResult.Items || []).filter(sub =>
      myAssignmentIds.has(sub.assignmentId) &&
      (sub.grade === null || sub.grade === undefined) &&
      sub.status !== 'draft' &&
      sub.status !== 'deleted' &&
      !sub.hidden
    ).length;

    const stats = {
      activeCourses: courses.length,
      ungradedAssignments,
      messages: 0, // placeholder — no messages table yet
    };

    serverCache.set(cacheKey, stats, 30_000);
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store', 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
