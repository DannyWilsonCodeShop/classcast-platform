const AWS = require('aws-sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Simple content moderation keywords (in production, use AWS Comprehend or similar)
const MODERATION_KEYWORDS = [
  'spam', 'inappropriate', 'offensive', 'harassment', 'bullying'
];

exports.handler = async (event) => {
  console.log('Comment moderation event:', JSON.stringify(event, null, 2));

  try {
    const { commentId, content, videoId } = event;

    if (!commentId || !content) {
      throw new Error('Missing required fields: commentId, content');
    }

    // Basic content moderation
    const moderationResult = await moderateContent(content);
    
    // Update comment with moderation status
    const updateCommand = new UpdateCommand({
      TableName: process.env.COMMENTS_TABLE_NAME,
      Key: { videoId, commentId },
      UpdateExpression: 'SET moderationStatus = :status, moderatedAt = :moderatedAt, moderationFlags = :flags',
      ExpressionAttributeValues: {
        ':status': moderationResult.approved ? 'approved' : 'flagged',
        ':moderatedAt': new Date().toISOString(),
        ':flags': moderationResult.flags
      }
    });

    await docClient.send(updateCommand);

    // If comment is flagged, trigger additional review
    if (!moderationResult.approved) {
      await triggerManualReview(commentId, videoId, content, moderationResult.flags);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        commentId,
        approved: moderationResult.approved,
        flags: moderationResult.flags
      })
    };

  } catch (error) {
    console.error('Error moderating comment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Comment moderation failed' })
    };
  }
};

async function moderateContent(content) {
  const flags = [];
  let approved = true;

  // Check for inappropriate keywords
  const lowerContent = content.toLowerCase();
  for (const keyword of MODERATION_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      flags.push(`inappropriate_keyword:${keyword}`);
      approved = false;
    }
  }

  // Check for excessive caps (potential spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 10) {
    flags.push('excessive_caps');
    approved = false;
  }

  // Check for excessive repetition
  const words = content.split(/\s+/);
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const maxRepetition = Math.max(...Object.values(wordCounts));
  if (maxRepetition > 3 && words.length > 5) {
    flags.push('excessive_repetition');
    approved = false;
  }

  // Check for minimum content quality
  if (content.trim().length < 3) {
    flags.push('too_short');
    approved = false;
  }

  return {
    approved,
    flags
  };
}

async function triggerManualReview(commentId, videoId, content, flags) {
  // In a real app, this would send to a moderation queue or notify moderators
  console.log(`Comment ${commentId} flagged for manual review:`, {
    videoId,
    content: content.substring(0, 100) + '...',
    flags
  });

  // You could integrate with:
  // - SNS to notify moderators
  // - SQS for a moderation queue
  // - A moderation dashboard
  // - AWS Comprehend for more sophisticated analysis
}
