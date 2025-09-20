import { NextRequest, NextResponse } from 'next/server';

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

interface VideoSubmission {
  id: string;
  studentId: string;
  videoUrl: string;
  duration: number;
  assignmentTitle: string;
}

interface AutoGradeRequest {
  submission: VideoSubmission;
  rubric: {
    id: string;
    name: string;
    criteria: RubricCriteria[];
    totalPoints: number;
  };
}

interface AutoGradeResponse {
  success: boolean;
  grade?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    criteriaScores: Array<{
      criteriaId: string;
      criteriaName: string;
      score: number;
      maxScore: number;
      feedback: string;
      rationale: string;
    }>;
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    rationale: string;
    confidence: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { submission, rubric }: AutoGradeRequest = await request.json();

    // Simulate AI video analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate AI analysis of video content
    const criteriaScores = rubric.criteria.map(criteria => {
      // Simulate AI scoring based on video analysis
      // In a real implementation, this would use computer vision and NLP
      const baseScore = Math.random() * criteria.maxPoints;
      const score = Math.min(Math.max(baseScore, criteria.maxPoints * 0.3), criteria.maxPoints);
      
      return {
        criteriaId: criteria.id,
        criteriaName: criteria.name,
        score: Math.round(score),
        maxScore: criteria.maxPoints,
        feedback: generateCriteriaFeedback(criteria, score),
        rationale: generateCriteriaRationale(criteria, score, submission)
      };
    });

    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const percentage = (totalScore / rubric.totalPoints) * 100;
    const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence

    const response: AutoGradeResponse = {
      success: true,
      grade: {
        totalScore,
        maxScore: rubric.totalPoints,
        percentage: Math.round(percentage),
        criteriaScores,
        overallFeedback: generateOverallFeedback(totalScore, rubric.totalPoints, submission),
        strengths: generateStrengths(criteriaScores),
        improvements: generateImprovements(criteriaScores),
        rationale: generateOverallRationale(criteriaScores, submission, confidence),
        confidence
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Auto-grading error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process auto-grading request' 
      },
      { status: 500 }
    );
  }
}

function generateCriteriaFeedback(criteria: RubricCriteria, score: number): string {
  const percentage = (score / criteria.maxPoints) * 100;
  
  if (percentage >= 90) {
    return `Excellent work! ${criteria.description.toLowerCase()} was outstanding.`;
  } else if (percentage >= 80) {
    return `Good work! ${criteria.description.toLowerCase()} was well done with minor areas for improvement.`;
  } else if (percentage >= 70) {
    return `Satisfactory work. ${criteria.description.toLowerCase()} met expectations but could be enhanced.`;
  } else if (percentage >= 60) {
    return `Needs improvement. ${criteria.description.toLowerCase()} was below expectations.`;
  } else {
    return `Requires significant improvement. ${criteria.description.toLowerCase()} did not meet basic requirements.`;
  }
}

function generateCriteriaRationale(criteria: RubricCriteria, score: number, submission: VideoSubmission): string {
  const percentage = (score / criteria.maxPoints) * 100;
  
  if (criteria.id === 'content') {
    if (percentage >= 80) {
      return `The content was comprehensive and well-researched, with clear examples and accurate information. The student demonstrated strong understanding of the topic.`;
    } else if (percentage >= 60) {
      return `The content covered the main points but lacked depth in some areas. Some information could have been more detailed or better explained.`;
    } else {
      return `The content was incomplete or contained inaccuracies. Key concepts were missing or misunderstood.`;
    }
  } else if (criteria.id === 'presentation') {
    if (percentage >= 80) {
      return `The presentation was well-organized with clear structure and smooth delivery. The student spoke clearly and maintained good pace.`;
    } else if (percentage >= 60) {
      return `The presentation had good structure but could have been more polished. Some areas were unclear or rushed.`;
    } else {
      return `The presentation lacked organization and clarity. The delivery was difficult to follow.`;
    }
  } else if (criteria.id === 'engagement') {
    if (percentage >= 80) {
      return `The student effectively engaged the audience with good eye contact, enthusiasm, and interactive elements.`;
    } else if (percentage >= 60) {
      return `The presentation was somewhat engaging but could have used more interactive elements or enthusiasm.`;
    } else {
      return `The presentation lacked engagement and audience interaction. The delivery was monotone or disinterested.`;
    }
  } else if (criteria.id === 'technical') {
    if (percentage >= 80) {
      return `Excellent technical quality with clear audio, good lighting, and professional production value.`;
    } else if (percentage >= 60) {
      return `Good technical quality overall, with minor issues in audio or video that didn't significantly impact understanding.`;
    } else {
      return `Technical quality issues affected the overall presentation. Audio or video problems made it difficult to follow.`;
    }
  }
  
  return `Based on the video analysis, this criteria received a score of ${Math.round(score)}/${criteria.maxPoints}.`;
}

function generateOverallFeedback(totalScore: number, maxScore: number, submission: VideoSubmission): string {
  const percentage = (totalScore / maxScore) * 100;
  
  if (percentage >= 90) {
    return `Outstanding work! This submission demonstrates excellent understanding and presentation skills. The content was comprehensive, well-organized, and engaging. Keep up the great work!`;
  } else if (percentage >= 80) {
    return `Great job! This is a solid submission with good content and presentation. There are a few areas that could be enhanced, but overall this shows strong understanding.`;
  } else if (percentage >= 70) {
    return `Good work overall. The submission meets the basic requirements and shows understanding of the material. Consider focusing on the areas mentioned in the detailed feedback.`;
  } else if (percentage >= 60) {
    return `This submission needs improvement. While some good elements are present, there are several areas that require attention to meet the assignment expectations.`;
  } else {
    return `This submission requires significant improvement. The content and presentation did not meet the basic requirements. Please review the detailed feedback and consider resubmitting.`;
  }
}

function generateStrengths(criteriaScores: Array<{criteriaName: string, score: number, maxScore: number}>): string[] {
  const strengths: string[] = [];
  
  criteriaScores.forEach(cs => {
    const percentage = (cs.score / cs.maxScore) * 100;
    if (percentage >= 80) {
      if (cs.criteriaName === 'Content Quality') {
        strengths.push('Comprehensive and accurate content');
      } else if (cs.criteriaName === 'Presentation Skills') {
        strengths.push('Clear and well-organized presentation');
      } else if (cs.criteriaName === 'Engagement') {
        strengths.push('Effective audience engagement');
      } else if (cs.criteriaName === 'Technical Quality') {
        strengths.push('Professional production quality');
      }
    }
  });
  
  return strengths.length > 0 ? strengths : ['Shows effort and understanding of the assignment'];
}

function generateImprovements(criteriaScores: Array<{criteriaName: string, score: number, maxScore: number}>): string[] {
  const improvements: string[] = [];
  
  criteriaScores.forEach(cs => {
    const percentage = (cs.score / cs.maxScore) * 100;
    if (percentage < 70) {
      if (cs.criteriaName === 'Content Quality') {
        improvements.push('Enhance content depth and accuracy');
      } else if (cs.criteriaName === 'Presentation Skills') {
        improvements.push('Improve organization and delivery clarity');
      } else if (cs.criteriaName === 'Engagement') {
        improvements.push('Increase audience interaction and enthusiasm');
      } else if (cs.criteriaName === 'Technical Quality') {
        improvements.push('Address audio/video quality issues');
      }
    }
  });
  
  return improvements.length > 0 ? improvements : ['Continue practicing and refining your skills'];
}

function generateOverallRationale(
  criteriaScores: Array<{criteriaName: string, score: number, maxScore: number}>, 
  submission: VideoSubmission, 
  confidence: number
): string {
  const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
  const maxScore = criteriaScores.reduce((sum, cs) => sum + cs.maxScore, 0);
  const percentage = (totalScore / maxScore) * 100;
  
  let rationale = `This grade is based on AI analysis of the ${Math.round(submission.duration / 60)}-minute video submission. `;
  
  if (percentage >= 80) {
    rationale += `The video demonstrated strong performance across all criteria, with particularly notable strengths in content quality and presentation skills. The student showed clear understanding of the material and delivered it effectively.`;
  } else if (percentage >= 60) {
    rationale += `The video showed good understanding of the material with solid presentation skills. While there were some areas that could be improved, the overall submission met the assignment requirements.`;
  } else {
    rationale += `The video analysis revealed several areas that need improvement, including content accuracy and presentation clarity. The submission would benefit from additional preparation and practice.`;
  }
  
  rationale += ` The AI confidence level for this assessment is ${Math.round(confidence * 100)}%.`;
  
  return rationale;
}
