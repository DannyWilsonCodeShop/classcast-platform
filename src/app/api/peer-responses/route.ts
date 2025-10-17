import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';
import { validateContent, scanContentWithOpenAI, shouldFlagForReview } from '@/lib/contentModeration';
import { sendPeerFeedbackNotification } from '@/lib/emailNotifications';

const dynamodbService = new DynamoDBService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const videoId = searchParams.get('videoId');

    // If videoId is provided without assignmentId, scan by videoId
    if (videoId && !assignmentId) {
      const scanParams: any = {
        TableName: 'classcast-peer-responses',
        FilterExpression: 'videoId = :videoId',
        ExpressionAttributeValues: {
          ':videoId': videoId
        }
      };

      if (studentId) {
        scanParams.FilterExpression += ' AND reviewerId = :studentId';
        scanParams.ExpressionAttributeValues[':studentId'] = studentId;
      }

      const result = await dynamodbService.scan(scanParams);
      const responses = result.Items || [];

      // Fetch replies for each response to build threaded conversations
      const responsesWithReplies = await Promise.all(
        responses.map(async (response: any) => {
          if (response.replies && response.replies.length > 0) {
            // Fetch each reply
            const replyPromises = response.replies.map(async (replyId: string) => {
              try {
                const replyResult = await dynamodbService.getItem(
                  'classcast-peer-responses',
                  { responseId: replyId }
                );
                return replyResult.Item;
              } catch (error) {
                console.error(`Error fetching reply ${replyId}:`, error);
                return null;
              }
            });
            
            const fetchedReplies = await Promise.all(replyPromises);
            return {
              ...response,
              replies: fetchedReplies.filter(r => r !== null)
            };
          }
          return response;
        })
      );

      return NextResponse.json({
        success: true,
        data: responsesWithReplies,
        count: result.Count || 0
      });
    }

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID or Video ID is required' },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams: any = {
      TableName: 'classcast-peer-responses',
      IndexName: 'assignment-index',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    };

    // Add filters if provided
    if (studentId) {
      queryParams.FilterExpression = 'reviewerId = :studentId';
      queryParams.ExpressionAttributeValues[':studentId'] = studentId;
    }

    if (videoId) {
      if (queryParams.FilterExpression) {
        queryParams.FilterExpression += ' AND videoId = :videoId';
      } else {
        queryParams.FilterExpression = 'videoId = :videoId';
      }
      queryParams.ExpressionAttributeValues[':videoId'] = videoId;
    }

    const result = await dynamodbService.query(queryParams);
    const responses = result.Items || [];

    // Fetch replies for each response to build threaded conversations
    const responsesWithReplies = await Promise.all(
      responses.map(async (response: any) => {
        if (response.replies && response.replies.length > 0) {
          // Fetch each reply
          const replyPromises = response.replies.map(async (replyId: string) => {
            try {
              const replyResult = await dynamodbService.getItem(
                'classcast-peer-responses',
                { responseId: replyId }
              );
              return replyResult.Item;
            } catch (error) {
              console.error(`Error fetching reply ${replyId}:`, error);
              return null;
            }
          });
          
          const fetchedReplies = await Promise.all(replyPromises);
          return {
            ...response,
            replies: fetchedReplies.filter(r => r !== null)
          };
        }
        return response;
      })
    );

    return NextResponse.json({
      success: true,
      data: responsesWithReplies,
      count: result.Count || 0
    });
  } catch (error) {
    console.error('Error fetching peer responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch peer responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reviewerId,
      reviewerName,
      videoId,
      assignmentId,
      content,
      courseId,
      isSubmitted = false
    } = body;

    if (!reviewerId || !videoId || !assignmentId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ========================================
    // CONTENT MODERATION - Real-time blocking
    // ========================================
    const moderationResult = validateContent(content);
    
    if (!moderationResult.isAllowed) {
      console.log('🚫 Content blocked by moderation:', moderationResult.reason);
      return NextResponse.json(
        { 
          success: false, 
          error: moderationResult.reason,
          suggestions: moderationResult.suggestions,
          moderation: {
            profanity: moderationResult.profanity,
            pii: moderationResult.pii
          }
        },
        { status: 400 }
      );
    }

    const responseId = `response_${videoId}_${reviewerId}_${Date.now()}`;
    const now = new Date().toISOString();

    const peerResponse = {
      id: responseId,
      responseId: responseId,
      reviewerId,
      reviewerName,
      videoId,
      assignmentId,
      content: content.trim(),
      wordCount: content.trim().split(/\s+/).length,
      characterCount: content.length,
      isSubmitted,
      submittedAt: now,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
      threadLevel: 0,
      replies: []
    };

    await dynamodbService.putItem('classcast-peer-responses', peerResponse);

    // Send email notification to video owner (fire and forget)
    if (isSubmitted && body.videoOwnerId && body.videoOwnerEmail && body.assignmentTitle) {
      sendPeerFeedbackNotification(
        body.videoOwnerId,
        body.videoOwnerEmail,
        body.videoOwnerName || body.videoOwnerEmail,
        {
          reviewerName: reviewerName || 'A peer',
          content: content.trim(),
          assignmentTitle: body.assignmentTitle,
          videoId,
          assignmentId,
        },
        body.courseName || 'Your Course'
      ).catch(error => {
        console.error('Failed to send peer feedback notification email:', error);
        // Don't fail the response creation if email fails
      });
    }

    // ========================================
    // ASYNC CONTENT MODERATION - OpenAI scanning
    // ========================================
    if (isSubmitted) {
      // Run OpenAI moderation async (don't block response)
      scanContentWithOpenAI(content).then(async (openAIResult) => {
        if (openAIResult) {
          const flagCheck = shouldFlagForReview(openAIResult);
          
          if (flagCheck.shouldFlag) {
            console.log('⚠️ Content flagged by OpenAI moderation:', flagCheck.severity, flagCheck.categories);
            
            // Create moderation flag
            try {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/moderation/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contentId: responseId,
                  contentType: 'peer-response',
                  content,
                  authorId: reviewerId,
                  authorName: reviewerName,
                  courseId,
                  assignmentId,
                  flagReason: `OpenAI moderation flagged: ${flagCheck.categories.join(', ')}`,
                  severity: flagCheck.severity,
                  categories: flagCheck.categories,
                  moderationData: openAIResult
                })
              });
              
              // Send email notification to instructor for medium/high severity
              if (flagCheck.severity === 'high' || flagCheck.severity === 'medium') {
                console.log(`🚨 ${flagCheck.severity.toUpperCase()} SEVERITY FLAG - Sending notifications`);
                
                try {
                  // Send email notification
                  const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send-moderation-alert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      flagId: responseId,
                      severity: flagCheck.severity,
                      contentType: 'peer-response',
                      content,
                      authorName: reviewerName,
                      categories: flagCheck.categories,
                      courseId
                    })
                  });

                  if (emailResponse.ok) {
                    console.log('✅ Email notification sent');
                  } else {
                    console.error('❌ Email notification failed');
                  }

                  // Create in-app notification for instructors
                  const notifResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipientRole: 'instructor', // Send to all instructors
                      senderId: 'system',
                      senderName: 'Content Moderation',
                      type: 'moderation_flag',
                      title: `${flagCheck.severity === 'high' ? '🚨' : '⚠️'} Content Flagged for Review`,
                      message: `${flagCheck.severity.toUpperCase()} severity: ${reviewerName}'s peer response flagged for ${flagCheck.categories.join(', ')}`,
                      relatedId: responseId,
                      relatedType: 'moderation-flag',
                      priority: flagCheck.severity === 'high' ? 'high' : 'normal',
                      actionUrl: '/instructor/moderation'
                    })
                  });

                  if (notifResponse.ok) {
                    console.log('✅ In-app notification created');
                  }
                } catch (emailError) {
                  console.error('Error sending notifications:', emailError);
                }
              }
            } catch (error) {
              console.error('Error creating moderation flag:', error);
            }
          }
        }
      }).catch(error => {
        console.error('Error in async moderation:', error);
      });
    }

    // Send notification to video author if response is submitted
    if (isSubmitted) {
      try {
        // Get video details to find the author
        const videoResult = await dynamodbService.getItem('classcast-submissions', { submissionId: videoId });
        const video = videoResult.Item;
        
        if (video && video.studentId && video.studentId !== reviewerId) {
          // Create notification for the video author
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: video.studentId,
              senderId: reviewerId,
              senderName: reviewerName,
              type: 'peer_response',
              title: 'New Response to Your Video',
              message: `${reviewerName} responded to your video: "${video.videoTitle || 'Video Submission'}"`,
              relatedId: videoId,
              relatedType: 'video',
              priority: 'normal'
            })
          });

          if (notificationResponse.ok) {
            console.log('✅ Notification sent to video author:', video.studentId);
          } else {
            console.error('❌ Failed to send notification:', await notificationResponse.text());
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the response creation if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      data: peerResponse,
      message: isSubmitted ? 'Response submitted successfully' : 'Response saved as draft'
    });
  } catch (error) {
    console.error('Error creating peer response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create peer response' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      content,
      isSubmitted = false
    } = body;

    if (!id || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const updateExpression = 'SET content = :content, wordCount = :wordCount, characterCount = :characterCount, isSubmitted = :isSubmitted, lastSavedAt = :lastSavedAt, updatedAt = :updatedAt';
    
    if (isSubmitted) {
      updateExpression += ', submittedAt = :submittedAt';
    }

    const expressionAttributeValues: any = {
      ':content': content.trim(),
      ':wordCount': content.trim().split(/\s+/).length,
      ':characterCount': content.length,
      ':isSubmitted': isSubmitted,
      ':lastSavedAt': now,
      ':updatedAt': now
    };

    if (isSubmitted) {
      expressionAttributeValues[':submittedAt'] = now;
    }

    await dynamodbService.updateItem(
      'classcast-peer-responses',
      { id },
      updateExpression,
      expressionAttributeValues
    );

    // Send notification to video author if response is being submitted
    if (isSubmitted) {
      try {
        // Get the existing response to find video and reviewer info
        const responseResult = await dynamodbService.getItem('classcast-peer-responses', { id });
        const response = responseResult.Item;
        
        if (response && response.videoId && response.reviewerId && response.reviewerName) {
          // Get video details to find the author
          const videoResult = await dynamodbService.getItem('classcast-submissions', { submissionId: response.videoId });
          const video = videoResult.Item;
          
          if (video && video.studentId && video.studentId !== response.reviewerId) {
            // Create notification for the video author
            const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId: video.studentId,
                senderId: response.reviewerId,
                senderName: response.reviewerName,
                type: 'peer_response',
                title: 'New Response to Your Video',
                message: `${response.reviewerName} responded to your video: "${video.videoTitle || 'Video Submission'}"`,
                relatedId: response.videoId,
                relatedType: 'video',
                priority: 'normal'
              })
            });

            if (notificationResponse.ok) {
              console.log('✅ Notification sent to video author:', video.studentId);
            } else {
              console.error('❌ Failed to send notification:', await notificationResponse.text());
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the response update if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isSubmitted ? 'Response submitted successfully' : 'Response updated successfully'
    });
  } catch (error) {
    console.error('Error updating peer response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update peer response' },
      { status: 500 }
    );
  }
}
