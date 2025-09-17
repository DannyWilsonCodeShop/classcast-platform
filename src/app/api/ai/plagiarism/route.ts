import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

// POST /api/ai/plagiarism - Check for plagiarism
export async function POST(request: NextRequest) {
  try {
    const { text, submissionId, assignmentId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required for plagiarism check' },
        { status: 400 }
      );
    }

    // Check for plagiarism
    const result = await aiService.detectPlagiarism(text);

    // Log the check for audit purposes
    console.log(`Plagiarism check for submission ${submissionId}: ${result.isPlagiarized ? 'PLAGIARIZED' : 'CLEAN'}`);

    return NextResponse.json({
      success: true,
      result,
      submissionId,
      assignmentId,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Plagiarism detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check for plagiarism',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/plagiarism - Get plagiarism check history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const assignmentId = searchParams.get('assignmentId');

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // In production, you'd fetch from database
    const history = {
      submissionId,
      assignmentId,
      checks: [
        {
          id: 'check_1',
          checkedAt: new Date().toISOString(),
          isPlagiarized: false,
          similarityScore: 15,
          sources: []
        }
      ]
    };

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get plagiarism history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get plagiarism history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
