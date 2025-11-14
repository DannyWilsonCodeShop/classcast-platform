import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

// POST /api/ai/grading - Grade essay with AI
export async function POST(request: NextRequest) {
  try {
    const { essay, rubric, assignmentContext } = await request.json();

    if (!essay || !rubric) {
      return NextResponse.json(
        { success: false, error: 'Essay and rubric are required' },
        { status: 400 }
      );
    }

    // Validate rubric structure
    if (!rubric.maxScore || !rubric.criteria) {
      return NextResponse.json(
        { success: false, error: 'Invalid rubric structure' },
        { status: 400 }
      );
    }

    // Grade the essay
    const result = await aiService.gradeEssay(essay, rubric, assignmentContext);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('AI Grading error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to grade essay',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/grading - Get grading templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'essay';

    const templates = {
      essay: {
        maxScore: 100,
        criteria: {
          content: { weight: 40, description: 'Quality of ideas, depth of analysis, and relevance to topic' },
          structure: { weight: 25, description: 'Organization, flow, and logical progression' },
          grammar: { weight: 20, description: 'Grammar, spelling, and language mechanics' },
          style: { weight: 15, description: 'Writing style, voice, and clarity' }
        }
      },
      research: {
        maxScore: 100,
        criteria: {
          content: { weight: 35, description: 'Quality of research and analysis' },
          structure: { weight: 20, description: 'Organization and logical flow' },
          citations: { weight: 25, description: 'Proper citation and academic integrity' },
          grammar: { weight: 20, description: 'Grammar and language mechanics' }
        }
      },
      creative: {
        maxScore: 100,
        criteria: {
          creativity: { weight: 40, description: 'Originality and creative expression' },
          content: { weight: 30, description: 'Quality of ideas and development' },
          style: { weight: 20, description: 'Writing style and voice' },
          grammar: { weight: 10, description: 'Basic grammar and mechanics' }
        }
      }
    };

    return NextResponse.json({
      success: true,
      templates,
      selectedTemplate: templates[type as keyof typeof templates] || templates.essay
    });
  } catch (error) {
    console.error('Get grading templates error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get grading templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
