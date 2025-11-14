import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { logger, metrics } from '@/lib/monitoring';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

// POST /api/user/onboarding-complete - Mark onboarding as complete
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { completed, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user's onboarding status
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET onboardingCompleted = :completed, onboardingCompletedAt = :timestamp, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':completed': completed || true,
        ':timestamp': new Date().toISOString(),
        ':updatedAt': new Date().toISOString()
      }
    }));

    const duration = Date.now() - startTime;
    
    // Log the event
    logger.logAuthenticationEvent('onboarding_completed', userId, true, {
      completed,
      duration
    });

    // Record metrics
    metrics.recordAuthenticationEvent('onboarding_completed', true);
    metrics.recordAPICall('POST', '/api/user/onboarding-complete', 200, duration);

    return NextResponse.json({
      success: true,
      message: 'Onboarding status updated successfully',
      onboardingCompleted: completed || true,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error updating onboarding status', error as Error);
    metrics.recordAPICall('POST', '/api/user/onboarding-complete', 500, duration);
    metrics.recordError('onboarding_update_failed', 'api');

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update onboarding status' 
      },
      { status: 500 }
    );
  }
}

// GET /api/user/onboarding-complete - Check onboarding status
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's onboarding status
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    }));

    if (!result.Item) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    
    // Log the event
    logger.info('Onboarding status checked', {
      userId,
      onboardingCompleted: result.Item.onboardingCompleted || false,
      duration
    });

    // Record metrics
    metrics.recordAPICall('GET', '/api/user/onboarding-complete', 200, duration);

    return NextResponse.json({
      success: true,
      onboardingCompleted: result.Item.onboardingCompleted || false,
      onboardingCompletedAt: result.Item.onboardingCompletedAt || null,
      userCreatedAt: result.Item.createdAt
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error checking onboarding status', error as Error);
    metrics.recordAPICall('GET', '/api/user/onboarding-complete', 500, duration);
    metrics.recordError('onboarding_check_failed', 'api');

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check onboarding status' 
      },
      { status: 500 }
    );
  }
}
