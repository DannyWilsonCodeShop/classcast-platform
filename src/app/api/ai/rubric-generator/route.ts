import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, assignmentType, maxScore, requirements } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required for rubric generation' },
        { status: 400 }
      );
    }

    // Mock AI-generated rubric based on assignment details
    const generateRubric = () => {
      const baseCriteria = [
        {
          name: 'Content Quality',
          description: 'Depth, accuracy, and relevance of the content presented',
          points: Math.floor(maxScore * 0.3),
          levels: [
            { name: 'Excellent', points: Math.floor(maxScore * 0.3), description: 'Comprehensive, accurate, and highly relevant content' },
            { name: 'Good', points: Math.floor(maxScore * 0.2), description: 'Mostly accurate and relevant content with minor gaps' },
            { name: 'Satisfactory', points: Math.floor(maxScore * 0.15), description: 'Adequate content with some inaccuracies or gaps' },
            { name: 'Needs Improvement', points: Math.floor(maxScore * 0.05), description: 'Limited or inaccurate content' }
          ]
        },
        {
          name: 'Presentation Skills',
          description: 'Clarity, organization, and delivery of the presentation',
          points: Math.floor(maxScore * 0.25),
          levels: [
            { name: 'Excellent', points: Math.floor(maxScore * 0.25), description: 'Clear, well-organized, and engaging presentation' },
            { name: 'Good', points: Math.floor(maxScore * 0.2), description: 'Mostly clear and organized presentation' },
            { name: 'Satisfactory', points: Math.floor(maxScore * 0.15), description: 'Adequate presentation with some clarity issues' },
            { name: 'Needs Improvement', points: Math.floor(maxScore * 0.05), description: 'Unclear or poorly organized presentation' }
          ]
        },
        {
          name: 'Technical Accuracy',
          description: 'Correctness of technical concepts and implementation',
          points: Math.floor(maxScore * 0.25),
          levels: [
            { name: 'Excellent', points: Math.floor(maxScore * 0.25), description: 'Highly accurate technical content' },
            { name: 'Good', points: Math.floor(maxScore * 0.2), description: 'Mostly accurate with minor technical errors' },
            { name: 'Satisfactory', points: Math.floor(maxScore * 0.15), description: 'Generally accurate with some technical issues' },
            { name: 'Needs Improvement', points: Math.floor(maxScore * 0.05), description: 'Significant technical inaccuracies' }
          ]
        },
        {
          name: 'Creativity & Innovation',
          description: 'Originality and creative approach to the assignment',
          points: Math.floor(maxScore * 0.2),
          levels: [
            { name: 'Excellent', points: Math.floor(maxScore * 0.2), description: 'Highly creative and innovative approach' },
            { name: 'Good', points: Math.floor(maxScore * 0.15), description: 'Some creative elements and original thinking' },
            { name: 'Satisfactory', points: Math.floor(maxScore * 0.1), description: 'Basic approach with limited creativity' },
            { name: 'Needs Improvement', points: Math.floor(maxScore * 0.05), description: 'Lacks creativity or originality' }
          ]
        }
      ];

      // Customize criteria based on assignment type
      if (assignmentType === 'video_discussion') {
        baseCriteria[1].name = 'Discussion Engagement';
        baseCriteria[1].description = 'Quality of participation and engagement in discussion';
        baseCriteria[3].name = 'Peer Interaction';
        baseCriteria[3].description = 'Quality of responses to peers and contribution to discussion';
      } else if (assignmentType === 'video_assessment') {
        baseCriteria[1].name = 'Assessment Accuracy';
        baseCriteria[1].description = 'Accuracy in responding to assessment questions';
        baseCriteria[3].name = 'Critical Thinking';
        baseCriteria[3].description = 'Demonstration of critical thinking and analysis';
      }

      // Add specific requirements as additional criteria
      const requirementCriteria = requirements
        .filter((req: string) => req.trim())
        .slice(0, 2) // Limit to 2 additional criteria
        .map((req: string, index: number) => ({
          name: `Requirement ${index + 1}`,
          description: req.trim(),
          points: Math.floor(maxScore * 0.1),
          levels: [
            { name: 'Excellent', points: Math.floor(maxScore * 0.1), description: 'Fully meets requirement' },
            { name: 'Good', points: Math.floor(maxScore * 0.08), description: 'Mostly meets requirement' },
            { name: 'Satisfactory', points: Math.floor(maxScore * 0.06), description: 'Partially meets requirement' },
            { name: 'Needs Improvement', points: Math.floor(maxScore * 0.02), description: 'Does not meet requirement' }
          ]
        }));

      return [...baseCriteria, ...requirementCriteria];
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
