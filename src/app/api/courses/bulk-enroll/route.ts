import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const sesClient = new SESClient({ region: 'us-east-1' });

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';
const ENROLLMENTS_TABLE = 'classcast-enrollments';

interface StudentEnrollment {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface EnrollmentResult {
  email: string;
  success: boolean;
  error?: string;
  invitationSent?: boolean;
  userId?: string;
}

// POST /api/courses/bulk-enroll - Bulk enroll students in a course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, students }: { courseId: string; students: StudentEnrollment[] } = body;

    if (!courseId || !students || !Array.isArray(students)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: courseId and students array'
      }, { status: 400 });
    }

    // Get course details
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }));

    if (!courseResult.Item) {
      return NextResponse.json({
        success: false,
        error: 'Course not found'
      }, { status: 404 });
    }

    const course = courseResult.Item;
    const results: EnrollmentResult[] = [];
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each student
    for (const student of students) {
      try {
        const result = await processStudentEnrollment(student, courseId, course);
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
          if (result.error) {
            errors.push(`${student.email}: ${result.error}`);
          }
        }
      } catch (error) {
        console.error(`Error processing student ${student.email}:`, error);
        results.push({
          email: student.email,
          success: false,
          error: 'Internal server error'
        });
        failed++;
        errors.push(`${student.email}: Internal server error`);
      }
    }

    return NextResponse.json({
      success: true,
      total: students.length,
      successful,
      failed,
      errors,
      results
    });

  } catch (error) {
    console.error('Error in bulk enrollment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk enrollment'
    }, { status: 500 });
  }
}

async function processStudentEnrollment(
  student: StudentEnrollment, 
  courseId: string, 
  course: any
): Promise<EnrollmentResult> {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(student.email);
    
    let userId: string;
    let invitationSent = false;

    if (existingUser) {
      userId = existingUser.userId;
    } else {
      // Create new user in Cognito
      const cognitoUser = await createCognitoUser(student);
      userId = cognitoUser.User?.Username || '';
      
      // Create user record in DynamoDB
      await createUserRecord(student, userId);
      
      // Send welcome email
      await sendWelcomeEmail(student, course);
      invitationSent = true;
    }

    // Check if already enrolled
    const existingEnrollment = await findEnrollment(userId, courseId);
    if (existingEnrollment) {
      return {
        email: student.email,
        success: true,
        invitationSent: false,
        userId,
        error: 'Already enrolled'
      };
    }

    // Create enrollment record
    await createEnrollmentRecord(userId, courseId, course);

    // Update course enrollment count
    await updateCourseEnrollmentCount(courseId, 1);

    return {
      email: student.email,
      success: true,
      invitationSent,
      userId
    };

  } catch (error) {
    console.error(`Error processing student ${student.email}:`, error);
    return {
      email: student.email,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function findUserByEmail(email: string) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));
    
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

async function createCognitoUser(student: StudentEnrollment) {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID not configured');
  }

  const tempPassword = generateTempPassword();
  
  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: student.email,
    UserAttributes: [
      { Name: 'email', Value: student.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: student.firstName || '' },
      { Name: 'family_name', Value: student.lastName || '' }
    ],
    TemporaryPassword: tempPassword,
    MessageAction: 'SUPPRESS' // We'll send our own email
  });

  const result = await cognitoClient.send(command);

  // Add user to students group
  if (result.User?.Username) {
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: result.User.Username,
      GroupName: 'students'
    }));

    // Set permanent password (user will be forced to change on first login)
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: result.User.Username,
      Password: tempPassword,
      Permanent: false
    }));
  }

  return result;
}

async function createUserRecord(student: StudentEnrollment, userId: string) {
  const now = new Date().toISOString();
  
  const userRecord = {
    userId,
    email: student.email,
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    role: 'student',
    status: 'active',
    createdAt: now,
    lastLoginAt: now,
    profile: {
      avatar: `/api/placeholder/40/40`,
      bio: ''
    }
  };

  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: userRecord
  }));
}

async function findEnrollment(userId: string, courseId: string) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: ENROLLMENTS_TABLE,
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    }));
    
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error finding enrollment:', error);
    return null;
  }
}

async function createEnrollmentRecord(userId: string, courseId: string, course: any) {
  const enrollmentId = `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const enrollment = {
    enrollmentId,
    userId,
    courseId,
    status: 'active',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
    courseName: course.courseName,
    courseCode: course.courseCode,
    instructorId: course.instructorId,
    instructorName: course.instructorName
  };

  await docClient.send(new PutCommand({
    TableName: ENROLLMENTS_TABLE,
    Item: enrollment
  }));
}

async function updateCourseEnrollmentCount(courseId: string, increment: number) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId }
    }));

    if (result.Item) {
      const currentCount = result.Item.enrollmentCount || 0;
      
      await docClient.send(new UpdateCommand({
        TableName: COURSES_TABLE,
        Key: { courseId },
        UpdateExpression: 'SET enrollmentCount = :count, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':count': currentCount + increment,
          ':updatedAt': new Date().toISOString()
        }
      }));
    }
  } catch (error) {
    console.error('Error updating course enrollment count:', error);
  }
}

async function sendWelcomeEmail(student: StudentEnrollment, course: any) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/auth/login`;
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ClassCast</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .course-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to ClassCast!</h1>
            <p>You've been enrolled in a new course</p>
        </div>
        <div class="content">
            <h2>Hello ${student.firstName || 'Student'}!</h2>
            
            <p>Great news! You've been enrolled in a new course on the ClassCast learning platform.</p>
            
            <div class="course-info">
                <h3>📚 Course Details</h3>
                <p><strong>Course:</strong> ${course.courseName}</p>
                <p><strong>Code:</strong> ${course.courseCode}</p>
                <p><strong>Instructor:</strong> ${course.instructorName}</p>
                ${course.description ? `<p><strong>Description:</strong> ${course.description}</p>` : ''}
            </div>
            
            <p>To get started, simply click the button below to log in to your account:</p>
            
            <a href="${loginUrl}" class="button">Login to ClassCast</a>
            
            <p><strong>Your login credentials:</strong></p>
            <ul>
                <li><strong>Email:</strong> ${student.email}</li>
                <li><strong>Password:</strong> You'll be prompted to set a new password on your first login</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to your instructor or our support team.</p>
            
            <p>Happy learning!</p>
            <p>The ClassCast Team</p>
        </div>
    </div>
</body>
</html>
    `;

    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL || 'noreply@classcast.com',
      Destination: {
        ToAddresses: [student.email]
      },
      Message: {
        Subject: {
          Data: `Welcome to ClassCast - Enrolled in ${course.courseName}`,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: emailContent,
            Charset: 'UTF-8'
          }
        }
      }
    });

    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
