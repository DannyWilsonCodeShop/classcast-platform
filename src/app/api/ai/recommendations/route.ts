import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

// POST /api/ai/recommendations - Get AI recommendations
export async function POST(request: NextRequest) {
  try {
    const { userId, type, context } = await request.json();

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'userId and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['content', 'study_group', 'assignment', 'resource'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recommendation type' },
        { status: 400 }
      );
    }

    // Get recommendations
    const result = await aiService.getRecommendations(userId, type as any, context || {});

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/recommendations - Get recommendation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // In production, you'd fetch from database
    const history = {
      userId,
      type: type || 'all',
      recommendations: [
        {
          id: 'rec_1',
          type: 'content',
          title: 'Advanced Calculus Tutorial',
          description: 'Comprehensive tutorial on advanced calculus concepts',
          relevanceScore: 85,
          reason: 'Based on your recent assignment performance',
          createdAt: new Date().toISOString()
        },
        {
          id: 'rec_2',
          type: 'study_group',
          title: 'Study Group: Linear Algebra',
          description: 'Join other students studying linear algebra',
          relevanceScore: 92,
          reason: 'Matches your current course and learning style',
          createdAt: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get recommendation history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get recommendation history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
