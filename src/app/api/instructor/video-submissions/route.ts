import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
  // Remove explicit credentials to use IAM role
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

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

    console.log('Video submissions API called with:', { courseId, sectionId, assignmentId, instructorId });

    let submissions: any[] = [];

    if (assignmentId) {
      // Get submissions for a specific assignment
      console.log('Fetching submissions for assignment:', assignmentId);
      
      // Try using QueryCommand with index first, fall back to Scan if index doesn't exist
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
        console.log('Found submissions for assignment (via Query):', submissions.length);
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

      if (courseIds.length > 0) {
        // Get submissions for all instructor's courses
        const submissionsScanCommand = new ScanCommand({
          TableName: 'classcast-submissions',
          FilterExpression: 'courseId IN (:courseIds)',
          ExpressionAttributeValues: {
            ':courseIds': courseIds
          }
        });

        const submissionsResult = await docClient.send(submissionsScanCommand);
        submissions = (submissionsResult.Items || []) as any[];
        console.log('Found submissions for instructor courses:', submissions.length);
      }
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

    // Enrich submissions with student, assignment data, and signed video URLs
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        try {
          console.log('Enriching submission:', submission.submissionId);
          
          // Get student info from users table
          let studentInfo = null;
          try {
            const studentScanCommand = new ScanCommand({
              TableName: 'classcast-users',
              FilterExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': submission.studentId
              }
            });
            const studentResult = await docClient.send(studentScanCommand);
            studentInfo = studentResult.Items?.[0] || null;
          } catch (error) {
            console.error('Error fetching student info:', error);
          }

          // Get student's section information from course enrollment
          let sectionInfo = null;
          if (studentInfo && submission.courseId) {
            try {
              // Get the student's enrollment record to find their section
              const enrollmentScanCommand = new ScanCommand({
                TableName: 'classcast-courses',
                FilterExpression: 'courseId = :courseId',
                ExpressionAttributeValues: {
                  ':courseId': submission.courseId
                }
              });
              const enrollmentResult = await docClient.send(enrollmentScanCommand);
              const course = enrollmentResult.Items?.[0];
              
              if (course && course.students) {
                const studentEnrollment = course.students.find((s: any) => s.userId === submission.studentId);
                if (studentEnrollment && studentEnrollment.sectionId) {
                  // Get section details
                  const sectionScanCommand = new ScanCommand({
                    TableName: 'classcast-sections',
                    FilterExpression: 'sectionId = :sectionId',
                    ExpressionAttributeValues: {
                      ':sectionId': studentEnrollment.sectionId
                    }
                  });
                  const sectionResult = await docClient.send(sectionScanCommand);
                  sectionInfo = sectionResult.Items?.[0] || null;
                }
              }
            } catch (error) {
              console.error('Error fetching section info:', error);
            }
          }

          // Get assignment info from assignments table
          let assignmentInfo = null;
          try {
            const assignmentScanCommand = new ScanCommand({
              TableName: 'classcast-assignments',
              FilterExpression: 'assignmentId = :assignmentId',
              ExpressionAttributeValues: {
                ':assignmentId': submission.assignmentId
              }
            });
            const assignmentResult = await docClient.send(assignmentScanCommand);
            assignmentInfo = assignmentResult.Items?.[0] || null;
          } catch (error) {
            console.error('Error fetching assignment info:', error);
          }

          // Generate signed URL for video if it exists
          let signedVideoUrl = submission.videoUrl;
          if (submission.videoUrl) {
            try {
              // Check if it's a YouTube URL - if so, use it as-is
              const isYouTube = submission.isYouTube || 
                               submission.youtubeUrl || 
                               submission.videoUrl.includes('youtube.com') || 
                               submission.videoUrl.includes('youtu.be');
              
              if (isYouTube) {
                // Use YouTube URL directly (no S3 processing)
                signedVideoUrl = submission.youtubeUrl || submission.videoUrl;
                console.log('Using YouTube URL directly (instructor grading):', signedVideoUrl);
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

          return {
            ...submission,
            videoUrl: signedVideoUrl,
            youtubeUrl: submission.youtubeUrl || null,
            isYouTube: submission.isYouTube || false,
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
              dueDate: assignmentInfo.dueDate || null
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

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions,
      count: enrichedSubmissions.length
    });

  } catch (error) {
    console.error('Error fetching video submissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch video submissions'
    }, { status: 500 });
  }
}
