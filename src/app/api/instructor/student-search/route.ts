import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = awsConfig.dynamodb.tables.courses;

// GET /api/instructor/student-search?instructorId=...&q=...
// Searches enrolled students by name/email across all of the instructor's courses.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    if (!instructorId) {
      return NextResponse.json({ success: false, error: 'Instructor ID is required' }, { status: 400 });
    }
    if (q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // Get this instructor's courses (via GSI)
    const coursesResult = await docClient.send(new QueryCommand({
      TableName: COURSES_TABLE,
      IndexName: 'instructorId-index',
      KeyConditionExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: { ':instructorId': instructorId },
    }));
    const courses = coursesResult.Items || [];

    const results: Array<{
      studentId: string;
      studentName: string;
      email: string;
      courseId: string;
      courseName: string;
      sectionId: string | null;
      sectionName: string | null;
    }> = [];

    const seen = new Set<string>(); // dedupe per student+course

    for (const course of courses) {
      const courseId = course.courseId;
      const courseName = course.title || course.courseName || 'Course';
      const students = course.enrollment?.students || [];
      for (const s of students) {
        if (typeof s !== 'object' || !s.userId) continue;
        if (s.status && s.status !== 'active') continue;
        const first = (s.firstName || '').toString();
        const last = (s.lastName || '').toString();
        const name = `${first} ${last}`.trim();
        const email = (s.email || '').toString();
        const haystack = `${name} ${email}`.toLowerCase();
        if (!haystack.includes(q)) continue;

        const key = `${courseId}:${s.userId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          studentId: s.userId,
          studentName: name || email || 'Student',
          email,
          courseId,
          courseName,
          sectionId: s.sectionId || null,
          sectionName: s.sectionName || null,
        });
      }
    }

    // Sort by name, cap results
    results.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return NextResponse.json({ success: true, results: results.slice(0, 25) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Student search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
