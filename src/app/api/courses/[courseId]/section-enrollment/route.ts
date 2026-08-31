import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SECTIONS_TABLE = 'classcast-sections';

// GET /api/courses/[courseId]/section-enrollment
// Returns each section's id, name, and the count of active enrolled students.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    // Load the course (roster lives on the course record under enrollment.students)
    const courseRes = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId },
    }));
    const course = courseRes.Item;

    // Load the sections for this course (for names)
    const sectionsRes = await docClient.send(new ScanCommand({
      TableName: SECTIONS_TABLE,
      FilterExpression: 'courseId = :c',
      ExpressionAttributeValues: { ':c': courseId },
    }));
    const sections = sectionsRes.Items || [];

    // Count active students per sectionId
    const countsBySection: Record<string, number> = {};
    const students = course?.enrollment?.students || [];
    for (const s of students) {
      if (typeof s !== 'object') continue;
      if (s.status && s.status !== 'active') continue;
      const sid = s.sectionId;
      if (!sid) continue;
      countsBySection[sid] = (countsBySection[sid] || 0) + 1;
    }

    // Build the response, one entry per known section
    const result = sections.map((sec: any) => ({
      sectionId: sec.sectionId,
      sectionName: sec.sectionName || sec.sectionCode || 'Section',
      classCode: sec.classCode || null,
      enrolledCount: countsBySection[sec.sectionId] || 0,
    }));

    // Include any sections that appear in enrollment but aren't in the sections table
    for (const [sid, count] of Object.entries(countsBySection)) {
      if (!result.find(r => r.sectionId === sid)) {
        // Try to recover a name from an enrollment entry
        const entry = students.find((s: any) => typeof s === 'object' && s.sectionId === sid);
        result.push({
          sectionId: sid,
          sectionName: entry?.sectionName || 'Section',
          classCode: null,
          enrolledCount: count,
        });
      }
    }

    const totalEnrolled = Object.values(countsBySection).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      courseId,
      totalEnrolled,
      sections: result.sort((a, b) => (a.sectionName || '').localeCompare(b.sectionName || '')),
    });
  } catch (error) {
    console.error('Error fetching section enrollment:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch section enrollment' }, { status: 500 });
  }
}
