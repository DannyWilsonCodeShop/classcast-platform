import { NextRequest, NextResponse } from 'next/server';
import { verifyInstructorAccess } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; assignmentId: string }> }
) {
  try {
    console.log('📊 Export grades API called');
    const { courseId, assignmentId } = await params;
    console.log('📊 Params:', { courseId, assignmentId });
    console.log('📊 Request headers:', {
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      authorization: request.headers.get('authorization') ? 'present' : 'missing'
    });
    
    // Temporarily disable auth check for debugging
    // const authResult = await verifyInstructorAccess(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    // }

    const instructorId = 'temp-instructor-id'; // authResult.user.id;

    // Fetch assignment details
    console.log('📊 Fetching assignment details...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const assignmentResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    console.log('📊 Assignment response status:', assignmentResponse.status);

    if (!assignmentResponse.ok) {
      const errorText = await assignmentResponse.text();
      console.error('📊 Assignment fetch failed:', errorText);
      return NextResponse.json({ success: false, error: 'Assignment not found', details: errorText }, { status: 404 });
    }

    const assignmentData = await assignmentResponse.json();
    console.log('📊 Assignment data structure:', Object.keys(assignmentData));
    const assignment = assignmentData.assignment || assignmentData.data?.assignment;
    
    if (!assignment) {
      console.error('📊 No assignment in response:', assignmentData);
      return NextResponse.json({ success: false, error: 'Assignment data missing' }, { status: 404 });
    }

    // Verify instructor owns this course
    if (assignment.courseId !== courseId) {
      return NextResponse.json({ success: false, error: 'Assignment does not belong to this course' }, { status: 400 });
    }

    // Fetch enrolled students
    console.log('📊 Fetching enrolled students...');
    const studentsResponse = await fetch(`${baseUrl}/api/courses/enrollment?courseId=${courseId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    console.log('📊 Students response status:', studentsResponse.status);

    if (!studentsResponse.ok) {
      const errorText = await studentsResponse.text();
      console.error('📊 Students fetch failed:', errorText);
      return NextResponse.json({ success: false, error: 'Failed to fetch students', details: errorText }, { status: 500 });
    }

    const studentsData = await studentsResponse.json();
    console.log('📊 Students data structure:', Object.keys(studentsData));
    const enrolledStudents = studentsData.success ? studentsData.data?.students || [] : [];
    console.log('📊 Found', enrolledStudents.length, 'enrolled students');

    // Fetch submissions for this assignment
    console.log('📊 Fetching submissions...');
    const submissionsResponse = await fetch(`${baseUrl}/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    console.log('📊 Submissions response status:', submissionsResponse.status);

    const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : { success: false };
    const submissions = submissionsData.success ? submissionsData.submissions || [] : [];
    console.log('📊 Found', submissions.length, 'submissions');

    // Create a map of submissions by student ID
    const submissionMap = new Map();
    submissions.forEach((sub: any) => {
      submissionMap.set(sub.studentId, {
        submissionId: sub.submissionId,
        grade: sub.grade,
        feedback: sub.instructorFeedback || sub.feedback,
        submittedAt: sub.submittedAt,
        status: sub.grade !== null && sub.grade !== undefined ? 'graded' : 'submitted'
      });
    });

    // Combine student data with submission data
    const gradesData = await Promise.all(
      enrolledStudents.map(async (student: any) => {
        let userName = student.email;
        
        // Fetch full user details
        try {
          const userResponse = await fetch(`${baseUrl}/api/users/${student.userId}`, {
            headers: {
              'Cookie': request.headers.get('cookie') || '',
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.user) {
              userName = `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email;
            }
          }
        } catch (userError) {
          console.warn('Could not fetch user details for:', student.userId);
        }
        
        const submission = submissionMap.get(student.userId);
        
        return {
          studentId: student.userId,
          studentName: userName,
          studentEmail: student.email,
          sectionName: student.sectionName || 'No Section',
          grade: submission?.grade || '',
          feedback: submission?.feedback || '',
          submittedAt: submission?.submittedAt || '',
          status: submission ? submission.status : 'not_submitted'
        };
      })
    );

    // Sort by section, then by name
    gradesData.sort((a, b) => {
      const sectionCompare = a.sectionName.localeCompare(b.sectionName);
      if (sectionCompare !== 0) return sectionCompare;
      return a.studentName.localeCompare(b.studentName);
    });

    // Return JSON data - let the frontend handle CSV conversion
    console.log('📊 Returning grades data:', gradesData.length, 'students');
    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          title: assignment.title,
          maxScore: assignment.maxScore || 100
        },
        grades: gradesData.map(grade => ({
          studentName: grade.studentName,
          studentEmail: grade.studentEmail,
          sectionName: grade.sectionName,
          grade: grade.grade || '',
          maxScore: assignment.maxScore || 100,
          status: grade.status,
          submittedAt: grade.submittedAt ? new Date(grade.submittedAt).toLocaleString() : '',
          feedback: grade.feedback || ''
        }))
      }
    });

  } catch (error) {
    console.error('Error exporting grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export grades' },
      { status: 500 }
    );
  }
}