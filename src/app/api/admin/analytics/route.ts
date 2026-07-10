import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * GET /api/admin/analytics
 * Returns platform-wide statistics for admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all tables in parallel
    const [usersResult, coursesResult, assignmentsResult, submissionsResult] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: 'classcast-users', ProjectionExpression: 'userId, #role, createdAt, lastLoginAt', ExpressionAttributeNames: { '#role': 'role' } })),
      docClient.send(new ScanCommand({ TableName: 'classcast-courses', ProjectionExpression: 'courseId, #name, courseName, enrollment', ExpressionAttributeNames: { '#name': 'name' } })),
      docClient.send(new ScanCommand({ TableName: 'classcast-assignments', ProjectionExpression: 'assignmentId, courseId, title, createdAt' })),
      docClient.send(new ScanCommand({ TableName: 'classcast-submissions', ProjectionExpression: 'submissionId, courseId, assignmentId, studentId, grade, maxScore, submittedAt, #status', ExpressionAttributeNames: { '#status': 'status' } })),
    ]);

    const users = usersResult.Items || [];
    const courses = coursesResult.Items || [];
    const assignments = assignmentsResult.Items || [];
    const submissions = submissionsResult.Items || [];

    // Calculate stats
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalInstructors = users.filter(u => u.role === 'instructor' || u.role === 'admin').length;
    const totalCourses = courses.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;

    // Active this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const submissionsThisWeek = submissions.filter(s => s.submittedAt && s.submittedAt >= oneWeekAgo).length;
    const activeStudentIds = new Set(
      submissions.filter(s => s.submittedAt && s.submittedAt >= oneWeekAgo).map(s => s.studentId)
    );
    const activeStudentsThisWeek = activeStudentIds.size;

    // Grading stats
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined && s.grade !== null);
    const ungradedSubmissions = submissions.filter(s => s.grade === undefined || s.grade === null);
    const averageGrade = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => {
          const pct = s.maxScore ? (s.grade / s.maxScore) * 100 : s.grade;
          return sum + pct;
        }, 0) / gradedSubmissions.length
      : 0;

    // Per-course breakdown
    const courseStats = courses.map(course => {
      const cId = course.courseId;
      const studentCount = course.enrollment?.students?.length || 0;
      const assignmentCount = assignments.filter(a => a.courseId === cId).length;
      const submissionCount = submissions.filter(s => s.courseId === cId).length;

      return {
        courseId: cId,
        courseName: course.name || course.courseName || 'Unnamed Course',
        studentCount,
        assignmentCount,
        submissionCount,
      };
    }).sort((a, b) => b.submissionCount - a.submissionCount);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalInstructors,
        totalCourses,
        totalAssignments,
        totalSubmissions,
        activeStudentsThisWeek,
        submissionsThisWeek,
        averageGrade: Math.round(averageGrade * 10) / 10,
        gradedCount: gradedSubmissions.length,
        ungradedCount: ungradedSubmissions.length,
      },
      courseStats,
    });
  } catch (error: any) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
