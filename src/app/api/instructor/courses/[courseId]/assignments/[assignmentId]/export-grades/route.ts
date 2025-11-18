import { NextRequest, NextResponse } from 'next/server';
import { verifyInstructorAccess } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; assignmentId: string } }
) {
  try {
    const { courseId, assignmentId } = params;
    
    // Verify instructor access
    const authResult = await verifyInstructorAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const instructorId = authResult.user.id;

    // Fetch assignment details
    const assignmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assignments/${assignmentId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!assignmentResponse.ok) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const assignmentData = await assignmentResponse.json();
    const assignment = assignmentData.assignment;

    // Verify instructor owns this course
    if (assignment.courseId !== courseId) {
      return NextResponse.json({ success: false, error: 'Assignment does not belong to this course' }, { status: 400 });
    }

    // Fetch enrolled students
    const studentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/courses/enrollment?courseId=${courseId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!studentsResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 });
    }

    const studentsData = await studentsResponse.json();
    const enrolledStudents = studentsData.success ? studentsData.data?.students || [] : [];

    // Fetch submissions for this assignment
    const submissionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : { success: false };
    const submissions = submissionsData.success ? submissionsData.submissions || [] : [];

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
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users/${student.userId}`, {
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

    // Generate CSV content
    const csvHeaders = [
      'Student Name',
      'Email',
      'Section',
      'Grade',
      'Max Score',
      'Status',
      'Submitted At',
      'Feedback'
    ];

    const csvRows = gradesData.map(grade => [
      grade.studentName,
      grade.studentEmail,
      grade.sectionName,
      grade.grade || '',
      assignment.maxScore || 100,
      grade.status,
      grade.submittedAt ? new Date(grade.submittedAt).toLocaleString() : '',
      (grade.feedback || '').replace(/"/g, '""') // Escape quotes in feedback
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
            ? `"${cell}"`
            : cell
        ).join(',')
      )
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}_grades.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export grades' },
      { status: 500 }
    );
  }
}