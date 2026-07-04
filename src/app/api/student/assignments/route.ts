import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

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
    // PARALLEL FETCH: Run all table scans concurrently instead of sequentially
    // =========================================================================
    const [coursesResult, assignmentsResult, submissionsResult] = await Promise.all([
      // Fetch courses (filtered by specific courseId if provided)
      courseId
        ? docClient.send(new ScanCommand({
            TableName: COURSES_TABLE,
            FilterExpression: 'courseId = :courseId',
            ExpressionAttributeValues: { ':courseId': courseId },
          }))
        : docClient.send(new ScanCommand({ TableName: COURSES_TABLE })),
      // Fetch all assignments in one scan (filter in memory)
      docClient.send(new ScanCommand({ TableName: ASSIGNMENTS_TABLE })),
      // Fetch user's submissions
      docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })),
    ]);

    const allCourses = coursesResult.Items || [];
    const allAssignments = assignmentsResult.Items || [];
    const userSubmissions = submissionsResult.Items || [];

    // =========================================================================
    // FILTER: Determine which courses this user is enrolled in
    // =========================================================================
    let userCourses: any[];
    if (courseId) {
      userCourses = allCourses;
    } else {
      userCourses = allCourses.filter(course => {
        if (!course.enrollment || !course.enrollment.students) return false;
        return course.enrollment.students.some((student: any) => {
          if (typeof student === 'string') return student === userId;
          return student?.userId === userId;
        });
      });
    }

    const courseIds = new Set(userCourses.map(c => c.courseId));

    // Filter assignments to only those in enrolled courses
    const assignments = allAssignments.filter(a => courseIds.has(a.courseId));

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
    return NextResponse.json({ assignments: enrichedAssignments });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
