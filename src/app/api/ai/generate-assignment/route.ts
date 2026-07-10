import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface GenerateRequest {
  topic: string;
  gradeLevel: string;
  assignmentType: 'video' | 'discussion' | 'assessment' | 'group-project' | 'study-module';
  additionalContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { topic, gradeLevel, assignmentType, additionalContext } = body;

    if (!topic || !gradeLevel || !assignmentType) {
      return NextResponse.json({ success: false, error: 'topic, gradeLevel, and assignmentType are required' }, { status: 400 });
    }

    const typeDescriptions: Record<string, string> = {
      'video': 'a video assignment where students record themselves answering a prompt on camera',
      'discussion': 'a discussion board where students respond to a prompt and engage with peers',
      'assessment': 'a timed video assessment with questions that appear on screen one at a time',
      'group-project': 'a collaborative group video project where student groups create videos together',
      'study-module': 'a self-paced study module with lessons, videos, and quizzes',
    };

    const prompt = `You are an expert K-12 curriculum designer. Generate a complete assignment for a classroom platform called ClassCast.

Topic/Standard: ${topic}
Grade Level: ${gradeLevel}
Assignment Type: ${typeDescriptions[assignmentType] || assignmentType}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate the following as a JSON object:
{
  "title": "A clear, engaging assignment title",
  "description": "Detailed instructions for students (2-3 paragraphs). Include the prompt/question they need to address, what's expected, and any guidelines.",
  "rubric": [
    {
      "name": "Category Name",
      "levels": [
        { "score": 4, "description": "Excellent - description" },
        { "score": 3, "description": "Good - description" },
        { "score": 2, "description": "Developing - description" },
        { "score": 1, "description": "Beginning - description" }
      ]
    }
  ],
  "maxScore": <total points from rubric>,
  "discussionPrompt": "If discussion type, the specific discussion question",
  "assessmentQuestions": [
    { "questionText": "question", "timeLimitSeconds": 60 }
  ],
  "groupProjectTopic": "If group project, the specific topic for groups",
  "suggestedDueInDays": 7
}

Requirements:
- Title should be engaging and age-appropriate for ${gradeLevel}
- Description should be detailed enough for students to understand exactly what to do
- Rubric should have 3-5 categories with 4 scoring levels each
- For assessments, generate 3-5 timed questions
- For discussions, include a thought-provoking prompt
- Keep language appropriate for the grade level
- Be specific to the topic/standard provided

Return ONLY valid JSON, no markdown or explanation.`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content?.[0]?.text || '';

    // Parse the JSON from AI response
    let generated;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      } else {
        generated = JSON.parse(aiText);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', aiText);
      return NextResponse.json({ success: false, error: 'AI generated invalid response. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...generated,
        assignmentType,
        gradeLevel,
        topic,
      },
    });
  } catch (error: any) {
    console.error('AI generation error:', error);
    
    // Handle Bedrock access errors
    if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
      return NextResponse.json({ success: false, error: 'AI service not configured. Contact administrator.' }, { status: 503 });
    }
    
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate assignment' }, { status: 500 });
  }
}
