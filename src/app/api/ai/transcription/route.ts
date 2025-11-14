import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

// POST /api/ai/transcription - Transcribe video/audio
export async function POST(request: NextRequest) {
  try {
    const { audioUrl, language, submissionId, assignmentId } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { success: false, error: 'Audio URL is required for transcription' },
        { status: 400 }
      );
    }

    // Transcribe the audio
    const result = await aiService.transcribeVideo(audioUrl, language || 'en');

    // Log the transcription for audit purposes
    console.log(`Transcription completed for submission ${submissionId}: ${result.text.length} characters`);

    return NextResponse.json({
      success: true,
      result,
      submissionId,
      assignmentId,
      transcribedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/transcription - Get transcription history
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
      transcriptions: [
        {
          id: 'trans_1',
          transcribedAt: new Date().toISOString(),
          text: 'Sample transcription text',
          confidence: 0.95,
          language: 'en',
          duration: 120
        }
      ]
    };

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get transcription history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get transcription history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
