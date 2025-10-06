import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '../../../../lib/dynamodb';
import { RealtimeNotifier } from '../../websocket/route';

// POST /api/courses/enrollment - Enroll student in course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, studentId, studentEmail, studentFirstName, studentLastName } = body;

    if (!courseId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID and Student ID are required',
        },
        { status: 400 }
      );
    }

    // Get course details
    const course = await dynamoDBService.getItem<any>('classcast-courses', { courseId });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    // Check if course is published
    if (course.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Course is not available for enrollment',
        },
        { status: 400 }
      );
    }

    // Check if course is full
    if (course.maxStudents && course.currentEnrollment >= course.maxStudents) {
      // Add to waitlist
      const waitlistEntry = {
        userId: studentId,
        email: studentEmail || '',
        firstName: studentFirstName || '',
        lastName: studentLastName || '',
        addedAt: new Date().toISOString(),
      };

      await dynamoDBService.updateItem(
        'classcast-courses', 
        { courseId }, 
        'SET enrollment.waitlist = list_append(if_not_exists(enrollment.waitlist, :empty_list), :waitlist_entry)',
        {
          ':waitlist_entry': [waitlistEntry],
          ':empty_list': [],
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Added to waitlist',
        data: { status: 'waitlist' },
      });
    }

    // Check if student is already enrolled
    const existingStudent = course.enrollment?.students?.find(
      (s: any) => s.userId === studentId
    );

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student is already enrolled in this course',
        },
        { status: 409 }
      );
    }

    // Enroll student
    const studentEntry = {
      userId: studentId,
      email: studentEmail || '',
      firstName: studentFirstName || '',
      lastName: studentLastName || '',
      enrolledAt: new Date().toISOString(),
      status: 'active',
    };

    await dynamoDBService.updateItem(
      'classcast-courses', 
      { courseId }, 
      'SET enrollment.students = list_append(if_not_exists(enrollment.students, :empty_list), :student_entry), currentEnrollment = currentEnrollment + :increment',
      {
        ':student_entry': [studentEntry],
        ':empty_list': [],
        ':increment': 1,
      }
    );

    // Send real-time notification
    try {
      await RealtimeNotifier.notifyAnnouncement({
        type: 'student_enrolled',
        title: 'New Student Enrolled',
        message: `${studentFirstName} ${studentLastName} has enrolled in ${course.title}`,
        courseId,
        instructorId: course.instructorId,
      });
    } catch (notificationError) {
      console.error('Failed to send real-time notification:', notificationError);
    }

    // Send email notification to instructor
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student_enrolled',
          userId: course.instructorId,
          data: {
            courseTitle: course.title,
            studentName: `${studentFirstName} ${studentLastName}`,
            studentEmail: studentEmail,
            enrollmentDate: studentEntry.enrolledAt,
          },
        }),
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Student enrolled successfully',
      data: { status: 'enrolled' },
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enroll student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/enrollment - Unenroll student from course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');

    if (!courseId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID and Student ID are required',
        },
        { status: 400 }
      );
    }

    // Get course details
    const course = await dynamoDBService.getItem<any>('classcast-courses', { courseId });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    // Find and remove student from enrollment
    const updatedStudents = course.enrollment?.students?.filter(
      (s: any) => s.userId !== studentId
    ) || [];

    await dynamoDBService.updateItem(
      'classcast-courses', 
      { courseId }, 
      'SET enrollment.students = :students, currentEnrollment = :enrollment',
      {
        ':students': updatedStudents,
        ':enrollment': updatedStudents.length,
      }
    );

    // If there's a waitlist, move the first student from waitlist to enrollment
    if (course.enrollment?.waitlist?.length > 0) {
      const nextStudent = course.enrollment.waitlist[0];
      const remainingWaitlist = course.enrollment.waitlist.slice(1);

      const enrolledStudent = {
        ...nextStudent,
        enrolledAt: new Date().toISOString(),
        status: 'active',
      };

      await dynamoDBService.updateItem(
        'classcast-courses', 
        { courseId }, 
        'SET enrollment.students = list_append(enrollment.students, :new_student), enrollment.waitlist = :waitlist, currentEnrollment = currentEnrollment + :increment',
        {
          ':new_student': [enrolledStudent],
          ':waitlist': remainingWaitlist,
          ':increment': 1,
        }
      );

      // Notify the student who was moved from waitlist
      try {
        await RealtimeNotifier.notifyAnnouncement({
          type: 'enrollment_available',
          title: 'Enrollment Available',
          message: `A spot has opened up in ${course.title}. You have been automatically enrolled!`,
          courseId,
          studentId: nextStudent.userId,
        });
      } catch (notificationError) {
        console.error('Failed to send waitlist notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Student unenrolled successfully',
    });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unenroll student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/courses/enrollment - Get course enrollment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID is required',
        },
        { status: 400 }
      );
    }

    // Get course enrollment
    const course = await dynamoDBService.getItem<any>('classcast-courses', { courseId });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        courseId: course.courseId,
        title: course.title,
        currentEnrollment: course.currentEnrollment,
        maxStudents: course.maxStudents,
        students: course.enrollment?.students || [],
        waitlist: course.enrollment?.waitlist || [],
      },
    });
  } catch (error) {
    console.error('Error fetching course enrollment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch course enrollment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
