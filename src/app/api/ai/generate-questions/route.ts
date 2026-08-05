import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockConfig: any = {
  region: process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1',
};
const bedrock = new BedrockRuntimeClient(bedrockConfig);

/**
 * POST /api/ai/generate-questions
 * Generates individual questions or a full question bank for a topic.
 * Body: { topic, gradeLevel, questionCount, questionType, additionalContext }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, gradeLevel, questionCount = 10, questionType = 'mixed', additionalContext } = body;

    if (!topic || !gradeLevel) {
      return NextResponse.json({ success: false, error: 'topic and gradeLevel are required' }, { status: 400 });
    }

    const typeInstruction = questionType === 'mixed'
      ? 'Mix of multiple-choice, short-answer, and true/false questions'
      : questionType === 'multiple-choice'
      ? 'All multiple-choice questions with 4 options each'
      : questionType === 'true-false'
      ? 'All true/false questions'
      : 'Short-answer questions requiring a brief written response';

    const prompt = `You are an expert K-12 curriculum designer. Generate a question bank for a classroom assessment platform.

Topic/Standard: ${topic}
Grade Level: ${gradeLevel}
Number of Questions: ${questionCount}
Question Format: ${typeInstruction}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate a JSON object with this structure:
{
  "bankTitle": "A descriptive title for this question bank",
  "bankDescription": "Brief description of what this bank covers",
  "questions": [
    {
      "id": "q_1",
      "type": "multiple-choice",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is the correct answer",
      "difficulty": "medium",
      "points": 1
    },
    {
      "id": "q_2",
      "type": "true-false",
      "question": "Statement to evaluate",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "Explanation",
      "difficulty": "easy",
      "points": 1
    },
    {
      "id": "q_3",
      "type": "short-answer",
      "question": "Open-ended question",
      "correctAnswer": "Expected answer or key points",
      "explanation": "What a good answer includes",
      "difficulty": "hard",
      "points": 2
    }
  ]
}

Requirements:
- Generate exactly ${questionCount} questions
- Each question needs a unique "id" like "q_1", "q_2", etc
- Difficulty should be a mix of "easy", "medium", and "hard"
- Multiple-choice must have exactly 4 options
- All questions must be age-appropriate for ${gradeLevel}
- Be specific and accurate to the topic
- Include clear explanations for correct answers
- For multiple-choice, make distractors plausible but clearly wrong

Return ONLY valid JSON, no markdown or explanation.`;

    const command = new ConverseCommand({
      modelId: 'amazon.nova-micro-v1:0',
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 4000 },
    });

    const response = await bedrock.send(command);
    const aiText = response.output?.message?.content?.[0]?.text || '';

    let generated;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      } else {
        generated = JSON.parse(aiText);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI questions response:', aiText.substring(0, 500));
      return NextResponse.json({ success: false, error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...generated,
        topic,
        gradeLevel,
        questionCount: generated.questions?.length || questionCount,
      },
    });
  } catch (error: any) {
    console.error('AI question generation error:', error);
    if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
      return NextResponse.json({ success: false, error: 'AI service credentials not configured.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate questions' }, { status: 500 });
  }
}
