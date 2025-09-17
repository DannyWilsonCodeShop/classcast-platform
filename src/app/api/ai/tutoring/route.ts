import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';
import { TutoringSession } from '@/lib/aiService';

// POST /api/ai/tutoring - Start or continue tutoring session
export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId, courseId, assignmentId, context } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Get or create session
    let session: TutoringSession;
    if (sessionId) {
      // In production, you'd fetch from database
      session = {
        sessionId,
        userId,
        courseId,
        assignmentId,
        messages: [],
        context: context || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new session
      session = {
        sessionId: `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        courseId,
        assignmentId,
        messages: [],
        context: context || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Get AI response
    const { response, session: updatedSession } = await aiService.chatWithTutor(
      message,
      session,
      { assignmentId, courseId }
    );

    return NextResponse.json({
      success: true,
      response,
      session: updatedSession
    });
  } catch (error) {
    console.error('Tutoring API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get tutoring assistance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/tutoring - Get tutoring session history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'sessionId and userId are required' },
        { status: 400 }
      );
    }

    // In production, you'd fetch from database
    const session: TutoringSession = {
      sessionId,
      userId,
      messages: [],
      context: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get tutoring session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get tutoring session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
