import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      reviewerId,
      score,
      maxScore,
      feedback,
      responseType = 'text',
      videoResponse = null
    } = body;

    if (!submissionId || !reviewerId || score === undefined || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, reviewerId, score, feedback' },
        { status: 400 }
      );
    }

    // Validate score
    if (score < 0 || score > maxScore) {
      return NextResponse.json(
        { error: 'Score must be between 0 and maxScore' },
        { status: 400 }
      );
    }

    // Get reviewer information
    let reviewerName = 'Unknown Reviewer';
    try {
      const reviewerResult = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId: reviewerId }
      }));
      if (reviewerResult.Item) {
        reviewerName = `${reviewerResult.Item.firstName || ''} ${reviewerResult.Item.lastName || ''}`.trim() || 'Unknown Reviewer';
      }
    } catch (error) {
      console.warn('Could not fetch reviewer information:', error);
    }

    // Check if reviewer has already submitted a review for this submission
    try {
      const existingReviewResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'submissionId = :submissionId AND reviewerId = :reviewerId',
        ExpressionAttributeValues: {
          ':submissionId': submissionId,
          ':reviewerId': reviewerId
        }
      }));

      if (existingReviewResult.Items && existingReviewResult.Items.length > 0) {
        return NextResponse.json(
          { error: 'You have already submitted a review for this submission' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.warn('Could not check for existing review:', error);
    }

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const review = {
      reviewId,
      submissionId,
      reviewerId,
      reviewerName,
      score: Number(score),
      maxScore: Number(maxScore),
      feedback: feedback.trim(),
      responseType,
      videoResponse,
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    // Save the peer review
    await docClient.send(new PutCommand({
      TableName: PEER_RESPONSES_TABLE,
      Item: review
    }));

    // Update the submission with the new peer review
    try {
      const submissionResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId }
      }));

      if (submissionResult.Item) {
        const currentPeerReviews = submissionResult.Item.peerReviews || [];
        const updatedPeerReviews = [
          ...currentPeerReviews,
          {
            reviewId,
            reviewerId,
            reviewerName,
            score: Number(score),
            maxScore: Number(maxScore),
            feedback: feedback.trim(),
            submittedAt: now
          }
        ];

        await docClient.send(new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: {
            ...submissionResult.Item,
            peerReviews: updatedPeerReviews,
            updatedAt: now
          }
        }));
      }
    } catch (error) {
      console.warn('Could not update submission with peer review:', error);
      // Don't fail the review submission if this update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Peer review submitted successfully',
      review: {
        reviewId,
        submissionId,
        reviewerId,
        reviewerName,
        score: Number(score),
        maxScore: Number(maxScore),
        feedback: feedback.trim(),
        submittedAt: now
      }
    });

  } catch (error) {
    console.error('Error submitting peer review:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to submit peer review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const reviewerId = searchParams.get('reviewerId');
    
    if (!submissionId && !reviewerId) {
      return NextResponse.json(
        { error: 'Either submissionId or reviewerId is required' },
        { status: 400 }
      );
    }

    let reviews = [];
    
    try {
      const reviewsResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: submissionId 
          ? 'submissionId = :submissionId'
          : 'reviewerId = :reviewerId',
        ExpressionAttributeValues: submissionId
          ? { ':submissionId': submissionId }
          : { ':reviewerId': reviewerId }
      }));
      
      reviews = reviewsResult.Items || [];
      
      // Sort by submittedAt in descending order (most recent first)
      reviews.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          success: true,
          reviews: [],
          count: 0
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      reviews,
      count: reviews.length
    });

  } catch (error) {
    console.error('Error fetching peer reviews:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch peer reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
