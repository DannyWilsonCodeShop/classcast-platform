import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      assignmentId, 
      videoId, 
      studentId, 
      content,
      assignment 
    } = body;

    // Validate response limits
    const validation = {
      canSubmit: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check if peer responses are enabled
    if (!assignment?.enablePeerResponses) {
      validation.canSubmit = false;
      validation.errors.push('Peer responses are not enabled for this assignment');
      return NextResponse.json({ validation });
    }

    // Check if response is within due date
    if (assignment.responseDueDate) {
      const now = new Date();
      const responseDueDate = new Date(assignment.responseDueDate);
      
      if (now > responseDueDate) {
        validation.canSubmit = false;
        validation.errors.push('Response due date has passed');
        return NextResponse.json({ validation });
      }
    }

    // Check word count
    if (assignment.responseWordLimit) {
      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount < assignment.responseWordLimit) {
        validation.canSubmit = false;
        validation.errors.push(`Response must be at least ${assignment.responseWordLimit} words (currently ${wordCount})`);
      }
    }

    // Check character count
    if (assignment.responseCharacterLimit) {
      const characterCount = content.length;
      if (characterCount > assignment.responseCharacterLimit) {
        validation.canSubmit = false;
        validation.errors.push(`Response must be no more than ${assignment.responseCharacterLimit} characters (currently ${characterCount})`);
      }
    }

    // Check if student has reached minimum responses required
    if (assignment.minResponsesRequired) {
      // Mock: Get student's response count for this assignment
      const studentResponseCount = await getStudentResponseCount(assignmentId, studentId);
      
      if (studentResponseCount >= assignment.minResponsesRequired) {
        validation.warnings.push(`You have already submitted ${studentResponseCount} responses (minimum required: ${assignment.minResponsesRequired})`);
      }
    }

    // Check if video has reached maximum responses
    if (assignment.maxResponsesPerVideo) {
      // Mock: Get response count for this video
      const videoResponseCount = await getVideoResponseCount(videoId);
      
      if (videoResponseCount >= assignment.maxResponsesPerVideo) {
        validation.canSubmit = false;
        validation.errors.push(`This video has reached the maximum number of responses (${assignment.maxResponsesPerVideo})`);
      }
    }

    return NextResponse.json({ validation });

  } catch (error) {
    console.error('Error validating peer response:', error);
    return NextResponse.json(
      { error: 'Failed to validate peer response' },
      { status: 500 }
    );
  }
}

// Mock functions - in real implementation, these would query the database
async function getStudentResponseCount(assignmentId: string, studentId: string): Promise<number> {
  // Mock data - in real implementation, query database
  return 1; // Mock: student has submitted 1 response
}

async function getVideoResponseCount(videoId: string): Promise<number> {
  // Mock data - in real implementation, query database
  return 2; // Mock: video has 2 responses
}
