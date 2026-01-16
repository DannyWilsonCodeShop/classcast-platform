const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function submitYouTubeVideo() {
  // Configuration
  const studentId = 'user_1759504826276_k5t9lwz22'; // Stephanie Posadas from the logs
  const studentName = 'Stephanie Posadas';
  const assignmentId = 'assignment_1768361755173_ti155u2nf'; // Graphing Piecewise Functions
  const courseId = 'course_1760635875079_bcjiq11ho';
  const youtubeUrl = 'https://youtu.be/Tq5nOO1A78I?si=bhMNxTkYTf0XzXBl';
  
  console.log('🎬 Processing YouTube URL:', youtubeUrl);
  
  // Extract video ID
  const videoId = extractYouTubeVideoId(youtubeUrl);
  
  if (!videoId) {
    console.error('❌ Could not extract video ID from YouTube URL');
    return;
  }
  
  console.log('📋 Video ID:', videoId);
  console.log('👤 Student ID:', studentId);
  console.log('👤 Student Name:', studentName);
  
  // Get thumbnail
  const thumbnailUrl = getYouTubeThumbnail(videoId);
  console.log('🖼️ Thumbnail URL:', thumbnailUrl);
  
  // Get section ID from assignment
  let sectionId = null;
  try {
    const assignmentParams = {
      TableName: 'classcast-assignments',
      Key: { assignmentId }
    };
    
    const assignmentResult = await docClient.send(new GetCommand(assignmentParams));
    
    if (assignmentResult.Item) {
      sectionId = assignmentResult.Item.sectionId;
      console.log('📚 Section ID:', sectionId);
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch assignment details:', error.message);
  }
  
  // Create submission
  const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const submission = {
    submissionId,
    assignmentId,
    studentId,
    courseId,
    sectionId,
    youtubeUrl,
    videoId,
    videoUrl: youtubeUrl,
    thumbnailUrl,
    videoTitle: 'Graphing Piecewise Functions - Stephanie Posadas',
    videoDescription: 'Student YouTube video submission',
    submissionMethod: 'youtube',
    isRecorded: false,
    isUploaded: false,
    isYouTube: true,
    isGoogleDrive: false,
    status: 'submitted',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    student: {
      name: studentName,
      email: 'unknown@example.com'
    }
  };
  
  console.log('\n📤 Creating submission in DynamoDB...');
  console.log(JSON.stringify(submission, null, 2));
  
  try {
    const command = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });
    
    await docClient.send(command);
    
    console.log('\n✅ SUCCESS! YouTube submission created');
    console.log('📋 Submission ID:', submissionId);
    console.log('👤 Student:', studentName);
    console.log('📝 Assignment: Graphing Piecewise Functions');
    console.log('🔗 YouTube URL:', youtubeUrl);
    console.log('🎬 Video ID:', videoId);
    
  } catch (error) {
    console.error('❌ Error creating submission:', error);
    throw error;
  }
}

// Run the script
submitYouTubeVideo()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
