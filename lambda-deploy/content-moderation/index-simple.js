// Simplified Content Moderation Lambda Function
// This version works without external dependencies

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

    // Simplified content moderation logic
    const moderationResult = await moderateContent(content, type, context);

    // Log moderation result (simplified - in production you'd use DynamoDB)
    console.log('Moderation result:', {
      userId,
      contentId: context?.contentId || 'unknown',
      contentType: type,
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
 * Simplified content moderation logic
 */
async function moderateContent(content, type, context) {
  // Basic content analysis without external AI
  const inappropriateWords = [
    'hate', 'violence', 'harassment', 'inappropriate', 'spam', 'fake', 'misleading'
  ];
  
  const contentLower = content.toLowerCase();
  const foundWords = inappropriateWords.filter(word => contentLower.includes(word));
  
  const isAppropriate = foundWords.length === 0;
  const confidence = foundWords.length === 0 ? 0.9 : Math.max(0.1, 1 - (foundWords.length * 0.3));
  
  const categories = {
    violence: contentLower.includes('violence') ? 0.8 : 0.1,
    hate: contentLower.includes('hate') ? 0.8 : 0.1,
    harassment: contentLower.includes('harassment') ? 0.8 : 0.1,
    sexual: contentLower.includes('sexual') ? 0.8 : 0.1,
    selfHarm: contentLower.includes('self-harm') ? 0.8 : 0.1,
    spam: contentLower.includes('spam') ? 0.8 : 0.1,
    misinformation: contentLower.includes('fake') || contentLower.includes('misleading') ? 0.8 : 0.1
  };
  
  const flags = foundWords.map(word => `Contains potentially inappropriate word: ${word}`);
  const suggestions = foundWords.length > 0 ? [
    'Please review your content for appropriateness',
    'Consider using more professional language',
    'Ensure content is suitable for educational environment'
  ] : [];
  
  const reasoning = foundWords.length === 0 
    ? 'Content appears appropriate for educational use'
    : `Content flagged for: ${foundWords.join(', ')}`;

  if (type === 'video') {
    return {
      isAppropriate,
      confidence,
      categories,
      flags,
      suggestions,
      reasoning,
      videoAnalysis: {
        hasAudio: true,
        audioTranscription: null,
        visualContent: ['educational content'],
        duration: context?.duration || 0
      }
    };
  } else {
    return {
      isAppropriate,
      confidence,
      categories,
      flags,
      suggestions,
      reasoning,
      textAnalysis: {
        wordCount: content.split(' ').length,
        language: 'en',
        sentiment: analyzeSentiment(content),
        topics: extractTopics(content)
      }
    };
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
