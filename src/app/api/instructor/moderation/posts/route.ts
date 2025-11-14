import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMMUNITY_POSTS_TABLE = 'classcast-community-posts';
const COMMUNITY_COMMENTS_TABLE = 'classcast-community-comments';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function DELETE(request: NextRequest) {
  try {
    const { postId, postType, reason } = await request.json();

    if (!postId || !postType) {
      return NextResponse.json(
        { success: false, error: 'Post ID and type are required' },
        { status: 400 }
      );
    }

    console.log('🚫 Moderating post:', { postId, postType, reason });

    let deleted = false;
    let error = null;

    try {
      switch (postType) {
        case 'community_post':
          // Delete community post
          await docClient.send(new DeleteCommand({
            TableName: COMMUNITY_POSTS_TABLE,
            Key: { postId: postId }
          }));
          deleted = true;
          console.log('✅ Community post deleted:', postId);
          break;

        case 'community_comment':
          // Delete community comment
          await docClient.send(new DeleteCommand({
            TableName: COMMUNITY_COMMENTS_TABLE,
            Key: { commentId: postId }
          }));
          deleted = true;
          console.log('✅ Community comment deleted:', postId);
          break;

        case 'peer_response':
          // Delete peer response
          await docClient.send(new DeleteCommand({
            TableName: PEER_RESPONSES_TABLE,
            Key: { id: postId }
          }));
          deleted = true;
          console.log('✅ Peer response deleted:', postId);
          break;

        case 'video_submission':
          // Delete video submission (this is more serious)
          await docClient.send(new DeleteCommand({
            TableName: SUBMISSIONS_TABLE,
            Key: { submissionId: postId }
          }));
          deleted = true;
          console.log('✅ Video submission deleted:', postId);
          break;

        default:
          error = 'Invalid post type';
          break;
      }
    } catch (deleteError) {
      console.error('Error deleting post:', deleteError);
      error = 'Failed to delete post';
    }

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: `${postType.replace('_', ' ')} has been removed`,
        postId: postId,
        reason: reason || 'Inappropriate content'
      });
    } else {
      return NextResponse.json(
        { success: false, error: error || 'Failed to delete post' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in post moderation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to moderate post' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const type = searchParams.get('type'); // 'all', 'posts', 'comments', 'responses', 'submissions'

    console.log('📋 Fetching posts for moderation:', { courseId, type });

    const posts = [];

    // Get community posts
    if (!type || type === 'all' || type === 'posts') {
      try {
        const postsResult = await docClient.send(new ScanCommand({
          TableName: COMMUNITY_POSTS_TABLE,
          Limit: 100
        }));

        if (postsResult.Items) {
          postsResult.Items.forEach(post => {
            posts.push({
              id: post.postId || post.id,
              type: 'community_post',
              title: post.title,
              content: post.content,
              authorId: post.userId,
              authorName: post.authorName || 'Unknown',
              createdAt: post.createdAt || post.timestamp,
              courseId: post.courseId
            });
          });
        }
      } catch (error) {
        console.error('Error fetching community posts:', error);
      }
    }

    // Get community comments
    if (!type || type === 'all' || type === 'comments') {
      try {
        const commentsResult = await docClient.send(new ScanCommand({
          TableName: COMMUNITY_COMMENTS_TABLE,
          Limit: 100
        }));

        if (commentsResult.Items) {
          commentsResult.Items.forEach(comment => {
            posts.push({
              id: comment.commentId || comment.id,
              type: 'community_comment',
              title: 'Comment',
              content: comment.content,
              authorId: comment.userId,
              authorName: comment.authorName || 'Unknown',
              createdAt: comment.createdAt,
              postId: comment.postId
            });
          });
        }
      } catch (error) {
        console.error('Error fetching community comments:', error);
      }
    }

    // Get peer responses
    if (!type || type === 'all' || type === 'responses') {
      try {
        const responsesResult = await docClient.send(new ScanCommand({
          TableName: PEER_RESPONSES_TABLE,
          Limit: 100
        }));

        if (responsesResult.Items) {
          responsesResult.Items.forEach(response => {
            posts.push({
              id: response.id || response.responseId,
              type: 'peer_response',
              title: 'Peer Response',
              content: response.content,
              authorId: response.reviewerId,
              authorName: response.reviewerName || 'Unknown',
              createdAt: response.submittedAt,
              videoId: response.videoId
            });
          });
        }
      } catch (error) {
        console.error('Error fetching peer responses:', error);
      }
    }

    // Get video submissions
    if (!type || type === 'all' || type === 'submissions') {
      try {
        const submissionsResult = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          Limit: 100
        }));

        if (submissionsResult.Items) {
          submissionsResult.Items.forEach(submission => {
            posts.push({
              id: submission.submissionId || submission.id,
              type: 'video_submission',
              title: submission.videoTitle || 'Video Submission',
              content: submission.videoDescription || '',
              authorId: submission.studentId,
              authorName: submission.studentName || 'Unknown',
              createdAt: submission.submittedAt,
              courseId: submission.courseId,
              assignmentId: submission.assignmentId
            });
          });
        }
      } catch (error) {
        console.error('Error fetching video submissions:', error);
      }
    }

    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      posts: posts,
      count: posts.length
    });

  } catch (error) {
    console.error('Error fetching posts for moderation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts for moderation' },
      { status: 500 }
    );
  }
}
