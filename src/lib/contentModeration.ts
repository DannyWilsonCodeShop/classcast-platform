import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ContentModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: {
    violence: number;
    hate: number;
    harassment: number;
    sexual: number;
    selfHarm: number;
    spam: number;
    misinformation: number;
  };
  flags: string[];
  suggestions: string[];
  reasoning: string;
}

export interface VideoModerationResult extends ContentModerationResult {
  videoAnalysis: {
    hasAudio: boolean;
    audioTranscription?: string;
    visualContent: string[];
    duration: number;
  };
}

export interface TextModerationResult extends ContentModerationResult {
  textAnalysis: {
    wordCount: number;
    language: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
  };
}

export class ContentModerationService {
  private static instance: ContentModerationService;
  
  public static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService();
    }
    return ContentModerationService.instance;
  }

  /**
   * Moderate text content for appropriateness
   */
  async moderateText(text: string, context?: string): Promise<TextModerationResult> {
    if (!openai) {
      // Return a safe default when OpenAI is not configured
      console.warn('OpenAI API key not configured, using basic content moderation');
      return this.basicTextModeration(text);
    }

    try {
      const prompt = `Analyze the following text content for appropriateness in an educational setting. Consider context: ${context || 'general educational content'}

Text to analyze: "${text}"

Please provide a detailed analysis including:
1. Overall appropriateness (true/false)
2. Confidence score (0-1)
3. Risk categories with scores (0-1):
   - violence: potential for violent content
   - hate: hate speech or discriminatory language
   - harassment: bullying or harassment
   - sexual: inappropriate sexual content
   - selfHarm: content promoting self-harm
   - spam: spam or irrelevant content
   - misinformation: false or misleading information
4. Specific flags (array of concerning elements)
5. Suggestions for improvement
6. Reasoning for the decision

Respond in JSON format only.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI content moderator for an educational platform. Analyze content for appropriateness, safety, and educational value. Be thorough but fair in your assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        isAppropriate: analysis.isAppropriate || false,
        confidence: analysis.confidence || 0,
        categories: analysis.categories || {
          violence: 0,
          hate: 0,
          harassment: 0,
          sexual: 0,
          selfHarm: 0,
          spam: 0,
          misinformation: 0
        },
        flags: analysis.flags || [],
        suggestions: analysis.suggestions || [],
        reasoning: analysis.reasoning || 'No analysis available',
        textAnalysis: {
          wordCount: text.split(' ').length,
          language: 'en', // Could be enhanced with language detection
          sentiment: this.analyzeSentiment(text),
          topics: this.extractTopics(text)
        }
      };
    } catch (error) {
      console.error('Error moderating text content:', error);
      throw new Error('Failed to moderate text content');
    }
  }

  /**
   * Moderate video content for appropriateness
   */
  async moderateVideo(videoUrl: string, metadata?: {
    title?: string;
    description?: string;
    duration?: number;
  }): Promise<VideoModerationResult> {
    if (!openai) {
      // Return a safe default when OpenAI is not configured
      console.warn('OpenAI API key not configured, using basic video moderation');
      return this.basicVideoModeration(metadata);
    }

    try {
      // For now, we'll analyze video metadata and any provided description
      // In a full implementation, you'd use video analysis APIs
      const analysisText = `
        Video Title: ${metadata?.title || 'Untitled'}
        Description: ${metadata?.description || 'No description provided'}
        Duration: ${metadata?.duration || 0} seconds
        URL: ${videoUrl}
      `;

      const textResult = await this.moderateText(analysisText, 'video content');
      
      return {
        ...textResult,
        videoAnalysis: {
          hasAudio: true, // Would be determined by actual video analysis
          audioTranscription: undefined, // Would be generated from video audio
          visualContent: ['educational content'], // Would be analyzed from video frames
          duration: metadata?.duration || 0
        }
      };
    } catch (error) {
      console.error('Error moderating video content:', error);
      throw new Error('Failed to moderate video content');
    }
  }

  /**
   * Moderate assignment submissions
   */
  async moderateSubmission(content: string, type: 'text' | 'video', context?: {
    assignmentId: string;
    studentId: string;
    courseId: string;
  }): Promise<ContentModerationResult> {
    const moderationContext = `Assignment submission for ${context?.courseId || 'course'} by student ${context?.studentId || 'unknown'}`;
    
    if (type === 'video') {
      return this.moderateVideo(content, { description: moderationContext });
    } else {
      return this.moderateText(content, moderationContext);
    }
  }

  /**
   * Moderate forum posts and comments
   */
  async moderateForumPost(content: string, context?: {
    forumId: string;
    threadId?: string;
    userId: string;
  }): Promise<ContentModerationResult> {
    const moderationContext = `Forum post in ${context?.forumId || 'forum'} by user ${context?.userId || 'unknown'}`;
    return this.moderateText(content, moderationContext);
  }

  /**
   * Moderate user profiles and bios
   */
  async moderateProfile(content: string, context?: {
    userId: string;
    profileType: 'bio' | 'status' | 'about';
  }): Promise<ContentModerationResult> {
    const moderationContext = `User profile ${context?.profileType || 'content'} for user ${context?.userId || 'unknown'}`;
    return this.moderateText(content, moderationContext);
  }

  /**
   * Get moderation guidelines
   */
  getModerationGuidelines(): string[] {
    return [
      'Content should be appropriate for educational environments',
      'No hate speech, harassment, or discriminatory language',
      'No violent, graphic, or disturbing content',
      'No inappropriate sexual content',
      'No content promoting self-harm or dangerous activities',
      'No spam, irrelevant, or off-topic content',
      'No false or misleading information',
      'Respectful communication and constructive feedback',
      'Content should add value to the learning community',
      'Follow platform terms of service and community guidelines'
    ];
  }

  /**
   * Analyze sentiment of text content
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'thanks', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'annoying'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract topics from text content
   */
  private extractTopics(text: string): string[] {
    // Simple topic extraction - could be enhanced with NLP libraries
    const commonTopics = [
      'education', 'learning', 'study', 'homework', 'assignment',
      'course', 'class', 'teacher', 'student', 'school',
      'technology', 'programming', 'science', 'math', 'history',
      'literature', 'art', 'music', 'sports', 'health'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return commonTopics.filter(topic => 
      words.some(word => word.includes(topic))
    );
  }

  /**
   * Basic text moderation when OpenAI is not available
   */
  private basicTextModeration(text: string): TextModerationResult {
    const lowerText = text.toLowerCase();
    const inappropriateWords = ['spam', 'inappropriate', 'offensive']; // Basic word list
    
    const hasInappropriateContent = inappropriateWords.some(word => 
      lowerText.includes(word)
    );
    
    return {
      isAppropriate: !hasInappropriateContent,
      confidence: hasInappropriateContent ? 0.8 : 0.6,
      categories: {
        violence: 0,
        hate: 0,
        harassment: 0,
        sexual: 0,
        selfHarm: 0,
        spam: hasInappropriateContent ? 0.8 : 0,
        misinformation: 0
      },
      flags: hasInappropriateContent ? ['basic-filter'] : [],
      suggestions: hasInappropriateContent ? ['Please review your content for appropriateness'] : [],
      reasoning: hasInappropriateContent ? 'Content flagged by basic word filter' : 'Content appears appropriate',
      textAnalysis: {
        wordCount: text.split(' ').length,
        language: 'en',
        sentiment: 'neutral',
        topics: []
      }
    };
  }

  /**
   * Basic video moderation when OpenAI is not available
   */
  private basicVideoModeration(metadata?: {
    title?: string;
    description?: string;
    duration?: number;
  }): VideoModerationResult {
    const textResult = this.basicTextModeration(
      `${metadata?.title || ''} ${metadata?.description || ''}`
    );
    
    return {
      ...textResult,
      videoAnalysis: {
        hasAudio: true,
        visualContent: [],
        duration: metadata?.duration || 0
      }
    };
  }
}

export const contentModerationService = ContentModerationService.getInstance();
