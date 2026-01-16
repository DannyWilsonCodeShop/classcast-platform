const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

const SUBMISSIONS_TABLE = 'classcast-submissions';
const VIDEO_BUCKET = 'classcast-student-videos';

// Check if YouTube video exists
function checkYouTubeVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Check if S3 object exists
async function checkS3Object(key) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: VIDEO_BUCKET,
      Key: key
    }));
    return true;
  } catch (error) {
    return false;
  }
}

async function checkVideoSubmissions() {
  try {
    console.log('🔍 Checking video submissions for assignment: assignment_1768361755173_ti155u2nf\n');
    
    // Get all submissions for this assignment
    const result = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': 'assignment_1768361755173_ti155u2nf'
      }
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.log('❌ No submissions found for this assignment');
      return;
    }
    
    console.log(`✅ Found ${result.Items.length} submissions\n`);
    console.log('='.repeat(80) + '\n');
    
    for (const submission of result.Items) {
      console.log(`📹 Submission: ${submission.submissionId}`);
      console.log(`   Student: ${submission.studentName || submission.studentId}`);
      console.log(`   Title: ${submission.videoTitle || 'Untitled'}`);
      console.log(`   Submitted: ${submission.submittedAt || submission.createdAt}`);
      
      // Check video type
      if (submission.youtubeUrl || submission.isYouTube) {
        const youtubeUrl = submission.youtubeUrl || submission.videoUrl;
        const videoId = extractYouTubeId(youtubeUrl);
        
        console.log(`   Type: YouTube`);
        console.log(`   URL: ${youtubeUrl}`);
        console.log(`   Video ID: ${videoId}`);
        
        if (videoId) {
          const exists = await checkYouTubeVideo(videoId);
          if (exists) {
            console.log(`   ✅ YouTube video EXISTS`);
          } else {
            console.log(`   ❌ YouTube video NOT FOUND (404)`);
            console.log(`   🔧 This video needs to be re-submitted or removed`);
          }
        } else {
          console.log(`   ❌ Could not extract YouTube video ID`);
        }
      } else if (submission.videoUrl) {
        console.log(`   Type: S3 Upload`);
        console.log(`   URL: ${submission.videoUrl}`);
        
        // Extract S3 key from URL
        const s3KeyMatch = submission.videoUrl.match(/amazonaws\.com\/(.+?)(?:\?|$)/);
        if (s3KeyMatch) {
          const s3Key = decodeURIComponent(s3KeyMatch[1]);
          console.log(`   S3 Key: ${s3Key}`);
          
          const exists = await checkS3Object(s3Key);
          if (exists) {
            console.log(`   ✅ S3 video EXISTS`);
          } else {
            console.log(`   ❌ S3 video NOT FOUND`);
            console.log(`   🔧 This video may have been deleted or the URL is incorrect`);
          }
        } else {
          console.log(`   ⚠️  Could not extract S3 key from URL`);
        }
      } else {
        console.log(`   ⚠️  No video URL found`);
      }
      
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY:');
    
    const youtubeSubmissions = result.Items.filter(s => s.youtubeUrl || s.isYouTube);
    const s3Submissions = result.Items.filter(s => s.videoUrl && !s.youtubeUrl && !s.isYouTube);
    
    console.log(`   Total Submissions: ${result.Items.length}`);
    console.log(`   YouTube Videos: ${youtubeSubmissions.length}`);
    console.log(`   S3 Uploads: ${s3Submissions.length}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Check browser console for specific video IDs that are failing');
    console.log('   2. Invalid YouTube videos should be re-submitted by students');
    console.log('   3. Missing S3 videos may need to be re-uploaded');
    console.log('   4. After CloudFront invalidation completes, try hard refresh (Cmd+Shift+R)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkVideoSubmissions();
