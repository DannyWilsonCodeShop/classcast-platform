import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing course creation...');
    
    const testCourseData = {
      title: 'Test Course - Manual Creation',
      description: 'This is a test course created to verify functionality',
      code: 'TEST101',
      classCode: 'TEST1234',
      department: 'Computer Science',
      semester: 'Fall+Spring',
      year: 2024,
      backgroundColor: '#FF6F61',
      instructorId: 'test-instructor-123',
      coInstructorEmail: 'co-instructor@test.com',
      coInstructorName: 'Dr. Co Instructor',
      maxStudents: 25,
      startDate: '2024-01-15',
      endDate: '2024-05-15',
      prerequisites: [],
      learningObjectives: ['Learn testing', 'Understand debugging'],
      gradingPolicy: {
        assignments: 40,
        quizzes: 20,
        exams: 30,
        participation: 5,
        final: 5,
      },
      resources: {
        textbooks: [],
        materials: [],
      },
      settings: {
        allowLateSubmissions: true,
        latePenalty: 10,
        allowResubmissions: false,
        requireAttendance: false,
        enableDiscussions: true,
        enableAnnouncements: true,
        privacy: 'public' as const,
      }
    };

    console.log('🧪 Test course data:', testCourseData);

    // Call the courses API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCourseData),
    });

    const result = await response.json();
    
    console.log('🧪 Course creation result:', result);

    if (result.success) {
      // Now test fetching courses for this instructor
      const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/instructor/courses?instructorId=test-instructor-123`);
      const fetchResult = await fetchResponse.json();
      
      console.log('🧪 Fetch courses result:', fetchResult);

      return NextResponse.json({
        success: true,
        message: 'Test completed successfully',
        results: {
          creation: result,
          fetch: fetchResult
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Course creation failed',
        error: result.error,
        details: result
      });
    }

  } catch (error) {
    console.error('🧪 Test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}