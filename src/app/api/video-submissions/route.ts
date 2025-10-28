import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
  // Remove explicit credentials to use IAM role
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// GET /api/video-submissions - Get video submissions for an assignment or student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    let submissions = [];

    if (assignmentId) {
      // Get submissions for a specific assignment
      // Try using index first, fall back to scan if index doesn't exist
      try {
        const queryCommand = new QueryCommand({
          TableName: 'classcast-submissions',
          IndexName: 'AssignmentIdIndex',
          KeyConditionExpression: 'assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':assignmentId': assignmentId
          }
        });

        const result = await docClient.send(queryCommand);
        submissions = result.Items || [];
      } catch (indexError: any) {
        // If index doesn't exist, fall back to scan
        console.log('Index not found, falling back to scan. Error:', indexError.name);
        const scanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: 'assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':assignmentId': assignmentId
          }
        });

        const result = await docClient.send(scanCommand);
        submissions = result.Items || [];
      }
      
      // Further filter by courseId if provided
      if (courseId) {
        submissions = submissions.filter((s: any) => s.courseId === courseId);
      }
      
      // Filter out hidden/deleted submissions
      submissions = submissions.filter((s: any) => !s.isHidden && !s.isDeleted);
    } else if (studentId) {
      // Get submissions for a specific student
      try {
        const queryCommand = new QueryCommand({
          TableName: 'classcast-submissions',
          IndexName: 'StudentIdIndex',
          KeyConditionExpression: 'studentId = :studentId',
          ExpressionAttributeValues: {
            ':studentId': studentId
          }
        });

        const result = await docClient.send(queryCommand);
        submissions = result.Items || [];
      } catch (indexError: any) {
        // If index doesn't exist, fall back to scan
        console.log('Index not found, falling back to scan. Error:', indexError.name);
        const scanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: 'studentId = :studentId',
          ExpressionAttributeValues: {
            ':studentId': studentId
          }
        });

        const result = await docClient.send(scanCommand);
        submissions = result.Items || [];
      }
      
      // Further filter by courseId if provided
      if (courseId) {
        submissions = submissions.filter((s: any) => s.courseId === courseId);
      }
      
      // Filter out hidden/deleted submissions
      submissions = submissions.filter((s: any) => !s.isHidden && !s.isDeleted);
    } else if (courseId) {
      // Get all submissions for a course
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': courseId
        }
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      
      // Filter out hidden/deleted submissions
      submissions = submissions.filter((s: any) => !s.isHidden && !s.isDeleted);
    } else {
      // Get all submissions
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions'
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      
      // Filter out hidden/deleted submissions
      submissions = submissions.filter((s: any) => !s.isHidden && !s.isDeleted);
    }

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length
    });

  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video submissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/video-submissions - Create a new video submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assignmentId,
      studentId,
      courseId,
      sectionId, // Add sectionId
      videoUrl,
      videoId,
      videoTitle,
      videoDescription,
      duration,
      fileName,
      fileSize,
      fileType,
      isRecorded = false,
      isUploaded = false,
      isLocalStorage = false,
      // YouTube-specific fields
      youtubeUrl,
      thumbnailUrl,
      submissionMethod,
      isYouTube = false
    } = body;

    // For YouTube submissions, we don't need videoUrl, just youtubeUrl
    if (!assignmentId || !studentId || !courseId || (!videoUrl && !youtubeUrl)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: assignmentId, studentId, courseId, and either videoUrl or youtubeUrl'
      }, { status: 400 });
    }

    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Use provided thumbnail URL or generate placeholder
    const finalThumbnailUrl = thumbnailUrl || `/api/placeholder/400/300?text=${encodeURIComponent(videoTitle || 'Video')}`;

    const submission = {
      submissionId,
      assignmentId,
      studentId,
      courseId,
      sectionId: sectionId || null, // Add sectionId to submission
      // For YouTube submissions, store both the YouTube URL and use it as videoUrl
      videoUrl: isYouTube ? youtubeUrl : videoUrl,
      youtubeUrl: youtubeUrl || null, // Store YouTube URL separately
      videoId: videoId || null,
      videoTitle: videoTitle || 'Video Submission',
      videoDescription: videoDescription || '',
      duration: duration || 0,
      fileName: fileName || (isYouTube ? 'youtube-video' : 'video.webm'),
      fileSize: fileSize || 0,
      fileType: fileType || (isYouTube ? 'video/youtube' : 'video/webm'),
      thumbnailUrl: finalThumbnailUrl, // Add thumbnail URL
      isRecorded,
      isUploaded,
      isLocalStorage,
      isYouTube, // Flag for YouTube submissions
      submissionMethod: submissionMethod || (isRecorded ? 'record' : isUploaded ? 'upload' : isYouTube ? 'youtube' : 'unknown'),
      status: 'submitted', // submitted, graded, returned
      grade: null,
      instructorFeedback: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      gradedAt: null
    };

    // Save to submissions table
    const putCommand = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });

    await docClient.send(putCommand);

    // Send email notification to admin about new video submission
    try {
      // Get student details for email
      let studentName = 'Unknown Student';
      let studentEmail = 'Unknown';
      try {
        const userResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-users',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': studentId
          },
          Limit: 1
        }));
        
        if (userResult.Items && userResult.Items.length > 0) {
          const user = userResult.Items[0];
          studentName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || studentName;
          studentEmail = user.email || studentEmail;
        }
      } catch (userError) {
        console.warn('Could not fetch student name for email:', userError);
      }

      // Send email notification
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const sesClient = new SESClient({ region: 'us-east-1' });

      const emailBody = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">📹 New Video Submission</h2>
              
              <p>A student has submitted a new video assignment:</p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
                <p style="margin: 5px 0;"><strong>Assignment:</strong> ${videoTitle || 'Video Submission'}</p>
                <p style="margin: 5px 0;"><strong>Submission Method:</strong> ${submissionMethod || (isYouTube ? 'YouTube' : 'Upload')}</p>
                <p style="margin: 5px 0;"><strong>Submitted At:</strong> ${now}</p>
                ${description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>` : ''}
              </div>

              <div style="background: #f9fafb; padding: 15px; margin-top: 20px; border-radius: 4px;">
                <p style="margin: 0;"><strong>Submission Details:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Submission ID: ${submissionId}</li>
                  <li>Assignment ID: ${assignmentId}</li>
                  <li>Course ID: ${courseId}</li>
                  ${duration ? `<li>Duration: ${duration} seconds</li>` : ''}
                  ${fileSize ? `<li>File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB</li>` : ''}
                </ul>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from ClassCast Platform<br>
                Generated at ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `;

      const params = {
        Source: 'noreply@myclasscast.com',
        Destination: {
          ToAddresses: ['wilson.danny@me.com'],
        },
        Message: {
          Subject: {
            Data: `📹 New Video Submission: ${videoTitle || 'Video Assignment'} by ${studentName}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `
New Video Submission

Student: ${studentName}
Student ID: ${studentId}
Assignment: ${videoTitle || 'Video Submission'}
Submission Method: ${submissionMethod || (isYouTube ? 'YouTube' : 'Upload')}
Submitted At: ${now}

Submission Details:
- Submission ID: ${submissionId}
- Assignment ID: ${assignmentId}
- Course ID: ${courseId}
${duration ? `- Duration: ${duration} seconds` : ''}
${fileSize ? `- File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB` : ''}

Generated at ${new Date().toISOString()}
              `,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const command = new SendEmailCommand(params);
      await sesClient.send(command);
      console.log('✅ Email notification sent for video submission');
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the submission if email fails
    }

    // Update assignment status to 'submitted' for this student
    try {
      const updateAssignmentCommand = new UpdateCommand({
        TableName: 'classcast-assignments',
        Key: { assignmentId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'submitted',
          ':updatedAt': new Date().toISOString()
        }
      });

      await docClient.send(updateAssignmentCommand);
    } catch (assignmentError) {
      console.warn('Could not update assignment status:', assignmentError);
      // Don't fail the submission if assignment update fails
    }

    // Also create an entry in the videos table for community display
    try {
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get course name for the video entry
      let courseName = 'Unknown Course';
      try {
        const courseResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-courses',
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          },
          Limit: 1
        }));
        
        if (courseResult.Items && courseResult.Items.length > 0) {
          courseName = courseResult.Items[0].courseName || courseName;
        }
      } catch (courseError) {
        console.warn('Could not fetch course name:', courseError);
      }

      // Get student name for the video entry
      let studentName = 'Unknown Student';
      try {
        const userResult = await docClient.send(new ScanCommand({
          TableName: 'classcast-users',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': studentId
          },
          Limit: 1
        }));
        
        if (userResult.Items && userResult.Items.length > 0) {
          const user = userResult.Items[0];
          studentName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || studentName;
        }
      } catch (userError) {
        console.warn('Could not fetch student name:', userError);
      }

      const videoData = {
        id: videoId,
        title: videoTitle || 'Video Submission',
        description: videoDescription || '',
        videoUrl: isYouTube ? youtubeUrl : videoUrl,
        youtubeUrl: youtubeUrl || null,
        isYouTube: isYouTube || false,
        thumbnail: finalThumbnailUrl || '/api/placeholder/300/200',
        duration: duration || 0,
        courseId,
        userId: studentId,
        courseName,
        author: {
          name: studentName,
          avatar: '/api/placeholder/40/40'
        },
        stats: {
          views: 0,
          likes: 0,
          comments: 0,
          responses: 0,
          averageRating: 0,
          totalRatings: 0
        },
        createdAt: now,
        updatedAt: now,
        submissionId, // Link back to the submission
        isSubmission: true // Flag to indicate this is a submission video
      };

      const videoPutCommand = new PutCommand({
        TableName: 'classcast-videos',
        Item: videoData
      });

      await docClient.send(videoPutCommand);
      console.log('Video entry created for community display:', videoId);
    } catch (videoError) {
      console.error('Error creating video entry for community display:', videoError);
      // Don't fail the submission if video creation fails
    }

    return NextResponse.json({
      success: true,
      submission,
      message: 'Video submission created successfully'
    });

  } catch (error) {
    console.error('Error creating video submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create video submission',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/video-submissions - Update a video submission (for grading)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      grade,
      instructorFeedback,
      status = 'graded'
    } = body;

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: submissionId'
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updateCommand: any = {
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, gradedAt = :gradedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': now,
        ':gradedAt': now
      }
    };

    // Add grade and feedback if provided
    if (grade !== undefined) {
      updateCommand.UpdateExpression += ', grade = :grade';
      updateCommand.ExpressionAttributeValues[':grade'] = grade;
    }

    if (instructorFeedback !== undefined) {
      updateCommand.UpdateExpression += ', instructorFeedback = :feedback';
      updateCommand.ExpressionAttributeValues[':feedback'] = instructorFeedback;
    }

    await docClient.send(new UpdateCommand(updateCommand));

    return NextResponse.json({
      success: true,
      message: 'Video submission updated successfully'
    });

  } catch (error) {
    console.error('Error updating video submission:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update video submission'
    }, { status: 500 });
  }
}
