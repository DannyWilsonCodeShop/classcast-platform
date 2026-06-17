import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import path from 'path';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

interface GradeStudent {
  firstName: string;
  lastName: string;
  section: string;
  cumulativeGrade: number;
  categories: Record<string, number>;
}

interface GradesData {
  course: string;
  weights: Record<string, number>;
  categories: string[];
  lastUpdated: string;
  students: GradeStudent[];
  userOverrides?: Record<string, GradeStudent>;
}

// Cache the grades data in memory
let gradesCache: GradesData | null = null;

function loadGradesData(): GradesData | null {
  if (gradesCache) return gradesCache;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'StudentFiles', 'Grades', 'grades-data.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    gradesCache = JSON.parse(data);
    return gradesCache;
  } catch (error) {
    console.error('Error loading grades data:', error);
    return null;
  }
}

function matchStudent(
  user: { firstName: string; lastName: string },
  students: GradeStudent[]
): GradeStudent | null {
  const userFirst = user.firstName.trim().toLowerCase();
  const userLast = user.lastName.trim().toLowerCase();

  // Exact match first
  const exact = students.find(s => 
    s.firstName.toLowerCase() === userFirst && 
    s.lastName.toLowerCase() === userLast
  );
  if (exact) return exact;

  // Fuzzy match: last name exact, first name starts with
  const fuzzy = students.find(s => 
    s.lastName.toLowerCase() === userLast && 
    (s.firstName.toLowerCase().startsWith(userFirst.substring(0, 3)) ||
     userFirst.startsWith(s.firstName.toLowerCase().substring(0, 3)))
  );
  if (fuzzy) return fuzzy;

  // Try matching with last name containing spaces (e.g., "Cortes Analco")
  const lastNameFuzzy = students.find(s => 
    s.lastName.toLowerCase().includes(userLast) || 
    userLast.includes(s.lastName.toLowerCase())
  );
  if (lastNameFuzzy && lastNameFuzzy.firstName.toLowerCase().startsWith(userFirst.substring(0, 3))) {
    return lastNameFuzzy;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user info from DynamoDB
    const userResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-users',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }));

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.Items[0];
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    // Load grades data
    const gradesData = loadGradesData();
    if (!gradesData) {
      return NextResponse.json(
        { success: false, error: 'Grades data not available' },
        { status: 503 }
      );
    }

    // Check for userId override first (for demo/testing purposes)
    let studentGrade: GradeStudent | null = null;
    if (gradesData.userOverrides && gradesData.userOverrides[userId]) {
      studentGrade = gradesData.userOverrides[userId];
    } else {
      // Match user to their grade record by name
      studentGrade = matchStudent(
        { firstName, lastName },
        gradesData.students
      );
    }

    if (!studentGrade) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'No grade data found for this student',
        course: gradesData.course,
        lastUpdated: gradesData.lastUpdated
      });
    }

    // Compute class statistics
    const sectionStudents = gradesData.students.filter(s => s.section === studentGrade!.section);
    const allStudents = gradesData.students;

    const computeStats = (students: GradeStudent[]) => {
      const cumGrades = students.map(s => s.cumulativeGrade).filter(g => g > 0);
      const examGrades = students.map(s => s.categories['End of Semester Exam']).filter(g => g && g > 0) as number[];
      
      return {
        cumulative: {
          high: cumGrades.length > 0 ? Math.max(...cumGrades) : 0,
          low: cumGrades.length > 0 ? Math.min(...cumGrades) : 0,
          avg: cumGrades.length > 0 ? Math.round((cumGrades.reduce((a, b) => a + b, 0) / cumGrades.length) * 100) / 100 : 0,
          count: cumGrades.length
        },
        exam: {
          high: examGrades.length > 0 ? Math.max(...examGrades) : 0,
          low: examGrades.length > 0 ? Math.min(...examGrades) : 0,
          avg: examGrades.length > 0 ? Math.round((examGrades.reduce((a, b) => a + b, 0) / examGrades.length) * 100) / 100 : 0,
          count: examGrades.length
        }
      };
    };

    const sectionStats = computeStats(sectionStudents);
    const courseStats = computeStats(allStudents);

    return NextResponse.json({
      success: true,
      found: true,
      course: gradesData.course,
      section: studentGrade.section,
      cumulativeGrade: studentGrade.cumulativeGrade,
      categories: studentGrade.categories,
      weights: gradesData.weights,
      categoryNames: gradesData.categories,
      lastUpdated: gradesData.lastUpdated,
      classStats: {
        section: sectionStats,
        course: courseStats
      }
    });

  } catch (error) {
    console.error('Error fetching cumulative grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
