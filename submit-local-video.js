const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

async function uploadVideoToS3AndCreateSubmission() {
  // Configuration
  const localFilePath = '/Users/dannywilson/DevOps/classcast-platform/public/StudentFiles/IMG_8794.MOV';
  const studentId = 'user_1759505141098_n4f6ved2q'; // Aklesia Abdi from the logs
  const studentName = 'Aklesia Abdi';
  const assignmentId = 'assignment_1768361755173_ti155u2nf'; // Graphing Piecewise Functions
  const courseId = 'course_1760635875079_bcjiq11ho';
  const bucketName = 'classcast-videos-463470937777-us-east-1';
  
  console.log('📁 Reading local file:', localFilePath);
  
  // Check if file exists
  if (!fs.existsSync(localFilePath)) {
    console.error('❌ File not found:', localFilePath);
    return;
  }
  
  // Get file stats
  const stats = fs.statSync(localFilePath);
  console.log('📊 File size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  
  // Read file
  const fileBuffer = fs.readFileSync(localFilePath);
  console.log('✅ File read successfully');
  
  // Generate S3 key
  const timestamp = Date.now();
  const s3Key = `video-submissions/${studentId}/${assignmentId}-${timestamp}.mov`;
  const s3Url = `https://${bucketName}.s3.us-east-1.amazonaws.com/${s3Key}`;
  
  console.log('\n📤 Uploading to S3...');
  console.log('🪣 Bucket:', bucketName);
  console.log('🔑 Key:', s3Key);
  
  try {
    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'video/quicktime'
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ Video uploaded to S3');
    console.log('🔗 S3 URL:', s3Url);
    
  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    throw error;
  }
  
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
  
  // Create submission in DynamoDB
  const submissionId = `submission_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const submission = {
    submissionId,
    assignmentId,
    studentId,
    courseId,
    sectionId,
    videoUrl: s3Url,
    videoTitle: 'Graphing Piecewise Functions - Aklesia Abdi',
    videoDescription: 'Student video submission',
    fileName: 'IMG_8794.MOV',
    fileSize: stats.size,
    fileType: 'video/quicktime',
    submissionMethod: 'upload',
    isRecorded: false,
    isUploaded: true,
    isYouTube: false,
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
  
  try {
    const command = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });
    
    await docClient.send(command);
    
    console.log('\n✅ SUCCESS! Video submission created');
    console.log('📋 Submission ID:', submissionId);
    console.log('👤 Student:', studentName);
    console.log('📝 Assignment: Graphing Piecewise Functions');
    console.log('🔗 Video URL:', s3Url);
    console.log('📊 File Size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
    
  } catch (error) {
    console.error('❌ Error creating submission:', error);
    throw error;
  }
}

// Run the script
uploadVideoToS3AndCreateSubmission()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
