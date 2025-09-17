const AWS = require('aws-sdk');
const OpenAI = require('openai');

// Initialize services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const MODERATION_TABLE = process.env.MODERATION_TABLE || 'classcast-content-moderation';

/**
 * Main Lambda handler for content moderation
 */
exports.handler = async (event) => {
  console.log('Content moderation event:', JSON.stringify(event, null, 2));

  try {
    const { content, type, context, userId } = JSON.parse(event.body || '{}');

    if (!content || !type || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required parameters: content, type, userId'
        })
      };
    }

    let moderationResult;

    if (type === 'text') {
      moderationResult = await moderateTextContent(content, context);
    } else if (type === 'video') {
      moderationResult = await moderateVideoContent(content, context);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid content type. Must be "text" or "video"'
        })
      };
    }

    // Log moderation result to DynamoDB
    await logModerationResult({
      userId,
      contentId: context?.contentId || 'unknown',
      contentType: type,
      context: JSON.stringify(context),
      result: moderationResult,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        result: moderationResult,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Content moderation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error during content moderation'
      })
    };
  }
};

/**
 * Moderate text content using OpenAI
 */
async function moderateTextContent(text, context) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

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

  try {
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
        language: 'en',
        sentiment: analyzeSentiment(text),
        topics: extractTopics(text)
      }
    };
  } catch (error) {
    console.error('OpenAI text moderation error:', error);
    throw new Error('Failed to moderate text content');
  }
}

/**
 * Moderate video content (placeholder implementation)
 */
async function moderateVideoContent(videoUrl, context) {
  // For now, we'll analyze video metadata and any provided description
  // In a full implementation, you'd use video analysis APIs
  const analysisText = `
    Video URL: ${videoUrl}
    Context: ${JSON.stringify(context || {})}
    Description: ${context?.description || 'No description provided'}
  `;

  const textResult = await moderateTextContent(analysisText, 'video content');
  
  return {
    ...textResult,
    videoAnalysis: {
      hasAudio: true,
      audioTranscription: null,
      visualContent: ['educational content'],
      duration: context?.duration || 0
    }
  };
}

/**
 * Log moderation result to DynamoDB
 */
async function logModerationResult(data) {
  const params = {
    TableName: MODERATION_TABLE,
    Item: {
      moderationId: AWS.util.uuid.v4(),
      userId: data.userId,
      contentId: data.contentId,
      contentType: data.contentType,
      context: data.context,
      result: data.result,
      timestamp: data.timestamp,
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    }
  };

  try {
    await dynamodb.put(params).promise();
    console.log('Moderation result logged to DynamoDB');
  } catch (error) {
    console.error('Failed to log moderation result:', error);
    // Don't throw error - logging failure shouldn't break the main flow
  }
}

/**
 * Analyze sentiment of text content
 */
function analyzeSentiment(text) {
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
function extractTopics(text) {
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
