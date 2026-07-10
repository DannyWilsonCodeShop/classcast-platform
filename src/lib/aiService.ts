import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const MODEL_ID = 'amazon.nova-micro-v1:0';

async function callBedrock(prompt: string, maxTokens = 1500, temperature = 0.5): Promise<string> {
  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens, temperature },
  });
  const response = await bedrock.send(command);
  return response.output?.message?.content?.[0]?.text || '';
}

function parseJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return JSON.parse(text);
}

export interface TutoringMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface TutoringSession {
  sessionId: string;
  userId: string;
  courseId?: string;
  assignmentId?: string;
  messages: TutoringMessage[];
  context: {
    subject?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    learningGoals?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface EssayGradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  feedback: {
    overall: string;
    criteria: {
      content: { score: number; feedback: string };
      structure: { score: number; feedback: string };
      grammar: { score: number; feedback: string };
      style: { score: number; feedback: string };
    };
  };
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

export interface PlagiarismResult {
  isPlagiarized: boolean;
  similarityScore: number;
  sources: Array<{
    text: string;
    similarity: number;
    source?: string;
    url?: string;
  }>;
  originalText: string;
  flaggedText: string[];
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language: string;
  duration: number;
}

export interface RecommendationResult {
  type: 'content' | 'study_group' | 'assignment' | 'resource';
  items: Array<{
    id: string;
    title: string;
    description: string;
    relevanceScore: number;
    reason: string;
  }>;
  userId: string;
  context: string;
}

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // AI Tutoring Assistant
  public async chatWithTutor(
    message: string,
    session: TutoringSession,
    context?: { assignmentId?: string; courseId?: string }
  ): Promise<{ response: string; session: TutoringSession }> {
    try {
      const systemContext = `You are an AI tutoring assistant for ClassCast, an educational platform.
Your role: Provide clear explanations, ask guiding questions, offer examples, encourage learning.
Subject: ${session.context.subject || 'General'}
Difficulty: ${session.context.difficulty || 'intermediate'}
Goals: ${session.context.learningGoals?.join(', ') || 'General learning'}
${context?.assignmentId ? `Assignment: ${context.assignmentId}` : ''}

Previous conversation:
${session.messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Student says: ${message}

Respond helpfully, educationally, and encouragingly.`;

      const responseText = await callBedrock(systemContext, 800, 0.7);

      const updatedSession: TutoringSession = {
        ...session,
        messages: [
          ...session.messages,
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: responseText, timestamp: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString()
      };

      return { response: responseText, session: updatedSession };
    } catch (error) {
      console.error('AI Tutoring error:', error);
      throw new Error('Failed to get tutoring assistance');
    }
  }

  // Automated Essay Grading
  public async gradeEssay(
    essay: string,
    rubric: {
      maxScore: number;
      criteria: {
        content: { weight: number; description: string };
        structure: { weight: number; description: string };
        grammar: { weight: number; description: string };
        style: { weight: number; description: string };
      };
    },
    assignmentContext?: { title: string; instructions: string }
  ): Promise<EssayGradingResult> {
    try {
      const prompt = `Grade this essay according to the rubric. Return ONLY valid JSON:

{
  "criteria": {
    "content": { "score": [0-${rubric.criteria.content.weight}], "feedback": "detailed feedback" },
    "structure": { "score": [0-${rubric.criteria.structure.weight}], "feedback": "detailed feedback" },
    "grammar": { "score": [0-${rubric.criteria.grammar.weight}], "feedback": "detailed feedback" },
    "style": { "score": [0-${rubric.criteria.style.weight}], "feedback": "detailed feedback" }
  },
  "overall": "Overall feedback paragraph",
  "suggestions": ["improvement suggestions"],
  "strengths": ["what student did well"],
  "improvements": ["areas to improve"]
}

Rubric:
- Content (${rubric.criteria.content.weight} pts): ${rubric.criteria.content.description}
- Structure (${rubric.criteria.structure.weight} pts): ${rubric.criteria.structure.description}
- Grammar (${rubric.criteria.grammar.weight} pts): ${rubric.criteria.grammar.description}
- Style (${rubric.criteria.style.weight} pts): ${rubric.criteria.style.description}

${assignmentContext ? `Assignment: ${assignmentContext.title} - ${assignmentContext.instructions}` : ''}

Essay: "${essay.substring(0, 3000)}"

Return ONLY JSON.`;

      const responseText = await callBedrock(prompt, 1200, 0.3);
      const gradingResult = parseJSON(responseText);

      const totalScore = (gradingResult.criteria?.content?.score || 0) +
        (gradingResult.criteria?.structure?.score || 0) +
        (gradingResult.criteria?.grammar?.score || 0) +
        (gradingResult.criteria?.style?.score || 0);
      const percentage = (totalScore / rubric.maxScore) * 100;

      return {
        score: totalScore,
        maxScore: rubric.maxScore,
        percentage: Math.round(percentage * 100) / 100,
        letterGrade: this.calculateLetterGrade(percentage),
        feedback: { overall: gradingResult.overall || '', criteria: gradingResult.criteria },
        suggestions: gradingResult.suggestions || [],
        strengths: gradingResult.strengths || [],
        improvements: gradingResult.improvements || []
      };
    } catch (error) {
      console.error('Essay grading error:', error);
      throw new Error('Failed to grade essay');
    }
  }

  // Plagiarism Detection
  public async detectPlagiarism(text: string): Promise<PlagiarismResult> {
    try {
      const prompt = `Analyze this text for potential plagiarism patterns. Look for overly formal language shifts, inconsistent writing style, or phrases that seem copied. Return ONLY valid JSON:

{
  "isPlagiarized": false,
  "similarityScore": 0,
  "sources": [],
  "originalText": "${text.substring(0, 500).replace(/"/g, '\\"')}",
  "flaggedText": []
}

Note: Without access to external databases, rate based on writing style consistency only. Be conservative - only flag if clearly suspicious.

Text: "${text.substring(0, 2000).replace(/"/g, '\\"')}"

Return ONLY JSON.`;

      const responseText = await callBedrock(prompt, 800, 0.1);
      return parseJSON(responseText);
    } catch (error) {
      console.error('Plagiarism detection error:', error);
      throw new Error('Failed to detect plagiarism');
    }
  }

  // AI Transcription (text summary since Nova can't process audio)
  public async transcribeVideo(audioUrl: string, language: string = 'en'): Promise<TranscriptionResult> {
    // Note: For actual audio transcription, use AWS Transcribe service
    // This is a placeholder that returns an indication to use AWS Transcribe
    throw new Error('Audio transcription requires AWS Transcribe. Configure separately.');
  }

  // Smart Recommendations
  public async getRecommendations(
    userId: string,
    type: 'content' | 'study_group' | 'assignment' | 'resource',
    context: {
      courseId?: string;
      assignmentId?: string;
      userProfile?: any;
      learningHistory?: any[];
    }
  ): Promise<RecommendationResult> {
    try {
      const prompt = `Generate personalized ${type} recommendations for a student. Return ONLY valid JSON:

{
  "type": "${type}",
  "items": [
    { "id": "rec_1", "title": "Title", "description": "Description", "relevanceScore": 85, "reason": "Why recommended" }
  ],
  "userId": "${userId}",
  "context": "Based on learning history"
}

Context: ${JSON.stringify(context).substring(0, 500)}
Generate 3-5 recommendations. Return ONLY JSON.`;

      const responseText = await callBedrock(prompt, 800, 0.7);
      return parseJSON(responseText);
    } catch (error) {
      console.error('Recommendation error:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  // Predictive Analytics
  public async predictStudentSuccess(
    studentData: {
      userId: string;
      courseId: string;
      assignmentHistory: any[];
      engagementMetrics: any;
      demographics?: any;
    }
  ): Promise<{
    successProbability: number;
    riskFactors: string[];
    recommendations: string[];
    predictedGrade: string;
  }> {
    try {
      const prompt = `Analyze student data and predict success. Return ONLY valid JSON:

{
  "successProbability": 75,
  "riskFactors": ["risk factors"],
  "recommendations": ["actionable recommendations"],
  "predictedGrade": "B"
}

Student data: ${JSON.stringify(studentData).substring(0, 1000)}

Consider: completion rates, grade trends, engagement, time management.
Return ONLY JSON.`;

      const responseText = await callBedrock(prompt, 600, 0.3);
      return parseJSON(responseText);
    } catch (error) {
      console.error('Predictive analytics error:', error);
      throw new Error('Failed to predict student success');
    }
  }

  private calculateLetterGrade(percentage: number): string {
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
}

export const aiService = AIService.getInstance();
