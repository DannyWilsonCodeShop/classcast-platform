import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, csv, xlsx

    console.log('📊 Exporting grades for course:', courseId);

    // Get course details
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }));

    if (!courseResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseResult.Item;
    const enrollment = course.enrollment || { students: [] };

    // Get all assignments for this course
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    const assignments = (assignmentsResult.Items || [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    console.log(`📝 Found ${assignments.length} assignments`);

    // Get all submissions for this course
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    const submissions = submissionsResult.Items || [];
    console.log(`📋 Found ${submissions.length} submissions`);

    // Create a map of submissions by student and assignment
    const submissionMap = new Map<string, Map<string, any>>();
    submissions.forEach(submission => {
      const studentId = submission.studentId;
      const assignmentId = submission.assignmentId;
      
      if (!submissionMap.has(studentId)) {
        submissionMap.set(studentId, new Map());
      }
      
      submissionMap.get(studentId)!.set(assignmentId, submission);
    });

    // Get student details and build grade report
    const gradeReport = [];
    
    for (const enrolledStudent of enrollment.students) {
      const studentId = typeof enrolledStudent === 'string' 
        ? enrolledStudent 
        : enrolledStudent.userId;

      // Get student details
      let studentInfo = {
        id: studentId,
        name: 'Unknown Student',
        email: 'N/A',
        sectionName: typeof enrolledStudent === 'object' ? enrolledStudent.sectionName : null
      };

      try {
        const userResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: studentId }
        }));

        if (userResult.Item) {
          const user = userResult.Item;
          studentInfo.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
          studentInfo.email = user.email || 'N/A';
        }
      } catch (error) {
        console.warn('Could not fetch user details for:', studentId);
      }

      // Build grade row
      const gradeRow: any = {
        studentId: studentInfo.id,
        studentName: studentInfo.name,
        studentEmail: studentInfo.email,
        section: studentInfo.sectionName || 'No Section',
        assignments: {},
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        letterGrade: 'N/A'
      };

      const studentSubmissions = submissionMap.get(studentId) || new Map();
      let totalPossiblePoints = 0;
      let totalEarnedPoints = 0;

      // Add grades for each assignment
      assignments.forEach(assignment => {
        const submission = studentSubmissions.get(assignment.assignmentId);
        const assignmentPoints = assignment.points || 100;
        totalPossiblePoints += assignmentPoints;

        if (submission && submission.grade !== null && submission.grade !== undefined) {
          const earnedPoints = (submission.grade / 100) * assignmentPoints;
          totalEarnedPoints += earnedPoints;
          
          gradeRow.assignments[assignment.assignmentId] = {
            title: assignment.title,
            grade: submission.grade,
            points: assignmentPoints,
            earnedPoints: earnedPoints,
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt
          };
        } else {
          gradeRow.assignments[assignment.assignmentId] = {
            title: assignment.title,
            grade: null,
            points: assignmentPoints,
            earnedPoints: 0,
            submittedAt: null,
            gradedAt: null
          };
        }
      });

      // Calculate overall grade
      if (totalPossiblePoints > 0) {
        gradeRow.totalPoints = totalPossiblePoints;
        gradeRow.earnedPoints = totalEarnedPoints;
        gradeRow.percentage = Math.round((totalEarnedPoints / totalPossiblePoints) * 100);
        gradeRow.letterGrade = getLetterGrade(gradeRow.percentage);
      }

      gradeReport.push(gradeRow);
    }

    // Sort students alphabetically by name
    gradeReport.sort((a, b) => a.studentName.localeCompare(b.studentName));

    console.log(`✅ Generated grade report for ${gradeReport.length} students`);

    // Return based on requested format
    if (format === 'csv') {
      const csv = generateCSV(gradeReport, assignments, course);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${course.courseName}_grades_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: courseId,
          name: course.courseName,
          code: course.courseCode,
          semester: course.semester,
          year: course.year
        },
        assignments: assignments.map(a => ({
          id: a.assignmentId,
          title: a.title,
          points: a.points || 100,
          dueDate: a.dueDate,
          createdAt: a.createdAt
        })),
        students: gradeReport,
        summary: {
          totalStudents: gradeReport.length,
          totalAssignments: assignments.length,
          averageGrade: gradeReport.length > 0 
            ? Math.round(gradeReport.reduce((sum, student) => sum + student.percentage, 0) / gradeReport.length)
            : 0
        },
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error exporting grades:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export grades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

function generateCSV(gradeReport: any[], assignments: any[], course: any): string {
  const headers = [
    'Student Name',
    'Email',
    'Section',
    ...assignments.map(a => `${a.title} (${a.points || 100} pts)`),
    'Total Points',
    'Earned Points',
    'Percentage',
    'Letter Grade'
  ];

  const rows = gradeReport.map(student => [
    student.studentName,
    student.studentEmail,
    student.section,
    ...assignments.map(assignment => {
      const grade = student.assignments[assignment.assignmentId];
      return grade && grade.grade !== null ? `${grade.grade}%` : 'Not Graded';
    }),
    student.totalPoints,
    Math.round(student.earnedPoints * 100) / 100,
    `${student.percentage}%`,
    student.letterGrade
  ]);

  const csvContent = [
    `# Grade Report for ${course.courseName} (${course.courseCode})`,
    `# Generated on ${new Date().toLocaleDateString()}`,
    `# ${course.semester} ${course.year}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}