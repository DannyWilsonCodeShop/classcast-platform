import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const body = await request.json();
    const { videoId } = await params;
    
    console.log('📍 Like API called - videoId:', videoId, 'body:', body);

    // Support both old format (userId/isLiked) and new format (just toggle)
    const userId = body.userId || 'anonymous';
    
    // Get current submission data - videoId is actually submissionId
    const submissionId = videoId;
    const getCommand = new GetCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId }
    });

    console.log('🔍 Looking for submission:', submissionId);
    const submissionData = await docClient.send(getCommand);
    
    if (!submissionData.Item) {
      console.error('❌ Submission not found:', submissionId);
      return NextResponse.json(
        { error: 'Video submission not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found submission:', submissionData.Item);

    const currentLikes = submissionData.Item.likes || 0;
    const likedBy = submissionData.Item.likedBy || [];
    
    // Determine if this is a like or unlike
    const isCurrentlyLiked = likedBy.includes(userId);
    const isLiked = body.isLiked !== undefined ? body.isLiked : !isCurrentlyLiked;
    
    let newLikes = currentLikes;
    let newLikedBy = [...likedBy];

    if (isLiked && !isCurrentlyLiked) {
      // Add like
      newLikes = currentLikes + 1;
      newLikedBy.push(userId);
      console.log('➕ Adding like - new count:', newLikes);
    } else if (!isLiked && isCurrentlyLiked) {
      // Remove like
      newLikes = Math.max(0, currentLikes - 1);
      newLikedBy = likedBy.filter(id => id !== userId);
      console.log('➖ Removing like - new count:', newLikes);
    } else {
      console.log('⏸️ No change needed - already in desired state');
    }

    // Update submission with new like data
    const updateCommand = new UpdateCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET likes = :likes, likedBy = :likedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':likes': newLikes,
        ':likedBy': newLikedBy,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    console.log('✅ Like updated successfully:', result.Attributes);

    // Create notification for the video owner when someone likes their video
    if (isLiked && !isCurrentlyLiked && userId !== submissionData.Item.studentId) {
      try {
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: submissionData.Item.studentId,
            senderId: userId,
            senderName: body.userName || 'A classmate',
            type: 'video_liked',
            title: '👍 Your video was liked!',
            message: `${body.userName || 'A classmate'} liked your video "${submissionData.Item.videoTitle || 'Video Submission'}"`,
            relatedId: submissionId,
            relatedType: 'video',
            priority: 'low',
            actionUrl: `/student/peer-reviews?videoId=${submissionId}`
          })
        });

        if (notificationResponse.ok) {
          console.log('✅ Like notification created');
        } else {
          console.error('❌ Failed to create like notification');
        }
      } catch (notifError) {
        console.error('❌ Error creating like notification:', notifError);
      }
    }

    // Return in format that matches VideoReel interface
    const updatedSubmission = result.Attributes;
    return NextResponse.json({
      success: true,
      likes: newLikes,
      isLiked: isLiked,
      id: submissionId,
      title: updatedSubmission.videoTitle || 'Video Submission',
      description: updatedSubmission.videoDescription || '',
      thumbnail: updatedSubmission.thumbnailUrl || '/api/placeholder/300/200',
      videoUrl: updatedSubmission.videoUrl,
      duration: updatedSubmission.duration || 0,
      author: {
        id: updatedSubmission.studentId,
        name: updatedSubmission.studentName || 'Unknown Student',
        avatar: updatedSubmission.studentAvatar || '/api/placeholder/40/40',
        course: updatedSubmission.courseName || 'Unknown Course'
      },
      likes: newLikes,
      comments: updatedSubmission.comments?.length || 0,
      isLiked: isLiked,
      createdAt: updatedSubmission.submittedAt || updatedSubmission.createdAt,
      courseId: updatedSubmission.courseId,
      assignmentId: updatedSubmission.assignmentId
    });

  } catch (error) {
    console.error('❌ Error updating video like:', error);
    return NextResponse.json(
      { error: 'Failed to update video like', details: error.message },
      { status: 500 }
    );
  }
}
