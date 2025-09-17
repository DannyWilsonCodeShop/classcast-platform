const AWS = require('aws-sdk');
const OpenAI = require('openai');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  const requestId = `ai_grade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting AI essay grading`);
    
    const { submissionId, essay, rubric, assignmentContext } = JSON.parse(event.body);
    
    if (!submissionId || !essay || !rubric) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: submissionId, essay, rubric'
        })
      };
    }

    // Grade the essay using AI
    const gradingResult = await gradeEssayWithAI(essay, rubric, assignmentContext, requestId);
    
    // Update submission with AI grade
    await updateSubmissionWithAIGrade(submissionId, gradingResult, requestId);
    
    console.log(`[${requestId}] AI grading completed successfully`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        result: gradingResult,
        submissionId,
        gradedAt: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error(`[${requestId}] AI grading error:`, error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'AI grading failed',
        details: error.message
      })
    };
  }
};

async function gradeEssayWithAI(essay, rubric, assignmentContext, requestId) {
  const prompt = buildEssayGradingPrompt(essay, rubric, assignmentContext);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const response = completion.choices[0]?.message?.content || '{}';
  const gradingResult = JSON.parse(response);

  // Calculate final score
  const totalScore = Object.values(gradingResult.criteria).reduce(
    (sum, criterion) => sum + criterion.score, 0
  );
  const percentage = (totalScore / rubric.maxScore) * 100;
  const letterGrade = calculateLetterGrade(percentage);

  return {
    score: totalScore,
    maxScore: rubric.maxScore,
    percentage: Math.round(percentage * 100) / 100,
    letterGrade,
    feedback: gradingResult,
    suggestions: gradingResult.suggestions || [],
    strengths: gradingResult.strengths || [],
    improvements: gradingResult.improvements || [],
    gradedBy: 'AI',
    gradedAt: new Date().toISOString()
  };
}

function buildEssayGradingPrompt(essay, rubric, context) {
  return `Please grade this essay according to the provided rubric. Return your response as a JSON object with the following structure:

{
  "criteria": {
    "content": {
      "score": [0-${rubric.criteria.content.weight}],
      "feedback": "Detailed feedback on content quality, relevance, and depth"
    },
    "structure": {
      "score": [0-${rubric.criteria.structure.weight}],
      "feedback": "Feedback on organization, flow, and logical structure"
    },
    "grammar": {
      "score": [0-${rubric.criteria.grammar.weight}],
      "feedback": "Feedback on grammar, spelling, and language mechanics"
    },
    "style": {
      "score": [0-${rubric.criteria.style.weight}],
      "feedback": "Feedback on writing style, voice, and clarity"
    }
  },
  "suggestions": ["Specific improvement suggestions"],
  "strengths": ["What the student did well"],
  "improvements": ["Areas for improvement"]
}

Essay to grade:
"${essay}"

Rubric criteria:
- Content (${rubric.criteria.content.weight} points): ${rubric.criteria.content.description}
- Structure (${rubric.criteria.structure.weight} points): ${rubric.criteria.structure.description}
- Grammar (${rubric.criteria.grammar.weight} points): ${rubric.criteria.grammar.description}
- Style (${rubric.criteria.style.weight} points): ${rubric.criteria.style.description}

${context ? `Assignment context: ${context.title} - ${context.instructions}` : ''}

Please provide fair, constructive feedback that helps the student improve.`;
}

function calculateLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

async function updateSubmissionWithAIGrade(submissionId, gradingResult, requestId) {
  const params = {
    TableName: process.env.SUBMISSIONS_TABLE_NAME || 'classcast-submissions',
    Key: { submissionId },
    UpdateExpression: 'SET #grade = :grade, #maxScore = :maxScore, #percentage = :percentage, #letterGrade = :letterGrade, #feedback = :feedback, #status = :status, #gradedAt = :gradedAt, #gradedBy = :gradedBy, #aiGrading = :aiGrading',
    ExpressionAttributeNames: {
      '#grade': 'grade',
      '#maxScore': 'maxScore',
      '#percentage': 'percentage',
      '#letterGrade': 'letterGrade',
      '#feedback': 'feedback',
      '#status': 'status',
      '#gradedAt': 'gradedAt',
      '#gradedBy': 'gradedBy',
      '#aiGrading': 'aiGrading'
    },
    ExpressionAttributeValues: {
      ':grade': gradingResult.score,
      ':maxScore': gradingResult.maxScore,
      ':percentage': gradingResult.percentage,
      ':letterGrade': gradingResult.letterGrade,
      ':feedback': JSON.stringify(gradingResult.feedback),
      ':status': 'graded',
      ':gradedAt': gradingResult.gradedAt,
      ':gradedBy': 'AI',
      ':aiGrading': true
    }
  };

  await dynamodb.update(params).promise();
  console.log(`[${requestId}] Updated submission ${submissionId} with AI grade`);
}
