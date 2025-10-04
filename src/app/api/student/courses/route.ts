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
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Helper function to determine course status
    const getCourseStatus = (assignmentsDue: number, nextDeadline: string | null) => {
      const now = new Date();
      
      if (assignmentsDue === 0) {
        return 'up-to-date';
      }
      
      if (nextDeadline) {
        const deadline = new Date(nextDeadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (daysDiff < 0) {
          return 'past-due';
        } else if (daysDiff <= 3) {
          return 'upcoming';
        }
      }
      
      return 'up-to-date';
    };

    // Get courses where user is enrolled
    // Note: We need to scan all courses and filter by enrollment.students array
    // because DynamoDB's contains() doesn't work with nested object properties
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    // Filter courses where the user is enrolled
    console.log(`Filtering courses for userId: ${userId}`);
    console.log(`Total courses found: ${coursesResult.Items?.length || 0}`);
    
    const courses = (coursesResult.Items || []).filter(course => {
      if (!course.enrollment?.students) {
        console.log(`Course ${course.title} has no enrollment.students`);
        return false;
      }

      console.log(`Checking course ${course.title} with ${course.enrollment.students.length} students`);
      
      // Check if user is enrolled (handle both string and object formats)
      const isEnrolled = course.enrollment.students.some((student: any) => {
        if (typeof student === 'string') {
          const match = student === userId;
          if (match) console.log(`Found string match for userId: ${userId}`);
          return match;
        } else if (typeof student === 'object' && student.userId) {
          const match = student.userId === userId;
          if (match) console.log(`Found object match for userId: ${userId} in student:`, student);
          return match;
        }
        return false;
      });
      
      console.log(`Course ${course.title} enrollment check result: ${isEnrolled}`);
      return isEnrolled;
    });
    
    console.log(`Final filtered courses count: ${courses.length}`);
    
    // Get assignments for these courses
    const courseIds = courses.map(course => course.courseId);
    let allAssignments: any[] = [];
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
    const submittedAssignmentIds = new Set(userSubmissions.map(sub => sub.assignmentId));
    
    // Process each course
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        // Get instructor information
        let instructor = {
          name: course.instructorName || 'Unknown Instructor',
          avatar: '/api/placeholder/40/40'
        };
        
        if (course.instructorId) {
          try {
            const instructorResult = await docClient.send(new GetCommand({
              TableName: USERS_TABLE,
              Key: { userId: course.instructorId }
            }));
            
            if (instructorResult.Item) {
              instructor = {
                name: `${instructorResult.Item.firstName || ''} ${instructorResult.Item.lastName || ''}`.trim() || course.instructorName || 'Unknown Instructor',
                avatar: instructorResult.Item.avatar || '/api/placeholder/40/40'
              };
            }
          } catch (error) {
            console.error(`Error fetching instructor ${course.instructorId}:`, error);
          }
        }
        
        // Get assignments for this course
        const courseAssignments = allAssignments.filter(assignment => 
          assignment.courseId === course.courseId
        );
        
        // Calculate assignments due
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const assignmentsDue = courseAssignments.filter(assignment => {
          const dueDate = new Date(assignment.dueDate);
          return dueDate > now && dueDate <= oneWeekFromNow && !submittedAssignmentIds.has(assignment.assignmentId);
        });
        
        // Find next deadline
        const upcomingAssignments = courseAssignments.filter(assignment => {
          const dueDate = new Date(assignment.dueDate);
          return dueDate > now && !submittedAssignmentIds.has(assignment.assignmentId);
        });
        
        const nextDeadline = upcomingAssignments.length > 0 
          ? upcomingAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate
          : null;
        
        // Generate color based on course code
        const colors = ['#4A90E2', '#06D6A0', '#9B5DE5', '#FFD166', '#FF6F61', '#E91E63', '#2ECC71', '#F39C12'];
        const colorIndex = course.code ? course.code.charCodeAt(0) % colors.length : 0;
        const color = colors[colorIndex];
        
        return {
          id: course.courseId,
          code: course.code || 'N/A',
          name: course.courseName || course.title || 'Untitled Course',
          description: course.description || 'No description available',
          instructor,
          assignmentsDue: assignmentsDue.length,
          nextDeadline,
          color,
          status: getCourseStatus(assignmentsDue.length, nextDeadline),
          assignmentCount: courseAssignments.length,
          backgroundColor: color
        };
      })
    );

    return NextResponse.json({ courses: enrichedCourses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}