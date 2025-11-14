import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
    // Get course details
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }));
    
    if (!courseResult.Item) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const course = courseResult.Item;
    const enrolledStudents = course.enrollment?.students || [];
    
    if (enrolledStudents.length === 0) {
      return NextResponse.json({ students: [] });
    }
    
    // Get student details
    const studentsResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'userId IN :studentIds',
      ExpressionAttributeValues: {
        ':studentIds': enrolledStudents
      }
    }));
    
    const students = studentsResult.Items || [];
    
    // Get assignments for this course
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));
    
    const assignments = assignmentsResult.Items || [];
    const assignmentIds = assignments.map(assignment => assignment.assignmentId);
    
    // Get submissions for these assignments
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'assignmentId IN :assignmentIds',
      ExpressionAttributeValues: {
        ':assignmentIds': assignmentIds
      }
    }));
    
    const allSubmissions = submissionsResult.Items || [];
    
    // Process each student
    const enrichedStudents = students.map(student => {
      // Get submissions for this student
      const studentSubmissions = allSubmissions.filter(submission => 
        submission.studentId === student.userId
      );
      
      // Calculate average grade
      const gradedSubmissions = studentSubmissions.filter(sub => sub.grade);
      const averageGrade = gradedSubmissions.length > 0 
        ? Math.round(gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubmissions.length)
        : 0;
      
      // Get last activity (most recent submission)
      const lastSubmission = studentSubmissions
        .filter(sub => sub.submittedAt)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
      
      const lastActive = lastSubmission?.submittedAt || student.updatedAt || student.createdAt;
      
      return {
        id: student.userId,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
        email: student.email || 'No email',
        enrollmentDate: course.enrollment?.enrollmentDate || new Date().toISOString(),
        lastActive: lastActive,
        submissionsCount: studentSubmissions.length,
        averageGrade: averageGrade
      };
    });
    
    // Sort by name
    enrichedStudents.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ students: enrichedStudents });
  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
