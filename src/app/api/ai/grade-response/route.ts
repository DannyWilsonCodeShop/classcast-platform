import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

const dynamodbService = new DynamoDBService();

interface RubricCriteria {
  contentQuality: { possible: number; description: string };
  engagement: { possible: number; description: string };
  criticalThinking: { possible: number; description: string };
  communication: { possible: number; description: string };
}

interface AIGradeResult {
  overallGrade: number;
  rubricScores: {
    contentQuality: { earned: number; possible: number; feedback: string };
    engagement: { earned: number; possible: number; feedback: string };
    criticalThinking: { earned: number; possible: number; feedback: string };
    communication: { earned: number; possible: number; feedback: string };
  };
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  wordCount: number;
  characterCount: number;
  analysisTimestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      responseId,
      responseContent,
      videoId,
      assignmentId,
      rubric
    } = body;

    if (!responseId || !responseContent || !videoId || !assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock AI grading - in production, this would call an actual AI service
    const aiGradeResult = await performAIGrading(responseContent, rubric);

    // Save the AI grade result
    const gradeRecord = {
      id: `ai_grade_${responseId}_${Date.now()}`,
      responseId,
      videoId,
      assignmentId,
      aiGradeResult,
      createdAt: new Date().toISOString()
    };

    await dynamodbService.putItem('classcast-ai-grades', gradeRecord);

    return NextResponse.json({
      success: true,
      data: aiGradeResult,
      message: 'Response graded successfully'
    });
  } catch (error) {
    console.error('Error grading response with AI:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grade response' },
      { status: 500 }
    );
  }
}

async function performAIGrading(content: string, rubric: RubricCriteria): Promise<AIGradeResult> {
  // Mock AI grading logic - in production, this would call OpenAI, Claude, or similar
  const wordCount = content.trim().split(/\s+/).length;
  const characterCount = content.length;

  // Simulate AI analysis based on content characteristics
  const contentQualityScore = analyzeContentQuality(content, rubric.contentQuality.possible);
  const engagementScore = analyzeEngagement(content, rubric.engagement.possible);
  const criticalThinkingScore = analyzeCriticalThinking(content, rubric.criticalThinking.possible);
  const communicationScore = analyzeCommunication(content, rubric.communication.possible);

  const totalPossible = rubric.contentQuality.possible + rubric.engagement.possible + 
                       rubric.criticalThinking.possible + rubric.communication.possible;
  const totalEarned = contentQualityScore.earned + engagementScore.earned + 
                     criticalThinkingScore.earned + communicationScore.earned;

  const overallGrade = Math.round((totalEarned / totalPossible) * 100);

  return {
    overallGrade,
    rubricScores: {
      contentQuality: {
        earned: contentQualityScore.earned,
        possible: rubric.contentQuality.possible,
        feedback: contentQualityScore.feedback
      },
      engagement: {
        earned: engagementScore.earned,
        possible: rubric.engagement.possible,
        feedback: engagementScore.feedback
      },
      criticalThinking: {
        earned: criticalThinkingScore.earned,
        possible: rubric.criticalThinking.possible,
        feedback: criticalThinkingScore.feedback
      },
      communication: {
        earned: communicationScore.earned,
        possible: rubric.communication.possible,
        feedback: communicationScore.feedback
      }
    },
    overallFeedback: generateOverallFeedback(overallGrade, wordCount),
    strengths: generateStrengths(content, overallGrade),
    improvements: generateImprovements(content, overallGrade),
    wordCount,
    characterCount,
    analysisTimestamp: new Date().toISOString()
  };
}

function analyzeContentQuality(content: string, possible: number) {
  const wordCount = content.trim().split(/\s+/).length;
  const hasSpecificExamples = /example|instance|case|specifically/i.test(content);
  const hasAnalysis = /analyze|analysis|evaluate|assessment|examine/i.test(content);
  const hasConnections = /relate|connect|compare|contrast|similar|different/i.test(content);
  
  let earned = 0;
  let feedback = '';

  if (wordCount >= 100) earned += Math.floor(possible * 0.3);
  if (hasSpecificExamples) earned += Math.floor(possible * 0.3);
  if (hasAnalysis) earned += Math.floor(possible * 0.2);
  if (hasConnections) earned += Math.floor(possible * 0.2);

  if (earned >= possible * 0.8) {
    feedback = 'Excellent content quality with specific examples and thorough analysis.';
  } else if (earned >= possible * 0.6) {
    feedback = 'Good content quality with some examples and analysis.';
  } else if (earned >= possible * 0.4) {
    feedback = 'Adequate content quality but could benefit from more specific examples.';
  } else {
    feedback = 'Content quality needs improvement. Add more specific examples and analysis.';
  }

  return { earned, feedback };
}

function analyzeEngagement(content: string, possible: number) {
  const hasQuestions = /\?/g.test(content);
  const hasPersonalConnection = /I think|I believe|I feel|my opinion|personally/i.test(content);
  const hasEnthusiasm = /excellent|great|amazing|impressive|outstanding|wonderful/i.test(content);
  const hasConstructiveCriticism = /suggestion|improve|consider|perhaps|might/i.test(content);
  
  let earned = 0;
  let feedback = '';

  if (hasPersonalConnection) earned += Math.floor(possible * 0.3);
  if (hasEnthusiasm) earned += Math.floor(possible * 0.2);
  if (hasConstructiveCriticism) earned += Math.floor(possible * 0.3);
  if (hasQuestions) earned += Math.floor(possible * 0.2);

  if (earned >= possible * 0.8) {
    feedback = 'Highly engaging response that shows personal investment and constructive feedback.';
  } else if (earned >= possible * 0.6) {
    feedback = 'Engaging response with good personal connection and feedback.';
  } else if (earned >= possible * 0.4) {
    feedback = 'Somewhat engaging but could show more personal connection.';
  } else {
    feedback = 'Response lacks engagement. Try to connect personally and provide constructive feedback.';
  }

  return { earned, feedback };
}

function analyzeCriticalThinking(content: string, possible: number) {
  const hasEvaluation = /evaluate|assess|judge|critique|criticize/i.test(content);
  const hasEvidence = /evidence|proof|support|demonstrate|show/i.test(content);
  const hasAlternativeViews = /however|although|but|on the other hand|alternatively/i.test(content);
  const hasConclusion = /conclusion|therefore|thus|in summary|overall/i.test(content);
  
  let earned = 0;
  let feedback = '';

  if (hasEvaluation) earned += Math.floor(possible * 0.3);
  if (hasEvidence) earned += Math.floor(possible * 0.3);
  if (hasAlternativeViews) earned += Math.floor(possible * 0.2);
  if (hasConclusion) earned += Math.floor(possible * 0.2);

  if (earned >= possible * 0.8) {
    feedback = 'Excellent critical thinking with thorough evaluation and evidence-based analysis.';
  } else if (earned >= possible * 0.6) {
    feedback = 'Good critical thinking with some evaluation and evidence.';
  } else if (earned >= possible * 0.4) {
    feedback = 'Some critical thinking present but could be more thorough.';
  } else {
    feedback = 'Limited critical thinking. Try to evaluate more thoroughly and provide evidence.';
  }

  return { earned, feedback };
}

function analyzeCommunication(content: string, possible: number) {
  const wordCount = content.trim().split(/\s+/).length;
  const hasStructure = /first|second|third|initially|then|finally|in conclusion/i.test(content);
  const hasClarity = /clear|obvious|evident|apparent|understandable/i.test(content);
  const hasGrammar = !/i is|you is|they is|we is|he are|she are|it are/i.test(content);
  const hasPunctuation = /[.!?]$/.test(content.trim());
  
  let earned = 0;
  let feedback = '';

  if (wordCount >= 50) earned += Math.floor(possible * 0.2);
  if (hasStructure) earned += Math.floor(possible * 0.3);
  if (hasClarity) earned += Math.floor(possible * 0.2);
  if (hasGrammar) earned += Math.floor(possible * 0.2);
  if (hasPunctuation) earned += Math.floor(possible * 0.1);

  if (earned >= possible * 0.8) {
    feedback = 'Excellent communication with clear structure and good grammar.';
  } else if (earned >= possible * 0.6) {
    feedback = 'Good communication with mostly clear structure.';
  } else if (earned >= possible * 0.4) {
    feedback = 'Adequate communication but could be clearer and better structured.';
  } else {
    feedback = 'Communication needs improvement. Focus on clarity and structure.';
  }

  return { earned, feedback };
}

function generateOverallFeedback(grade: number, wordCount: number) {
  if (grade >= 90) {
    return `Outstanding response (${grade}%)! This demonstrates excellent understanding and engagement. The ${wordCount} words show thorough analysis and thoughtful feedback.`;
  } else if (grade >= 80) {
    return `Very good response (${grade}%)! This shows strong understanding with good analysis. Consider adding more specific examples to reach the next level.`;
  } else if (grade >= 70) {
    return `Good response (${grade}%)! This demonstrates solid understanding. To improve, try to be more specific and provide more detailed analysis.`;
  } else if (grade >= 60) {
    return `Adequate response (${grade}%)! This shows basic understanding but needs more depth. Focus on providing specific examples and more thorough analysis.`;
  } else {
    return `Response needs improvement (${grade}%)! This shows limited engagement. Try to provide more specific feedback, examples, and analysis to demonstrate better understanding.`;
  }
}

function generateStrengths(content: string, grade: number) {
  const strengths = [];
  
  if (content.length >= 200) strengths.push('Comprehensive response length');
  if (/example|instance|specifically/i.test(content)) strengths.push('Includes specific examples');
  if (/I think|I believe|my opinion/i.test(content)) strengths.push('Shows personal engagement');
  if (/excellent|great|impressive/i.test(content)) strengths.push('Positive and constructive tone');
  if (/however|although|but/i.test(content)) strengths.push('Shows critical thinking');
  
  if (strengths.length === 0) {
    strengths.push('Response submitted on time');
  }
  
  return strengths.slice(0, 3);
}

function generateImprovements(content: string, grade: number) {
  const improvements = [];
  
  if (content.length < 100) improvements.push('Expand response with more detailed analysis');
  if (!/example|instance|specifically/i.test(content)) improvements.push('Add specific examples to support points');
  if (!/I think|I believe|my opinion/i.test(content)) improvements.push('Include more personal perspective and engagement');
  if (!/however|although|but/i.test(content)) improvements.push('Consider alternative viewpoints and critical analysis');
  if (!/[.!?]$/.test(content.trim())) improvements.push('Improve sentence structure and punctuation');
  
  if (improvements.length === 0) {
    improvements.push('Continue building on current strengths');
  }
  
  return improvements.slice(0, 3);
}
