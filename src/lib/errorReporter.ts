import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const sns = new SNSClient({
  region: process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1',
  ...((() => {
    const ak = process.env.AWS_ACCESS_KEY_ID || process.env.CLASSCAST_ACCESS_KEY_ID;
    const sk = process.env.AWS_SECRET_ACCESS_KEY || process.env.CLASSCAST_SECRET_ACCESS_KEY;
    return ak && sk ? { credentials: { accessKeyId: ak, secretAccessKey: sk } } : {};
  })()),
});

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1',
  ...((() => {
    const ak = process.env.AWS_ACCESS_KEY_ID || process.env.CLASSCAST_ACCESS_KEY_ID;
    const sk = process.env.AWS_SECRET_ACCESS_KEY || process.env.CLASSCAST_SECRET_ACCESS_KEY;
    return ak && sk ? { credentials: { accessKeyId: ak, secretAccessKey: sk } } : {};
  })()),
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TOPIC_ARN = process.env.SNS_ERROR_TOPIC_ARN || '';
const ERROR_LOGS_TABLE = 'classcast-error-logs';

export interface ErrorReport {
  errorId?: string;
  message: string;
  stack?: string;
  url?: string;
  userId?: string;
  userAgent?: string;
  timestamp?: string;
  severity: 'critical' | 'error' | 'warning';
  context?: Record<string, any>;
}

/**
 * Reports an error to SNS (SMS notification) and logs to DynamoDB.
 */
export async function reportError(error: ErrorReport): Promise<void> {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = error.timestamp || new Date().toISOString();

  // Log to DynamoDB
  try {
    await docClient.send(new PutCommand({
      TableName: ERROR_LOGS_TABLE,
      Item: {
        errorId,
        message: error.message,
        stack: error.stack || '',
        url: error.url || '',
        userId: error.userId || 'unknown',
        userAgent: error.userAgent || '',
        severity: error.severity,
        context: error.context || {},
        timestamp,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 day TTL
      },
    }));
  } catch (dbErr) {
    console.error('Failed to log error to DynamoDB:', dbErr);
  }

  // Send SMS notification for critical/error severity
  if (TOPIC_ARN && (error.severity === 'critical' || error.severity === 'error')) {
    try {
      const shortMessage = `🚨 ClassCast ${error.severity.toUpperCase()}\n${error.message.substring(0, 100)}\n${error.url || ''}\nUser: ${error.userId || 'unknown'}\n${timestamp}`;
      
      await sns.send(new PublishCommand({
        TopicArn: TOPIC_ARN,
        Message: shortMessage,
        Subject: `ClassCast ${error.severity}: ${error.message.substring(0, 50)}`,
      }));
    } catch (snsErr) {
      console.error('Failed to send SNS notification:', snsErr);
    }
  }
}
