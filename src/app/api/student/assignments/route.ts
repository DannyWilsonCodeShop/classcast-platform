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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching assignments for user:', userId, 'course:', courseId);

    // Get all assignments for the course (or all courses if no courseId)
    let assignments = [];
    let userCourses = [];
    
    if (courseId) {
      // Get assignments for specific course
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      }));
      assignments = assignmentsResult.Items || [];
      
      // Get the specific course info
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      }));
      userCourses = coursesResult.Items || [];
    } else {
      // Get assignments for all user's courses
      // First, get all courses and filter by enrollment in code since DynamoDB doesn't support complex nested queries
      const allCoursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));
      
      const allCourses = allCoursesResult.Items || [];
      
      // Filter courses where user is enrolled
      userCourses = allCourses.filter(course => {
        if (!course.enrollment || !course.enrollment.students) return false;
        
        // Check if user is in the enrollment.students array
        return course.enrollment.students.some((student: any) => {
          // Handle both string userId and object with userId field
          if (typeof student === 'string') {
            return student === userId;
          } else if (student && student.userId) {
            return student.userId === userId;
          }
          return false;
        });
      });
      
      console.log(`Found ${userCourses.length} courses for user ${userId}`);
      
      const courseIds = userCourses.map(course => course.courseId);
      
      if (courseIds.length > 0) {
        // Get assignments for all user's courses
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
        assignments = assignmentResults.flatMap(result => result.Items || []);
      }
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

    // Create course map from userCourses
    const courseMap = new Map();
    userCourses.forEach(course => {
      courseMap.set(course.courseId, course);
    });

    // Process assignments
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        console.log('Processing assignment:', { 
          assignmentId: assignment.assignmentId, 
          id: assignment.id, 
          title: assignment.title 
        });
        
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
          attachments: assignment.resources || [],
          instructionalVideoUrl: assignment.instructionalVideoUrl || '', // ADD INSTRUCTIONAL VIDEO URL
          enablePeerResponses: assignment.enablePeerResponses || false,
          minResponsesRequired: assignment.minResponsesRequired || 0,
          maxResponsesPerVideo: assignment.maxResponsesPerVideo || 0,
          hidePeerVideosUntilInstructorPosts: assignment.hidePeerVideosUntilInstructorPosts || false
        };
      })
    );
    
    // Sort assignments by due date
    enrichedAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({ assignments: enrichedAssignments }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}