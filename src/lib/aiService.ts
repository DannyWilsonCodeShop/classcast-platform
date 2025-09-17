import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

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
      const systemPrompt = this.buildTutoringSystemPrompt(session, context);
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...session.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content: message }
      ];

      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Update session
      const updatedSession: TutoringSession = {
        ...session,
        messages: [
          ...session.messages,
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: response, timestamp: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString()
      };

      return { response, session: updatedSession };
    } catch (error) {
      console.error('AI Tutoring error:', error);
      throw new Error('Failed to get tutoring assistance');
    }
  }

  private buildTutoringSystemPrompt(session: TutoringSession, context?: any): string {
    let prompt = `You are an AI tutoring assistant for ClassCast, an educational platform. You help students learn and understand concepts.

Your role:
- Provide clear, educational explanations
- Ask guiding questions to help students think through problems
- Offer examples and analogies when helpful
- Encourage learning and build confidence
- Stay focused on educational content

Student context:
- Subject: ${session.context.subject || 'General'}
- Difficulty level: ${session.context.difficulty || 'intermediate'}
- Learning goals: ${session.context.learningGoals?.join(', ') || 'General learning'}`;

    if (context?.assignmentId) {
      prompt += `\n- Current assignment: ${context.assignmentId}`;
    }
    if (context?.courseId) {
      prompt += `\n- Current course: ${context.courseId}`;
    }

    prompt += `\n\nAlways be encouraging, patient, and educational. If you don't know something, say so and suggest how the student might find the answer.`;

    return prompt;
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
      const prompt = this.buildEssayGradingPrompt(essay, rubric, assignmentContext);
      
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
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
        (sum: number, criterion: any) => sum + criterion.score, 0
      );
      const percentage = (totalScore / rubric.maxScore) * 100;
      const letterGrade = this.calculateLetterGrade(percentage);

      return {
        score: totalScore,
        maxScore: rubric.maxScore,
        percentage: Math.round(percentage * 100) / 100,
        letterGrade,
        feedback: gradingResult,
        suggestions: gradingResult.suggestions || [],
        strengths: gradingResult.strengths || [],
        improvements: gradingResult.improvements || []
      };
    } catch (error) {
      console.error('Essay grading error:', error);
      throw new Error('Failed to grade essay');
    }
  }

  private buildEssayGradingPrompt(essay: string, rubric: any, context?: any): string {
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

  // Plagiarism Detection
  public async detectPlagiarism(text: string): Promise<PlagiarismResult> {
    try {
      // For now, we'll use a simple similarity check
      // In production, you'd integrate with services like Turnitin, Copyscape, or build your own
      const prompt = `Analyze this text for potential plagiarism. Look for:
1. Exact matches or very similar phrases
2. Paraphrased content that might be copied
3. Suspicious patterns

Text to analyze: "${text}"

Return a JSON response with:
{
  "isPlagiarized": boolean,
  "similarityScore": number (0-100),
  "sources": [
    {
      "text": "suspicious text snippet",
      "similarity": number,
      "source": "potential source",
      "url": "if available"
    }
  ],
  "originalText": "original text",
  "flaggedText": ["flagged phrases"]
}`;

      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.error('Plagiarism detection error:', error);
      throw new Error('Failed to detect plagiarism');
    }
  }

  // AI Transcription
  public async transcribeVideo(audioUrl: string, language: string = 'en'): Promise<TranscriptionResult> {
    try {
      // In production, you'd use AWS Transcribe or similar service
      // For now, we'll simulate with OpenAI's Whisper API
      const response = await fetch(audioUrl);
      const audioBuffer = await response.arrayBuffer();
      
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.mp3'),
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json',
      });

      return {
        text: transcription.text,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        segments: (transcription.segments || []).map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          confidence: 0.95, // Default confidence since Whisper doesn't provide it
        })),
        language: transcription.language || language,
        duration: transcription.duration || 0
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
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
      const prompt = this.buildRecommendationPrompt(userId, type, context);
      
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
    } catch (error) {
      console.error('Recommendation error:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  private buildRecommendationPrompt(userId: string, type: string, context: any): string {
    return `Generate personalized recommendations for a student. Return as JSON:

{
  "type": "${type}",
  "items": [
    {
      "id": "unique_id",
      "title": "Item title",
      "description": "Item description",
      "relevanceScore": number (0-100),
      "reason": "Why this is recommended"
    }
  ],
  "userId": "${userId}",
  "context": "Recommendation context"
}

User context: ${JSON.stringify(context)}
Recommendation type: ${type}

Generate 3-5 relevant recommendations that would help this student learn and succeed.`;
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
      const prompt = `Analyze this student's data and predict their success. Return JSON:

{
  "successProbability": number (0-100),
  "riskFactors": ["list of risk factors"],
  "recommendations": ["actionable recommendations"],
  "predictedGrade": "A/B/C/D/F"
}

Student data: ${JSON.stringify(studentData)}

Consider factors like:
- Assignment completion rates
- Grade trends
- Engagement levels
- Time management
- Learning patterns`;

      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(response);
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
