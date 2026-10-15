import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { serverCache } from '@/lib/cache';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
  // Remove explicit credentials to use IAM role
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// This endpoint reflects grades that change constantly as the instructor works. It must
// NEVER be cached — a stale CDN copy made freshly-saved grades look unsaved, so instructors
// re-graded students who were already graded. Force dynamic + no-store.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to extract S3 key from S3 URL
function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Handle S3 URLs in format: https://bucket.s3.region.amazonaws.com/key
    // or https://s3.region.amazonaws.com/bucket/key
    const urlObj = new URL(url);
    
    // Extract path and remove leading slash
    let key = urlObj.pathname.substring(1);
    
    // If the URL contains the bucket name in the path, remove it
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

// GET /api/instructor/video-submissions - Get video submissions for instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const assignmentId = searchParams.get('assignmentId');
    const instructorId = searchParams.get('instructorId');
    const studentId = searchParams.get('studentId');

    console.log('Video submissions API called with:', { courseId, sectionId, assignmentId, instructorId, studentId });

    // Short-lived response cache so repeat loads (e.g. navigating back to grading during a
    // demo) are INSTANT instead of re-running dozens of DynamoDB scans + S3 signings.
    // Invalidated immediately when a grade is saved (see /api/submissions/[id]/grade), so a
    // cached list never hides a freshly-entered grade.
    const cacheKey = `instructor-submissions:${instructorId || ''}:${courseId || ''}:${sectionId || ''}:${assignmentId || ''}:${studentId || ''}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0', 'X-Cache': 'HIT' },
      });
    }

    let submissions: any[] = [];

    if (assignmentId) {
      // Get submissions for a specific assignment
      console.log('Fetching submissions for assignment:', assignmentId);
      

      
      // Try using QueryCommand with index first, fall back to Scan if index doesn't exist
      try {
        const queryCommand = new QueryCommand({
          TableName: 'classcast-submissions',
          IndexName: 'assignmentId-index',
          KeyConditionExpression: 'assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':assignmentId': assignmentId
          }
        });

        const result = await docClient.send(queryCommand);
        let allSubmissions = result.Items || [];
        console.log('Found submissions for assignment (via Query):', allSubmissions.length);
        
        // Filter by student if studentId is provided
        if (studentId) {
          submissions = allSubmissions.filter(sub => sub.studentId === studentId);
          console.log('Filtered submissions for student:', submissions.length);
        } else {
          submissions = allSubmissions;
        }
      } catch (queryError: any) {
        // If index doesn't exist, fall back to Scan with filter
        console.warn('Query failed, falling back to Scan:', queryError.message);
        
        let filterExpression = 'assignmentId = :assignmentId';
        let expressionAttributeValues: any = {
          ':assignmentId': assignmentId
        };

        // Also filter by courseId if provided
        if (courseId) {
          filterExpression += ' AND courseId = :courseId';
          expressionAttributeValues[':courseId'] = courseId;
        }

        // Also filter by studentId if provided
        if (studentId) {
          filterExpression += ' AND studentId = :studentId';
          expressionAttributeValues[':studentId'] = studentId;
        }

        const scanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: filterExpression,
          ExpressionAttributeValues: expressionAttributeValues
        });

        const result = await docClient.send(scanCommand);
        submissions = result.Items || [];
        console.log('Found submissions for assignment (via Scan):', submissions.length);
      }
    } else if (courseId) {
      // Get all submissions for a course (optionally filtered by section)
      console.log('Fetching submissions for course:', courseId, 'section:', sectionId);
      
      let filterExpression = 'courseId = :courseId';
      let expressionAttributeValues: any = {
        ':courseId': courseId
      };

      if (sectionId) {
        filterExpression += ' AND sectionId = :sectionId';
        expressionAttributeValues[':sectionId'] = sectionId;
      }

      if (studentId) {
        filterExpression += ' AND studentId = :studentId';
        expressionAttributeValues[':studentId'] = studentId;
      }

      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      console.log('Found submissions for course/section:', submissions.length);
    } else if (instructorId) {
      // Get all submissions for instructor's courses
      console.log('Fetching submissions for instructor:', instructorId);
      // First, get all courses for this instructor
      const coursesScanCommand = new ScanCommand({
        TableName: 'classcast-courses',
        FilterExpression: 'instructorId = :instructorId',
        ExpressionAttributeValues: {
          ':instructorId': instructorId
        }
      });

      const coursesResult = await docClient.send(coursesScanCommand);
      const courseIds = coursesResult.Items?.map(course => course.courseId) || [];
      
      console.log('Found courses for instructor:', courseIds.length);
      console.log('Course IDs:', courseIds);

      if (courseIds.length > 0) {
        // Get submissions for all instructor's courses
        // DynamoDB doesn't support IN operator with arrays, so we need to build OR conditions
        const courseConditions = courseIds.map((_, index) => `courseId = :courseId${index}`).join(' OR ');
        let filterExpression = `(${courseConditions})`;
        
        let expressionAttributeValues: any = {};
        courseIds.forEach((courseId, index) => {
          expressionAttributeValues[`:courseId${index}`] = courseId;
        });

        // Add student filter if provided
        if (studentId) {
          filterExpression += ' AND studentId = :studentId';
          expressionAttributeValues[':studentId'] = studentId;
        }

        const submissionsScanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: filterExpression,
          ExpressionAttributeValues: expressionAttributeValues
        });

        const submissionsResult = await docClient.send(submissionsScanCommand);
        submissions = (submissionsResult.Items || []) as any[];
        console.log('Found submissions for instructor courses:', submissions.length);
        console.log('Course IDs for instructor:', courseIds);
      } else {
        console.log('No courses found for instructor:', instructorId);
        submissions = [];
      }
    } else if (studentId) {
      // Get submissions for a specific student
      console.log('Fetching submissions for student:', studentId);
      
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'studentId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      console.log('Found submissions for student:', submissions.length);
    } else {
      // Get all submissions
      console.log('Fetching all submissions');
      const scanCommand = new ScanCommand({
        TableName: 'classcast-submissions'
      });

      const result = await docClient.send(scanCommand);
      submissions = result.Items || [];
      console.log('Found all submissions:', submissions.length);
    }

    // Filter out deleted submissions and unposted drafts (drafts are private to the student)
    const activeSubmissions = submissions.filter(sub => 
      sub.status !== 'deleted' && sub.status !== 'draft' && !sub.hidden
    );
    
    console.log(`Filtered submissions: ${submissions.length} total, ${activeSubmissions.length} active`);

    // BATCH-LOAD lookups ONCE instead of per-submission (the old code ran a users scan +
    // courses scan + assignments scan for EACH submission — an N+1 that meant ~hundreds of
    // full-table scans per request). Load each table once and build maps.
    const [usersResult, coursesLookupResult, assignmentsResult] = await Promise.all([
      docClient.send(new ScanCommand({
        TableName: 'classcast-users',
        ProjectionExpression: 'userId, firstName, lastName, email, avatar',
      })),
      docClient.send(new ScanCommand({ TableName: 'classcast-courses' })),
      docClient.send(new ScanCommand({
        TableName: 'classcast-assignments',
        ProjectionExpression: 'assignmentId, title, description, dueDate, maxScore, maxPoints, totalPoints, points',
      })),
    ]);
    const usersById = new Map<string, any>((usersResult.Items || []).map((u: any) => [u.userId, u]));
    const assignmentsById = new Map<string, any>((assignmentsResult.Items || []).map((a: any) => [a.assignmentId, a]));
    // Build studentId -> {sectionId, sectionName} per course from enrollment, once.
    const sectionByCourseStudent = new Map<string, { sectionId: string; sectionName: string }>();
    for (const course of (coursesLookupResult.Items || [])) {
      const enrolled = course?.enrollment?.students || course?.students || [];
      for (const s of enrolled) {
        if (s?.userId && s?.sectionId) {
          sectionByCourseStudent.set(`${course.courseId}:${s.userId}`, {
            sectionId: s.sectionId,
            sectionName: s.sectionName || '',
          });
        }
      }
    }

    // Enrich submissions from the in-memory maps (only S3 signing is async per submission).
    const enrichedSubmissions = await Promise.all(
      activeSubmissions.map(async (submission) => {
        try {
          // Student from map
          const studentInfo = usersById.get(submission.studentId) || null;

          // Section from the prebuilt enrollment map
          const sectionInfo = sectionByCourseStudent.get(`${submission.courseId}:${submission.studentId}`) || null;

          // Assignment from map
          const assignmentInfo = assignmentsById.get(submission.assignmentId) || null;

          // Generate signed URL for video if it exists
          let signedVideoUrl = submission.videoUrl;
          if (submission.videoUrl) {
            try {
              const isYouTube = submission.isYouTube ||
                                submission.youtubeUrl ||
                                submission.videoUrl.includes('youtube.com') ||
                                submission.videoUrl.includes('youtu.be');
              // Google Drive only if a URL actually points at Drive — don't trust a
              // non-empty googleDriveUrl field (older records copied the S3 URL into it).
              const isGoogleDrive =
                submission.videoUrl.includes('drive.google.com') ||
                (submission.googleDriveUrl && submission.googleDriveUrl.includes('drive.google.com')) ||
                (submission.isGoogleDrive && !submission.videoUrl.includes('amazonaws.com'));

              if (isYouTube) {
                signedVideoUrl = submission.youtubeUrl || submission.videoUrl;
                console.log('Using YouTube URL directly (instructor grading):', signedVideoUrl);
              } else if (isGoogleDrive) {
                signedVideoUrl = submission.googleDriveUrl || submission.videoUrl;
                console.log('Using Google Drive URL directly (instructor grading):', signedVideoUrl);
              } else {
                // Extract S3 key and generate presigned URL for S3 videos
                const s3Key = extractS3KeyFromUrl(submission.videoUrl);
                if (s3Key) {
                  const command = new GetObjectCommand({
                    Bucket: VIDEO_BUCKET,
                    Key: s3Key,
                  });
                  signedVideoUrl = await getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY });
                  console.log('Generated signed URL for video:', s3Key);
                }
              }
            } catch (error) {
              console.warn('Could not generate signed URL for video:', error);
              // Keep original URL as fallback
            }
          }

          // Sign the thumbnail URL too (S3 thumbnails need presigned access, otherwise
          // they 403 and render blank). Leave public/non-S3 thumbnails (e.g. YouTube) as-is.
          let signedThumbnailUrl = submission.thumbnailUrl;
          if (
            submission.thumbnailUrl &&
            !submission.thumbnailUrl.includes('placeholder') &&
            submission.thumbnailUrl.includes('amazonaws.com')
          ) {
            try {
              const thumbKey = extractS3KeyFromUrl(submission.thumbnailUrl);
              if (thumbKey) {
                const thumbCommand = new GetObjectCommand({
                  Bucket: VIDEO_BUCKET,
                  Key: thumbKey,
                });
                signedThumbnailUrl = await getSignedUrl(s3Client, thumbCommand, { expiresIn: SIGNED_URL_EXPIRY });
              }
            } catch (error) {
              console.warn('Could not generate signed URL for thumbnail:', error);
            }
          }

          return {
            ...submission,
            thumbnailUrl: signedThumbnailUrl,
            videoUrl: signedVideoUrl,
            youtubeUrl: submission.youtubeUrl || null,
            googleDriveUrl: submission.googleDriveUrl || submission.googleDriveOriginalUrl || null,
            isYouTube: submission.isYouTube || false,
            isGoogleDrive: submission.isGoogleDrive || false,
            student: studentInfo ? {
              id: studentInfo.userId,
              name: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || 'Unknown Student',
              email: studentInfo.email || 'unknown@example.com',
              avatar: studentInfo.avatar || null,
              sectionId: sectionInfo?.sectionId || null,
              sectionName: sectionInfo?.sectionName || null
            } : {
              id: submission.studentId,
              name: 'Unknown Student',
              email: 'unknown@example.com',
              avatar: null,
              sectionId: null,
              sectionName: null
            },
            assignment: assignmentInfo ? {
              id: assignmentInfo.assignmentId,
              title: assignmentInfo.title || 'Unknown Assignment',
              description: assignmentInfo.description || '',
              dueDate: assignmentInfo.dueDate || null,
              // Carry the real max score so the grading UI shows e.g. 16/16, not 16/100.
              // Fall back across the field names assignments have used over time.
              maxScore: assignmentInfo.maxScore ?? assignmentInfo.maxPoints ?? assignmentInfo.totalPoints ?? assignmentInfo.points ?? null,
            } : {
              id: submission.assignmentId,
              title: 'Unknown Assignment',
              description: '',
              dueDate: null
            }
          };
        } catch (error) {
          console.error('Error enriching submission:', error);
          return {
            ...submission,
            student: {
              id: submission.studentId,
              name: 'Unknown Student',
              email: 'unknown@example.com',
              avatar: null
            },
            assignment: {
              id: submission.assignmentId,
              title: 'Unknown Assignment',
              description: '',
              dueDate: null
            }
          };
        }
      })
    );

    const payload = {
      success: true,
      submissions: enrichedSubmissions,
      count: enrichedSubmissions.length,
    };

    // Cache the enriched result briefly so the next load is instant. 30s is short enough
    // that it never masks real changes for long, and the grade-save route invalidates it
    // immediately on any grade write.
    serverCache.set(cacheKey, payload, 30_000);

    return NextResponse.json(payload, {
      headers: {
        // CDN must not cache (grades mutate); the instant repeat-load comes from the
        // in-memory serverCache above, which we control + invalidate.
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-Cache': 'MISS',
      }
    });

  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video submissions'
    }, { status: 500 });
  }
}
