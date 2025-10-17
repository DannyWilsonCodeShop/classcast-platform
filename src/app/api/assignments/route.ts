import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig } from '@/lib/aws-config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);
const sesClient = new SESClient({ region: process.env.REGION || 'us-east-1' });

const ASSIGNMENTS_TABLE = awsConfig.dynamodb.tables.assignments;
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get assignments from database
    let assignments = [];
    
    try {
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        ...(courseId && {
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        })
      }));
      
      assignments = assignmentsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: {
            assignments: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      }
      throw dbError;
    }

    // Filter by course if specified
    let filteredAssignments = assignments;
    if (courseId) {
      filteredAssignments = assignments.filter(assignment => assignment.courseId === courseId);
    }

    // Calculate submission counts for each assignment
    const assignmentsWithCounts = await Promise.all(
      filteredAssignments.map(async (assignment) => {
        try {
          // Get submission count for this assignment
          const submissionsResult = await docClient.send(new ScanCommand({
            TableName: 'classcast-submissions',
            FilterExpression: 'assignmentId = :assignmentId',
            ExpressionAttributeValues: {
              ':assignmentId': assignment.assignmentId || assignment.id
            },
            Select: 'COUNT'
          }));
          
          const submissionsCount = submissionsResult.Count || 0;
          
          // Get graded count
          const gradedResult = await docClient.send(new ScanCommand({
            TableName: 'classcast-submissions',
            FilterExpression: 'assignmentId = :assignmentId AND attribute_exists(grade)',
            ExpressionAttributeValues: {
              ':assignmentId': assignment.assignmentId || assignment.id
            },
            Select: 'COUNT'
          }));
          
          const gradedCount = gradedResult.Count || 0;
          
          return {
            ...assignment,
            submissionsCount,
            gradedCount
          };
        } catch (error) {
          console.error(`Error calculating counts for assignment ${assignment.assignmentId}:`, error);
          return {
            ...assignment,
            submissionsCount: 0,
            gradedCount: 0
          };
        }
      })
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssignments = assignmentsWithCounts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        totalCount: assignmentsWithCounts.length,
        currentPage: page,
        totalPages: Math.ceil(assignmentsWithCounts.length / limit),
        hasNextPage: endIndex < assignmentsWithCounts.length,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch assignments' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      assignmentType,
      dueDate,
      maxScore,
      weight,
      requirements,
      allowLateSubmission,
      latePenalty,
      maxSubmissions,
      groupAssignment,
      maxGroupSize,
      allowedFileTypes,
      maxFileSize,
      status,
      courseId,
      instructorId,
      rubric,
      // Peer Review Settings
      peerReview,
      peerReviewScope,
      peerReviewCount,
      peerReviewDeadline,
      anonymousReview,
      allowSelfReview,
      instructorReview,
      peerReviewInstructions,
      targetSections,
      resources
    } = body;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!instructorId || typeof instructorId !== 'string' || instructorId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    if (maxScore && (typeof maxScore !== 'number' || maxScore < 1 || maxScore > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Max score must be a number between 1 and 1000' },
        { status: 400 }
      );
    }

    if (weight && (typeof weight !== 'number' || weight < 0 || weight > 100)) {
      return NextResponse.json(
        { success: false, error: 'Weight must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxSubmissions && (typeof maxSubmissions !== 'number' || maxSubmissions < 1 || maxSubmissions > 10)) {
      return NextResponse.json(
        { success: false, error: 'Max submissions must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    if (maxGroupSize && (typeof maxGroupSize !== 'number' || maxGroupSize < 2 || maxGroupSize > 20)) {
      return NextResponse.json(
        { success: false, error: 'Max group size must be a number between 2 and 20' },
        { status: 400 }
      );
    }

    if (latePenalty && (typeof latePenalty !== 'number' || latePenalty < 0 || latePenalty > 100)) {
      return NextResponse.json(
        { success: false, error: 'Late penalty must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate due date format if provided
    if (dueDate && typeof dueDate === 'string') {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Due date must be a valid date' },
          { status: 400 }
        );
      }
    }

    // Generate assignment ID
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create assignment object with sanitized data
    const assignment = {
      assignmentId,
      courseId: courseId.trim(),
      instructorId: instructorId.trim(),
      title: title.trim(),
      description: description?.trim() || '',
      assignmentType: assignmentType || 'video',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxScore: maxScore || 100,
      weight: weight || 10,
      requirements: Array.isArray(requirements) ? requirements : [],
      allowLateSubmission: allowLateSubmission || false,
      latePenalty: latePenalty || 0,
      maxSubmissions: maxSubmissions || 1,
      groupAssignment: groupAssignment || false,
      maxGroupSize: maxGroupSize || 4,
      allowedFileTypes: Array.isArray(allowedFileTypes) ? allowedFileTypes : ['mp4', 'mov', 'avi'],
      maxFileSize: maxFileSize || 100 * 1024 * 1024, // 100MB
      status: status || 'draft',
      rubric: rubric || null,
      // Peer Review Settings
      peerReview: peerReview || false,
      peerReviewScope: peerReviewScope || 'section',
      peerReviewCount: peerReviewCount || 3,
      peerReviewDeadline: peerReviewDeadline || 7,
      anonymousReview: anonymousReview !== undefined ? anonymousReview : true,
      allowSelfReview: allowSelfReview || false,
      instructorReview: instructorReview !== undefined ? instructorReview : true,
      peerReviewInstructions: peerReviewInstructions?.trim() || '',
      targetSections: Array.isArray(targetSections) ? targetSections : [],
      resources: Array.isArray(resources) ? resources : [],
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    // Save to database
    await docClient.send(new PutCommand({
      TableName: ASSIGNMENTS_TABLE,
      Item: assignment
    }));

    // Send email notifications to enrolled students (don't await - fire and forget)
    sendAssignmentNotifications(assignment, courseId).catch(error => {
      console.error('Error sending assignment notifications:', error);
      // Don't fail the assignment creation if emails fail
    });

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create assignment' 
      },
      { status: 500 }
    );
  }
}

/**
 * Send email notifications to all enrolled students when a new assignment is created
 */
async function sendAssignmentNotifications(assignment: any, courseId: string) {
  try {
    console.log(`📧 Sending assignment notifications for ${assignment.assignmentId}`);

    // Get course details
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }));

    const course = courseResult.Item;
    if (!course) {
      console.warn('Course not found, skipping email notifications');
      return;
    }

    const courseName = course.title || course.courseName || 'Your Course';
    const enrolledStudents = course.enrollment?.students || [];

    console.log(`Found ${enrolledStudents.length} enrolled students`);

    if (enrolledStudents.length === 0) {
      console.log('No students enrolled, skipping notifications');
      return;
    }

    // Get student details for each enrolled student
    const studentEmails = [];
    for (const enrolledStudent of enrolledStudents) {
      try {
        const userResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: enrolledStudent.userId }
        }));

        const user = userResult.Item;
        if (user && user.email) {
          studentEmails.push({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          });
        }
      } catch (error) {
        console.error(`Error fetching user ${enrolledStudent.userId}:`, error);
      }
    }

    console.log(`Sending emails to ${studentEmails.length} students`);

    // Format due date
    const dueDate = new Date(assignment.dueDate);
    const dueDateFormatted = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send email to each student
    const emailPromises = studentEmails.map(async (student) => {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Assignment - ClassCast</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #005587, #0077b6); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .assignment-box { background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #005587; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .assignment-box h2 { margin-top: 0; color: #005587; }
              .due-date { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 15px 0; }
              .due-date strong { color: #856404; }
              .button { display: inline-block; background: #005587; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .button:hover { background: #004466; }
              .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
              .course-info { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0077b6; }
              .course-info strong { color: #0c4a6e; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📚 New Assignment Posted</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">ClassCast</p>
              </div>
              
              <div class="content">
                <p>Hello ${student.name}!</p>
                
                <p>A new assignment has been posted in your course:</p>
                
                <div class="course-info">
                  <strong>📖 Course:</strong> ${courseName}
                </div>
                
                <div class="assignment-box">
                  <h2>${assignment.title}</h2>
                  ${assignment.description ? `<p>${assignment.description}</p>` : ''}
                  <p><strong>Points:</strong> ${assignment.maxScore} points</p>
                </div>
                
                <div class="due-date">
                  <strong>⏰ Due Date:</strong> ${dueDateFormatted}
                </div>
                
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com'}/student/assignments/${assignment.assignmentId}" class="button">
                    View Assignment
                  </a>
                </p>
                
                <div class="footer">
                  <p>This notification was sent from ClassCast Learning Management System.</p>
                  <p>If you have questions about this assignment, please contact your instructor.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const command = new SendEmailCommand({
          Source: process.env.SES_SENDER_EMAIL || 'noreply@class-cast.com',
          Destination: {
            ToAddresses: [student.email]
          },
          Message: {
            Subject: {
              Data: `[ClassCast] New Assignment: ${assignment.title}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: emailHtml,
                Charset: 'UTF-8'
              },
              Text: {
                Data: `
New Assignment Posted

Hello ${student.name}!

A new assignment has been posted in ${courseName}:

Title: ${assignment.title}
${assignment.description ? `Description: ${assignment.description}` : ''}
Points: ${assignment.maxScore}
Due Date: ${dueDateFormatted}

View the assignment at: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com'}/student/assignments/${assignment.assignmentId}

---
This notification was sent from ClassCast Learning Management System.
                `.trim(),
                Charset: 'UTF-8'
              }
            }
          }
        });

        await sesClient.send(command);
        console.log(`✅ Email sent to ${student.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);
      }
    });

    await Promise.allSettled(emailPromises);
    console.log(`📧 Finished sending ${emailPromises.length} assignment notification emails`);

  } catch (error) {
    console.error('Error in sendAssignmentNotifications:', error);
    throw error;
  }
}