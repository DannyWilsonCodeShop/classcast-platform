const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function submitGoogleDriveVideo() {
  // MANUALLY SET THESE VALUES
  const studentId = 'user_1760724974233_dxrypaar1'; // kidist sh from the logs you showed earlier
  const studentName = 'kidist sh';
  const studentEmail = 'unknown@example.com'; // Will be updated if we can fetch it
  
  const assignmentId = 'assignment_1768361755173_ti155u2nf'; // Graphing Piecewise Functions
  const courseId = 'course_1760635875079_bcjiq11ho';
  const googleDriveUrl = 'https://drive.google.com/file/d/1bbJqSy1N4j7cKkhqR3TRrl3S786xJFKh/view?usp=drivesdk';
  
  // Extract file ID from Google Drive URL
  const fileIdMatch = googleDriveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : null;
  
  if (!fileId) {
    console.error('❌ Could not extract file ID from Google Drive URL');
    return;
  }
  
  console.log('📋 File ID:', fileId);
  console.log('👤 Student ID:', studentId);
  console.log('👤 Student Name:', studentName);
  
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
  
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  
  const submission = {
    submissionId,
    assignmentId,
    studentId,
    courseId,
    sectionId,
    googleDriveUrl: previewUrl,
    googleDriveOriginalUrl: googleDriveUrl,
    googleDriveFileId: fileId,
    videoUrl: previewUrl,
    thumbnailUrl,
    videoTitle: 'Graphing Piecewise Functions - Kidist Shiwendo',
    videoDescription: 'Student Google Drive video submission',
    submissionMethod: 'google-drive',
    isRecorded: false,
    isUploaded: false,
    isYouTube: false,
    isGoogleDrive: true,
    status: 'submitted',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    student: {
      name: studentName,
      email: studentEmail
    }
  };
  
  console.log('\n📤 Creating submission...');
  console.log(JSON.stringify(submission, null, 2));
  
  try {
    const command = new PutCommand({
      TableName: 'classcast-submissions',
      Item: submission
    });
    
    await docClient.send(command);
    
    console.log('\n✅ SUCCESS! Google Drive submission created');
    console.log('📋 Submission ID:', submissionId);
    console.log('👤 Student:', studentName);
    console.log('📝 Assignment: Graphing Piecewise Functions');
    console.log('🔗 Google Drive URL:', googleDriveUrl);
    console.log('🔗 Preview URL:', previewUrl);
    
  } catch (error) {
    console.error('❌ Error creating submission:', error);
    throw error;
  }
}

// Run the script
submitGoogleDriveVideo()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
