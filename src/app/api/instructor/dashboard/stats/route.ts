import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
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
    const scopeCourseId = searchParams.get('courseId');
    const cacheKey = `instructor-dashboard-stats:${instructorId}:${scopeCourseId || 'all'}`;
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
      docClient.send(new ScanCommand({ TableName: ASSIGNMENTS_TABLE, ProjectionExpression: 'assignmentId, courseId, title' })),
      docClient.send(new ScanCommand({ TableName: SUBMISSIONS_TABLE, ProjectionExpression: 'submissionId, studentId, assignmentId, courseId, grade, #s, hidden, submittedAt, createdAt', ExpressionAttributeNames: { '#s': 'status' } })),
    ]);

    const courses = coursesResult.Items || [];
    // Optional ?courseId= narrows the counts to one of this instructor's courses (dashboard tiles).
    const courseIdSet = new Set(
      courses.map(c => c.courseId).filter(id => !scopeCourseId || id === scopeCourseId)
    );

    // Assignments belonging to this instructor's courses
    const myAssignments = new Map<string, { title?: string }>();
    for (const a of (assignmentsResult.Items || [])) {
      if (courseIdSet.has(a.courseId)) myAssignments.set(a.assignmentId, { title: a.title });
    }

    // Live submissions within this instructor's assignments
    const mySubmissions = (submissionsResult.Items || []).filter(sub =>
      myAssignments.has(sub.assignmentId) &&
      sub.status !== 'draft' &&
      sub.status !== 'deleted' &&
      !sub.hidden
    );
    const submittedAtMs = (sub: any) => new Date(sub.submittedAt || sub.createdAt || 0).getTime();
    const ungraded = mySubmissions.filter(sub => sub.grade === null || sub.grade === undefined);
    const ungradedAssignments = ungraded.length;
    const weekAgo = Date.now() - 7 * 86400000;
    const submittedThisWeek = mySubmissions.filter(sub => submittedAtMs(sub) >= weekAgo).length;

    // Five most recent ungraded submissions; student names come from one BatchGet (no N+1).
    const recent = [...ungraded].sort((a, b) => submittedAtMs(b) - submittedAtMs(a)).slice(0, 5);
    const studentIds = [...new Set(recent.map(s => s.studentId).filter(Boolean))];
    const nameById = new Map<string, string>();
    if (studentIds.length > 0) {
      try {
        const usersResult = await docClient.send(new BatchGetCommand({
          RequestItems: {
            'classcast-users': {
              Keys: studentIds.map(userId => ({ userId })),
              ProjectionExpression: 'userId, firstName, lastName, email',
            },
          },
        }));
        for (const u of (usersResult.Responses?.['classcast-users'] || [])) {
          nameById.set(u.userId, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Student');
        }
      } catch (err) {
        console.warn('dashboard stats: student name lookup failed', err);
      }
    }
    const recentUngraded = recent.map(sub => ({
      submissionId: sub.submissionId,
      studentId: sub.studentId,
      studentName: nameById.get(sub.studentId) || 'Student',
      assignmentId: sub.assignmentId,
      assignmentTitle: myAssignments.get(sub.assignmentId)?.title || 'Assignment',
      courseId: sub.courseId,
      submittedAt: sub.submittedAt || sub.createdAt || null,
    }));

    const stats = {
      activeCourses: courses.length,
      ungradedAssignments,
      submittedThisWeek,
      recentUngraded,
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
