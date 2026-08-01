import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ROSTER_TABLE = 'classcast-study-hall-roster';
const USERS_TABLE = 'classcast-users';

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Check if query fuzzy-matches a name part
function fuzzyMatch(query: string, name: string): { match: boolean; score: number } {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact contains — best match
  if (nameLower.includes(queryLower)) {
    return { match: true, score: 0 };
  }

  // Check each word in the name
  const parts = nameLower.split(/\s+/);
  for (const part of parts) {
    // Starts-with on any word
    if (part.startsWith(queryLower)) {
      return { match: true, score: 0.5 };
    }

    // Levenshtein: allow 1 typo for short queries, 2 for longer
    const maxDist = queryLower.length <= 3 ? 1 : 2;
    const dist = levenshtein(queryLower, part.substring(0, queryLower.length + 2));
    if (dist <= maxDist) {
      return { match: true, score: dist };
    }

    // Also check full part if query is close in length
    if (Math.abs(part.length - queryLower.length) <= 2) {
      const fullDist = levenshtein(queryLower, part);
      if (fullDist <= maxDist) {
        return { match: true, score: fullDist };
      }
    }
  }

  // Check full name as well (e.g. "john smi" matches "john smith")
  if (queryLower.length >= 4) {
    const fullNameDist = levenshtein(queryLower, nameLower.substring(0, queryLower.length + 2));
    const maxDist = queryLower.length <= 4 ? 1 : 2;
    if (fullNameDist <= maxDist) {
      return { match: true, score: fullNameDist + 0.5 };
    }
  }

  return { match: false, score: 999 };
}

// GET: Search students by name (for the teacher pullout UI)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Search roster table first (has homeroom info)
    const rosterResult = await docClient.send(new ScanCommand({ TableName: ROSTER_TABLE }));
    const rosterStudents = (rosterResult.Items || [])
      .map((r: any) => {
        const name = r.studentName || '';
        const result = fuzzyMatch(query, name);
        return result.match ? {
          name,
          homeroom: r.homeroom,
          studyHallTeacher: r.studyHallTeacher,
          source: 'roster' as const,
          score: result.score,
        } : null;
      })
      .filter(Boolean) as Array<{ name: string; homeroom?: string; studyHallTeacher?: string; source: 'roster'; score: number }>;

    // Also search users table for enrolled students
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': 'student' },
    }));
    const userStudents = (usersResult.Items || [])
      .map((u: any) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const result = fuzzyMatch(query, fullName);
        return result.match ? {
          name: fullName,
          studentId: u.userId,
          email: u.email,
          source: 'users' as const,
          score: result.score,
        } : null;
      })
      .filter(Boolean) as Array<{ name: string; studentId?: string; email?: string; source: 'users'; score: number }>;

    // Merge and deduplicate by name, sort by relevance
    const seen = new Set<string>();
    const merged = [...rosterStudents, ...userStudents]
      .filter(s => {
        const key = s.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .map(({ score, ...rest }) => rest); // Remove score from response

    return NextResponse.json({ success: true, students: merged });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
