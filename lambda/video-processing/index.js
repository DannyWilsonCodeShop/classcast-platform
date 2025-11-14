const AWS = require('aws-sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  console.log('Video processing event:', JSON.stringify(event, null, 2));

  try {
    // Process S3 video upload events
    for (const record of event.Records) {
      if (record.eventSource === 'aws:s3') {
        await processVideoUpload(record);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Video processing completed' })
    };
  } catch (error) {
    console.error('Error processing video:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Video processing failed' })
    };
  }
};

async function processVideoUpload(record) {
  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;
  
  console.log(`Processing video: ${bucket}/${key}`);

  try {
    // Extract video metadata
    const videoId = extractVideoIdFromKey(key);
    
    if (!videoId) {
      console.log('Could not extract video ID from key:', key);
      return;
    }

    // Get video metadata from S3
    const headCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const headResponse = await s3Client.send(headCommand);
    const contentLength = headResponse.ContentLength;
    const contentType = headResponse.ContentType;
    const lastModified = headResponse.LastModified;

    // Generate thumbnail (placeholder - in real app, use FFmpeg)
    const thumbnailKey = key.replace(/\.(mp4|mov|avi)$/, '_thumb.jpg');
    
    // Update video record in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: process.env.VIDEOS_TABLE_NAME,
      Key: { videoId },
      UpdateExpression: 'SET #status = :status, fileSize = :fileSize, contentType = :contentType, thumbnailKey = :thumbnailKey, processedAt = :processedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'processed',
        ':fileSize': contentLength,
        ':contentType': contentType,
        ':thumbnailKey': thumbnailKey,
        ':processedAt': new Date().toISOString()
      }
    });

    await docClient.send(updateCommand);

    console.log(`Video ${videoId} processed successfully`);

  } catch (error) {
    console.error(`Error processing video ${key}:`, error);
    
    // Update video status to failed
    try {
      const videoId = extractVideoIdFromKey(key);
      if (videoId) {
        const updateCommand = new UpdateCommand({
          TableName: process.env.VIDEOS_TABLE_NAME,
          Key: { videoId },
          UpdateExpression: 'SET #status = :status, errorMessage = :errorMessage, processedAt = :processedAt',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': 'failed',
            ':errorMessage': error.message,
            ':processedAt': new Date().toISOString()
          }
        });

        await docClient.send(updateCommand);
      }
    } catch (updateError) {
      console.error('Error updating video status to failed:', updateError);
    }
  }
}

function extractVideoIdFromKey(key) {
  // Extract video ID from S3 key pattern: videos/{videoId}/video.{ext}
  const match = key.match(/^videos\/([^\/]+)\/video\./);
  return match ? match[1] : null;
}
