import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

// POST /api/ai/analytics - Get predictive analytics
export async function POST(request: NextRequest) {
  try {
    const { studentData } = await request.json();

    if (!studentData || !studentData.userId) {
      return NextResponse.json(
        { success: false, error: 'Student data with userId is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['userId', 'courseId', 'assignmentHistory', 'engagementMetrics'];
    const missingFields = requiredFields.filter(field => !studentData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get predictive analytics
    const result = await aiService.predictStudentSuccess(studentData);

    return NextResponse.json({
      success: true,
      result,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Predictive analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze student data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/analytics - Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const instructorId = searchParams.get('instructorId');

    if (!courseId || !instructorId) {
      return NextResponse.json(
        { success: false, error: 'courseId and instructorId are required' },
        { status: 400 }
      );
    }

    // In production, you'd fetch from database and run analytics
    const dashboardData = {
      courseId,
      instructorId,
      summary: {
        totalStudents: 25,
        atRiskStudents: 3,
        highPerformers: 8,
        averageGrade: 82.5,
        completionRate: 94.2
      },
      predictions: [
        {
          studentId: 'student_1',
          name: 'John Doe',
          successProbability: 85,
          predictedGrade: 'B+',
          riskFactors: ['Late submissions'],
          recommendations: ['Improve time management']
        },
        {
          studentId: 'student_2',
          name: 'Jane Smith',
          successProbability: 95,
          predictedGrade: 'A',
          riskFactors: [],
          recommendations: ['Continue current approach']
        }
      ],
      trends: {
        gradeDistribution: {
          'A': 8,
          'B': 12,
          'C': 4,
          'D': 1,
          'F': 0
        },
        engagementTrends: [
          { week: 'Week 1', engagement: 85 },
          { week: 'Week 2', engagement: 78 },
          { week: 'Week 3', engagement: 92 },
          { week: 'Week 4', engagement: 88 }
        ]
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get analytics dashboard',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
