import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, BatchGetCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // =========================================================================
    // =========================================================================
    // PARALLEL FETCH: Use GSI queries where possible for speed
    // =========================================================================
    
    // Get user's enrolledCourses first (fast — single GetItem)
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: 'userId, enrolledCourses',
    }));
    const userEnrolledCourseIds = new Set<string>();
    if (userResult.Item?.enrolledCourses) {
      for (const ec of userResult.Item.enrolledCourses) {
        const cid = typeof ec === 'string' ? ec : ec.courseId;
        if (cid) userEnrolledCourseIds.add(cid);
      }
    }

    // Fetch courses and submissions in parallel
    const [coursesResult, submissionsResult] = await Promise.all([
      // Fetch courses (if specific courseId, use GetItem; otherwise scan)
      courseId
        ? docClient.send(new GetCommand({ TableName: COURSES_TABLE, Key: { courseId } })).then(r => ({ Items: r.Item ? [r.Item] : [] }))
        : docClient.send(new ScanCommand({ TableName: COURSES_TABLE })),
      // Fetch user's submissions via GSI (fast query by studentId)
      docClient.send(new QueryCommand({
        TableName: SUBMISSIONS_TABLE,
        IndexName: 'studentId-index',
        KeyConditionExpression: 'studentId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })),
    ]);

    const allCourses = coursesResult.Items || [];
    const userSubmissions = submissionsResult.Items || [];

    // =========================================================================
    // FILTER: Determine which courses this user is enrolled in
    // Check both: course.enrollment.students AND user.enrolledCourses
    // =========================================================================
    let userCourses: any[];
    if (courseId) {
      userCourses = allCourses;
    } else {
      userCourses = allCourses.filter(course => {
        const inCourseEnrollment = course.enrollment?.students?.some((student: any) => {
          if (typeof student === 'string') return student === userId;
          return student?.userId === userId;
        });
        const inUserEnrollment = userEnrolledCourseIds.has(course.courseId);
        return inCourseEnrollment || inUserEnrollment;
      });
    }

    const courseIds = new Set(userCourses.map(c => c.courseId));

    // Fetch assignments for enrolled courses via GSI (query per course)
    let assignments: any[] = [];
    if (courseIds.size <= 5) {
      // For small number of courses, query each via GSI (faster than full scan)
      const assignmentResults = await Promise.all(
        [...courseIds].map(cid =>
          docClient.send(new QueryCommand({
            TableName: ASSIGNMENTS_TABLE,
            IndexName: 'courseId-index',
            KeyConditionExpression: 'courseId = :cid',
            ExpressionAttributeValues: { ':cid': cid },
          }))
        )
      );
      assignments = assignmentResults.flatMap(r => r.Items || []);
    } else {
      // For many courses, a single scan + filter is more efficient
      const allAssignments = await docClient.send(new ScanCommand({ TableName: ASSIGNMENTS_TABLE }));
      assignments = (allAssignments.Items || []).filter(a => courseIds.has(a.courseId));
    }

    // Build lookup maps
    const submissionMap = new Map<string, any>();
    userSubmissions.forEach(sub => submissionMap.set(sub.assignmentId, sub));

    const courseMap = new Map<string, any>();
    userCourses.forEach(course => courseMap.set(course.courseId, course));

    // =========================================================================
    // BATCH INSTRUCTOR LOOKUP: Collect unique IDs, fetch all at once
    // =========================================================================
    const instructorIds = new Set<string>();
    userCourses.forEach(course => {
      if (course.instructorId) instructorIds.add(course.instructorId);
    });

    const instructorMap = new Map<string, any>();
    if (instructorIds.size > 0) {
      // BatchGetCommand supports up to 100 keys per request
      const keys = [...instructorIds].map(id => ({ userId: id }));
      const batches = [];
      for (let i = 0; i < keys.length; i += 100) {
        batches.push(keys.slice(i, i + 100));
      }

      const batchResults = await Promise.all(
        batches.map(batch =>
          docClient.send(new BatchGetCommand({
            RequestItems: {
              [USERS_TABLE]: { Keys: batch, ProjectionExpression: 'userId, firstName, lastName' },
            },
          }))
        )
      );

      batchResults.forEach(result => {
        const items = result.Responses?.[USERS_TABLE] || [];
        items.forEach(item => {
          instructorMap.set(item.userId, item);
        });
      });
    }

    // =========================================================================
    // ENRICH: Build final assignment list (no more async per-item)
    // =========================================================================
    const enrichedAssignments = assignments.map(assignment => {
      const course = courseMap.get(assignment.courseId);
      const submission = submissionMap.get(assignment.assignmentId);

      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      let status = 'upcoming';
      if (submission) status = 'completed';
      else if (dueDate < now) status = 'past_due';

      // Instructor name from batch-fetched map
      let instructorName = course?.instructorName || 'Unknown Instructor';
      if (course?.instructorId) {
        const instructor = instructorMap.get(course.instructorId);
        if (instructor) {
          const name = `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim();
          if (name) instructorName = name;
        }
      }

      return {
        id: assignment.assignmentId,
        assignmentId: assignment.assignmentId,
        courseId: assignment.courseId,
        courseName: course?.courseName || course?.title || 'Unknown Course',
        courseCode: course?.courseCode || course?.code || 'N/A',
        title: assignment.title || 'Untitled Assignment',
        description: assignment.description || 'No description available',
        dueDate: assignment.dueDate,
        status,
        points: assignment.maxScore ?? 100,
        submissionType: assignment.assignmentType === 'video' ? 'video' : 'file',
        assignmentType: assignment.assignmentType || 'Assignment',
        isSubmitted: !!submission,
        submittedAt: submission?.submittedAt || null,
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        instructor: instructorName,
        createdAt: assignment.createdAt || new Date().toISOString(),
        resources: assignment.resources || [],
        instructionalVideoUrl: assignment.instructionalVideoUrl || '',
        enablePeerResponses: assignment.enablePeerResponses || false,
        minResponsesRequired: assignment.minResponsesRequired || 0,
        maxResponsesPerVideo: assignment.maxResponsesPerVideo || 0,
        hidePeerVideosUntilInstructorPosts: assignment.hidePeerVideosUntilInstructorPosts || false,
      };
    });

    // Sort by due date
    enrichedAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Let middleware handle caching (5-min stale-while-revalidate)
    return NextResponse.json({ assignments: enrichedAssignments }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
