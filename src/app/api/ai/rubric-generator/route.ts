import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, assignmentType, maxScore, requirements, customCategories } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required for rubric generation' },
        { status: 400 }
      );
    }

    if (!customCategories || customCategories.length === 0) {
      return NextResponse.json(
        { error: 'At least one rubric category is required' },
        { status: 400 }
      );
    }

    // Mock AI-generated rubric based on custom categories
    const generateRubric = () => {
      return customCategories.map((category: any) => {
        const points = category.points;
        const categoryName = category.name;
        const categoryDescription = category.description || `Evaluation of ${categoryName.toLowerCase()}`;
        
        // Generate performance levels based on the points
        const levels = [
          { 
            name: 'Excellent', 
            points: Math.floor(points * 0.9), 
            description: `Outstanding ${categoryName.toLowerCase()} that exceeds expectations` 
          },
          { 
            name: 'Good', 
            points: Math.floor(points * 0.75), 
            description: `Strong ${categoryName.toLowerCase()} that meets most expectations` 
          },
          { 
            name: 'Satisfactory', 
            points: Math.floor(points * 0.6), 
            description: `Adequate ${categoryName.toLowerCase()} that meets basic expectations` 
          },
          { 
            name: 'Needs Improvement', 
            points: Math.floor(points * 0.3), 
            description: `Limited ${categoryName.toLowerCase()} that falls below expectations` 
          }
        ];

        // Customize descriptions based on assignment type
        if (assignmentType === 'video_discussion') {
          if (categoryName.toLowerCase().includes('engagement') || categoryName.toLowerCase().includes('discussion')) {
            levels[0].description = 'Highly engaged with thoughtful, insightful contributions';
            levels[1].description = 'Good participation with meaningful contributions';
            levels[2].description = 'Basic participation with some relevant contributions';
            levels[3].description = 'Limited participation with minimal contributions';
          }
        } else if (assignmentType === 'video_assessment') {
          if (categoryName.toLowerCase().includes('accuracy') || categoryName.toLowerCase().includes('assessment')) {
            levels[0].description = 'Completely accurate responses with deep understanding';
            levels[1].description = 'Mostly accurate with minor errors';
            levels[2].description = 'Generally accurate with some misconceptions';
            levels[3].description = 'Significant inaccuracies or misunderstandings';
          }
        }

        return {
          name: categoryName,
          description: categoryDescription,
          points: points,
          levels: levels
        };
      });
    };

    const rubric = {
      title: `${title} - Grading Rubric`,
      description: `AI-generated rubric for: ${description}`,
      totalPoints: maxScore,
      criteria: generateRubric(),
      generatedAt: new Date().toISOString(),
      generatedBy: 'AI Assistant'
    };

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      rubric,
      message: 'Rubric generated successfully'
    });

  } catch (error) {
    console.error('Error generating rubric:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate rubric',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
