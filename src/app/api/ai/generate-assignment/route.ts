import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Use explicit credentials if provided, otherwise fall back to default credential chain (Amplify service role)
const bedrockConfig: any = {
  region: process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1',
};

const accessKeyId = process.env.CLASSCAST_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLASSCAST_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
if (accessKeyId && secretAccessKey) {
  bedrockConfig.credentials = { accessKeyId, secretAccessKey };
}
// If no explicit credentials, SDK uses the default provider chain (IAM role)

const bedrock = new BedrockRuntimeClient(bedrockConfig);

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
      "id": "cat_1",
      "name": "Category Name",
      "levels": [
        { "score": 4, "description": "Excellent - description" },
        { "score": 3, "description": "Good - description" },
        { "score": 2, "description": "Developing - description" },
        { "score": 1, "description": "Beginning - description" }
      ]
    }
  ],
  "maxScore": <total max points from rubric>,
  "discussionPrompt": "If discussion type, the specific discussion question",
  "assessmentQuestions": [
    { "questionId": "q_1", "questionText": "question", "timeLimitSeconds": 60, "orderIndex": 0 }
  ],
  "groupProjectTopic": "If group project, the specific topic for groups",
  "suggestedDueInDays": 7
}

Requirements:
- Title should be engaging and age-appropriate for ${gradeLevel}
- Description should be detailed enough for students to understand exactly what to do
- Rubric should have 3-5 categories with 4 scoring levels each (scores 1-4)
- Each rubric category needs a unique "id" like "cat_1", "cat_2" etc
- For assessments, generate 3-5 timed questions with unique questionId
- For discussions, include a thought-provoking prompt
- Keep language appropriate for the grade level
- Be specific to the topic/standard provided

Return ONLY valid JSON, no markdown or explanation.`;

    const command = new ConverseCommand({
      modelId: 'amazon.nova-micro-v1:0',
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2500 },
    });

    const response = await bedrock.send(command);
    const aiText = response.output?.message?.content?.[0]?.text || '';

    // Parse the JSON from AI response
    let generated;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      } else {
        generated = JSON.parse(aiText);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', aiText.substring(0, 500));
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
    
    if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
      return NextResponse.json({ success: false, error: 'AI service credentials not configured. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to Amplify environment variables, or attach bedrock:InvokeModel permission to the Amplify service role.' }, { status: 503 });
    }
    
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate assignment' }, { status: 500 });
  }
}
