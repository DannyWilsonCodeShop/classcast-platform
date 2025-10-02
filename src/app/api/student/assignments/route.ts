import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    // Get user ID and course ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If courseId is provided, only get assignments for that specific course
    if (courseId) {
      // Verify user is enrolled in this course
      const courseResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'courseId = :courseId AND contains(enrollment.students, :userId)',
        ExpressionAttributeValues: {
          ':courseId': courseId,
          ':userId': userId
        }
      }));
      
      if (courseResult.Items?.length === 0) {
        return NextResponse.json({ assignments: [] });
      }

      // Get assignments for the specific course
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      }));
      
      const allAssignments = assignmentsResult.Items || [];
      
      // Get user's submissions for this course
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));
      
      const userSubmissions = submissionsResult.Items || [];
      const submissionMap = new Map();
      userSubmissions.forEach(sub => {
        submissionMap.set(sub.assignmentId, sub);
      });
      
      // Create course lookup map
      const course = courseResult.Items?.[0];
      const courseMap = new Map();
      if (course) {
        courseMap.set(course.courseId, course);
      }
      
      // Process assignments for the specific course
      const enrichedAssignments = await Promise.all(
        allAssignments.map(async (assignment) => {
          const course = courseMap.get(assignment.courseId);
          const submission = submissionMap.get(assignment.assignmentId);
          
          // Determine assignment status
          const now = new Date();
          const dueDate = new Date(assignment.dueDate);
          let status = 'upcoming';
          
          if (submission) {
            status = 'completed';
          } else if (dueDate < now) {
            status = 'past_due';
          }
          
          // Get instructor information
          let instructorName = course?.instructorName || 'Unknown Instructor';
          if (course?.instructorId) {
            try {
              const instructorResult = await docClient.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId: course.instructorId }
              }));
              
              if (instructorResult.Item) {
                instructorName = `${instructorResult.Item.firstName || ''} ${instructorResult.Item.lastName || ''}`.trim() || course.instructorName || 'Unknown Instructor';
              }
            } catch (instructorError) {
              console.warn('Failed to fetch instructor info:', instructorError);
            }
          }
          
          return {
            assignmentId: assignment.assignmentId,
            title: assignment.title || 'Untitled Assignment',
            description: assignment.description || 'No description available',
            dueDate: assignment.dueDate,
            status,
            points: assignment.maxScore || 100,
            submissionType: assignment.type === 'video_presentation' ? 'video' : 'file',
            assignmentType: assignment.type || 'Assignment',
            isSubmitted: !!submission,
            submittedAt: submission?.submittedAt || null,
            grade: submission?.grade || null,
            feedback: submission?.feedback || null,
            instructor: instructorName,
            createdAt: assignment.createdAt || new Date().toISOString(),
            attachments: assignment.attachments || []
          };
        })
      );
      
      // Sort assignments by due date
      enrichedAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return NextResponse.json({ assignments: enrichedAssignments });
    }

    // If no courseId provided, get assignments for all user's courses (original behavior)
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'contains(enrollment.students, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    const courses = coursesResult.Items || [];
    const courseIds = courses.map(course => course.courseId);
    
    if (courseIds.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // Get assignments for user's courses
    let allAssignments = [];
    if (courseIds.length > 0) {
      // DynamoDB doesn't support IN with expression attribute values directly
      const assignmentPromises = courseIds.map(courseId => 
        docClient.send(new ScanCommand({
          TableName: ASSIGNMENTS_TABLE,
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        }))
      );
      
      const assignmentResults = await Promise.all(assignmentPromises);
      allAssignments = assignmentResults.flatMap(result => result.Items || []);
    }
    
    // Get user's submissions
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    const userSubmissions = submissionsResult.Items || [];
    const submissionMap = new Map();
    userSubmissions.forEach(sub => {
      submissionMap.set(sub.assignmentId, sub);
    });
    
    // Create course lookup map
    const courseMap = new Map();
    courses.forEach(course => {
      courseMap.set(course.courseId, course);
    });
    
    // Process assignments
    const enrichedAssignments = await Promise.all(
      allAssignments.map(async (assignment) => {
        const course = courseMap.get(assignment.courseId);
        const submission = submissionMap.get(assignment.assignmentId);
        
        // Determine assignment status
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        let status = 'upcoming';
        
        if (submission) {
          status = 'completed';
        } else if (dueDate < now) {
          status = 'past_due';
        }
        
        // Get instructor information
        let instructorName = course?.instructorName || 'Unknown Instructor';
        if (course?.instructorId) {
          try {
            const instructorResult = await docClient.send(new GetCommand({
              TableName: USERS_TABLE,
              Key: { userId: course.instructorId }
            }));
            
            if (instructorResult.Item) {
              instructorName = `${instructorResult.Item.firstName || ''} ${instructorResult.Item.lastName || ''}`.trim() || course.instructorName || 'Unknown Instructor';
            }
          } catch (error) {
            console.error(`Error fetching instructor ${course.instructorId}:`, error);
          }
        }
        
        return {
          id: assignment.assignmentId,
          courseId: assignment.courseId,
          courseName: course?.title || 'Unknown Course',
          courseCode: course?.code || 'N/A',
          title: assignment.title || 'Untitled Assignment',
          description: assignment.description || 'No description available',
          dueDate: assignment.dueDate,
          status,
          points: assignment.maxScore || 100,
          submissionType: assignment.type === 'video_presentation' ? 'video' : 'file',
          assignmentType: assignment.type || 'Assignment',
          isSubmitted: !!submission,
          submittedAt: submission?.submittedAt || null,
          grade: submission?.grade || null,
          feedback: submission?.feedback || null,
          instructor: instructorName,
          createdAt: assignment.createdAt || new Date().toISOString(),
          attachments: assignment.attachments || []
        };
      })
    );
    
    // Sort assignments by due date
    enrichedAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({ assignments: enrichedAssignments });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}