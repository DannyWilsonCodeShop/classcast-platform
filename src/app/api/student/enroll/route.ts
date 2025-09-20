import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { classCode } = await request.json();

    if (!classCode || typeof classCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Class code is required' },
        { status: 400 }
      );
    }

    // Normalize the class code
    const normalizedClassCode = classCode.trim().toUpperCase();

    if (normalizedClassCode.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Class code must be at least 6 characters' },
        { status: 400 }
      );
    }

    // TODO: In a real implementation, you would:
    // 1. Validate the class code exists in the database
    // 2. Check if the student is already enrolled
    // 3. Add the student to the class
    // 4. Return the class details

    // For now, we'll simulate a successful enrollment
    const mockClassDetails = {
      id: `class_${Date.now()}`,
      code: normalizedClassCode,
      name: `Class ${normalizedClassCode}`,
      description: `Welcome to ${normalizedClassCode}! This class was created by your instructor.`,
      instructor: 'Dr. Smith',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      progress: 0,
      assignmentCount: 0,
      studentCount: 1,
    };

    // Simulate a small delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled in ${normalizedClassCode}`,
      class: mockClassDetails,
    });

  } catch (error) {
    console.error('Error enrolling in class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in class' },
      { status: 500 }
    );
  }
}
