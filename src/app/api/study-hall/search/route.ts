import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ROSTER_TABLE = 'classcast-study-hall-roster';
const USERS_TABLE = 'classcast-users';

// GET: Search students by name (for the teacher pullout UI)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Search roster table first (has homeroom info)
    const rosterResult = await docClient.send(new ScanCommand({ TableName: ROSTER_TABLE }));
    const rosterStudents = (rosterResult.Items || [])
      .filter((r: any) => {
        const name = (r.studentName || '').toLowerCase();
        // Match against full name, first name, or last name
        return name.includes(query) || 
          name.split(' ').some((part: string) => part.startsWith(query));
      })
      .map((r: any) => ({
        name: r.studentName,
        homeroom: r.homeroom,
        studyHallTeacher: r.studyHallTeacher,
        source: 'roster',
      }));

    // Also search users table for enrolled students
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': 'student' },
    }));
    const userStudents = (usersResult.Items || [])
      .filter((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return fullName.includes(query);
      })
      .map((u: any) => ({
        name: `${u.firstName} ${u.lastName}`.trim(),
        studentId: u.userId,
        email: u.email,
        source: 'users',
      }));

    // Merge and deduplicate by name
    const seen = new Set<string>();
    const merged = [...rosterStudents, ...userStudents].filter(s => {
      const key = s.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ success: true, students: merged.slice(0, 20) });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
