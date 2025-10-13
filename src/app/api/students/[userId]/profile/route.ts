import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching profile for user:', userId);

    // Get user profile
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: userId }
    }));

    if (!userResult.Item) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.Item;

    // Get user's courses
    let courses = [];
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE
      }));

      if (coursesResult.Items) {
        courses = coursesResult.Items.filter(course => 
          course.enrollment?.students?.some((student: any) => 
            student.userId === userId || student.id === userId
          )
        ).map(course => ({
          id: course.courseId,
          name: course.title || course.name,
          code: course.code,
          instructor: course.instructor?.name || 'Unknown Instructor'
        }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }

    // Get user's submission stats
    let stats = {
      totalSubmissions: 0,
      completedAssignments: 0,
      averageGrade: 0
    };

    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (submissionsResult.Items) {
        const submissions = submissionsResult.Items;
        stats.totalSubmissions = submissions.length;
        
        const gradedSubmissions = submissions.filter(sub => 
          sub.grade !== undefined && sub.grade !== null
        );
        stats.completedAssignments = gradedSubmissions.length;
        
        if (gradedSubmissions.length > 0) {
          const totalGrade = gradedSubmissions.reduce((sum, sub) => {
            const grade = parseFloat(sub.grade) || 0;
            const maxPoints = parseFloat(sub.maxPoints) || 100;
            return sum + (grade / maxPoints * 100);
          }, 0);
          stats.averageGrade = Math.round(totalGrade / gradedSubmissions.length);
        }
      }
    } catch (error) {
      console.error('Error fetching submission stats:', error);
    }

    // Build profile object
    const profile = {
      id: user.userId,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      avatar: user.avatar || user.profile?.avatar,
      bio: user.bio || user.profile?.bio,
      careerGoals: user.careerGoals || user.profile?.careerGoals,
      classOf: user.classOf || user.profile?.classOf,
      funFact: user.funFact || user.profile?.funFact,
      favoriteSubject: user.favoriteSubject || user.profile?.favoriteSubject,
      hobbies: user.hobbies || user.profile?.hobbies,
      schoolName: user.schoolName || user.profile?.schoolName,
      schoolLogo: user.schoolLogo || user.profile?.schoolLogo,
      enrollmentDate: user.enrollmentDate || user.createdAt,
      lastActive: user.lastActive || user.updatedAt,
      courses: courses,
      stats: stats
    };

    console.log('Profile fetched successfully for user:', userId);

    return NextResponse.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
