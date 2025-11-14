import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: 'us-east-1' });

const SUBMISSIONS_TABLE = 'classcast-submissions';
const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Helper function to extract S3 key from S3 URL
function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let key = urlObj.pathname.substring(1);
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const assignmentId = searchParams.get('assignmentId');

    console.log('Fetching community submissions for student:', studentId, 'course:', courseId, 'assignment:', assignmentId);

    // Get peer submissions
    let submissions = [];
    
    try {
      // Build filter expression based on parameters
      let filterExpression = '';
      let expressionAttributeValues: any = {};
      
      const filters = [];
      
      if (assignmentId) {
        filters.push('assignmentId = :assignmentId');
        expressionAttributeValues[':assignmentId'] = assignmentId;
      }
      
      if (courseId) {
        filters.push('courseId = :courseId');
        expressionAttributeValues[':courseId'] = courseId;
      }
      
      // Exclude current student's own submissions ONLY if explicitly requested
      // Note: If studentId is provided, we include ALL videos (for dashboard feed)
      // If you want to exclude current user, pass excludeCurrentUser=true parameter
      const excludeCurrentUser = searchParams.get('excludeCurrentUser');
      if (excludeCurrentUser === 'true' && studentId) {
        filters.push('studentId <> :studentId');
        expressionAttributeValues[':studentId'] = studentId;
      }
      
      // Exclude hidden/deleted submissions
      filters.push('(attribute_not_exists(#hidden) OR #hidden = :false)');
      expressionAttributeValues[':false'] = false;
      
      filterExpression = filters.join(' AND ');
      
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        ...(filterExpression && {
          FilterExpression: filterExpression,
          ExpressionAttributeNames: {
            '#hidden': 'hidden'
          },
          ExpressionAttributeValues: expressionAttributeValues
        })
      }));
      
      submissions = submissionsResult.Items || [];
      
      // Sort by submittedAt in descending order (most recent first)
      submissions.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json([]);
      }
      throw dbError;
    }

    // Enrich submissions with student, course, and assignment information
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let studentName = 'Unknown Student';
      let studentEmail = 'unknown@example.com';
      let studentAvatar = '/api/placeholder/40/40';
      let courseName = 'Unknown Course';
      let assignmentTitle = 'Untitled Assignment';
      
      try {
        // Get student information
        if (submission.studentId) {
          const studentResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: submission.studentId }
          }));
          if (studentResult.Item) {
            studentName = `${studentResult.Item.firstName || ''} ${studentResult.Item.lastName || ''}`.trim() || 'Unknown Student';
            studentEmail = studentResult.Item.email || 'unknown@example.com';
            
            // Try multiple avatar sources with better fallback logic
            const user = studentResult.Item;
            studentAvatar = user.avatar || 
                           user.profile?.avatar || 
                           user.profilePicture || 
                           user.profileImage ||
                           `/api/placeholder/40/40?text=${encodeURIComponent((user.firstName || 'U').charAt(0))}`;
            
            console.log('🖼️ Avatar sources for', studentName, ':', {
              avatar: user.avatar,
              profileAvatar: user.profile?.avatar,
              profilePicture: user.profilePicture,
              profileImage: user.profileImage,
              final: studentAvatar
            });
          }
        }
        
        // Get course information
        if (submission.courseId) {
          const courseResult = await docClient.send(new GetCommand({
            TableName: COURSES_TABLE,
            Key: { courseId: submission.courseId }
          }));
          if (courseResult.Item) {
            courseName = courseResult.Item.title || courseResult.Item.name || 'Unknown Course';
          }
        }
        
        // Get assignment information
        if (submission.assignmentId) {
          const assignmentResult = await docClient.send(new GetCommand({
            TableName: ASSIGNMENTS_TABLE,
            Key: { assignmentId: submission.assignmentId }
          }));
          if (assignmentResult.Item) {
            assignmentTitle = assignmentResult.Item.title || 'Untitled Assignment';
          }
        }
      } catch (error) {
        console.error('Error enriching submission data:', error);
        // Use fallback values if enrichment fails
      }
      
      // Generate signed URL for video if it exists
      let signedVideoUrl = submission.videoUrl;
      if (submission.videoUrl) {
        try {
          const isYouTubeSubmission =
            submission.isYouTube ||
            submission.youtubeUrl ||
            submission.videoUrl.includes('youtube.com') ||
            submission.videoUrl.includes('youtu.be');
          const isGoogleDriveSubmission =
            submission.isGoogleDrive ||
            submission.googleDriveUrl ||
            submission.videoUrl.includes('drive.google.com');

          if (isYouTubeSubmission) {
            console.log('Using YouTube URL as-is:', submission.videoUrl);
            signedVideoUrl = submission.youtubeUrl || submission.videoUrl;
          } else if (isGoogleDriveSubmission) {
            console.log('Using Google Drive URL as-is:', submission.videoUrl);
            signedVideoUrl = submission.googleDriveUrl || submission.videoUrl;
          } else {
            // Extract S3 key from URL for non-YouTube videos
            const s3Key = extractS3KeyFromUrl(submission.videoUrl);
            if (s3Key) {
              const command = new GetObjectCommand({
                Bucket: VIDEO_BUCKET,
                Key: s3Key,
              });
              signedVideoUrl = await getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY });
              console.log('Generated signed URL for peer video:', s3Key);
            }
          }
        } catch (error) {
          console.warn('Could not generate signed URL for video:', error);
        }
      }

      return {
        id: submission.submissionId || submission.id,
        submissionId: submission.submissionId || submission.id,
        studentId: submission.studentId,
        studentName,
        studentEmail,
        studentAvatar,
        assignmentId: submission.assignmentId,
        assignmentTitle,
        courseId: submission.courseId,
        courseName,
        sectionId: submission.sectionId,
        videoUrl: signedVideoUrl,
        youtubeUrl: submission.youtubeUrl || null,
        googleDriveUrl: submission.googleDriveUrl || submission.googleDriveOriginalUrl || null,
        isYouTube: submission.isYouTube || false,
        isGoogleDrive: submission.isGoogleDrive || false,
        videoTitle: submission.videoTitle || 'Video Submission',
        videoDescription: submission.videoDescription || '',
        duration: submission.duration || 0,
        fileSize: submission.fileSize || 0,
        fileType: submission.fileType || 'video/webm',
        submittedAt: submission.submittedAt || submission.createdAt,
        status: submission.status || 'submitted',
        grade: submission.grade,
        maxPoints: submission.maxPoints || 100,
        feedback: submission.instructorFeedback,
        likes: submission.likes || 0,
        likedBy: submission.likedBy || [],
        comments: submission.comments || [],
        peerReviews: submission.peerReviews || [],
        isRecorded: submission.isRecorded || false,
        isUploaded: submission.isUploaded || false,
        thumbnailUrl: submission.thumbnailUrl || '/api/placeholder/300/200'
      };
    }));

    return NextResponse.json(enrichedSubmissions);
  } catch (error) {
    console.error('Error fetching community submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
