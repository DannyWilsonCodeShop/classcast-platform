const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function findStudent() {
  console.log('🔍 Searching for Kidist Shiwendo...');
  
  const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
  
  const params = {
    TableName: 'classcast-users',
    FilterExpression: 'contains(#name, :firstName) OR contains(#name, :lastName)',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':firstName': 'Kidist',
      ':lastName': 'Shiwendo'
    }
  };

  try {
    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    
    if (result.Items && result.Items.length > 0) {
      console.log('✅ Found student:', result.Items[0]);
      return result.Items[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error finding student:', error);
    return null;
  }
}

async function submitGoogleDriveVideo() {
  // Student and assignment info
  const studentName = 'Kidist Shiwendo';
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
  
  // Find student
  const student = await findStudent();
  
  if (!student) {
    console.error('❌ Could not find student. Please provide the student ID manually.');
    console.log('💡 You can find it by searching the users table for "Kidist" or "Shiwendo"');
    return;
  }
  
  const studentId = student.userId || student.id;
  console.log('👤 Student ID:', studentId);
  console.log('👤 Student Name:', student.name);
  
  // Get section ID from assignment
  let sectionId = null;
  try {
    const assignmentParams = {
      TableName: 'classcast-assignments',
      Key: { assignmentId }
    };
    
    const { GetCommand } = require('@aws-sdk/lib-dynamodb');
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
      name: student.name,
      email: student.email
    }
  };
  
  console.log('\n📤 Creating submission...');
  console.log(JSON.stringify(submission, null, 2));
  
  try {
    const command = new PutCommand({
      TableName: 'classcast-video-submissions',
      Item: submission
    });
    
    await docClient.send(command);
    
    console.log('\n✅ SUCCESS! Google Drive submission created');
    console.log('📋 Submission ID:', submissionId);
    console.log('👤 Student:', student.name);
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
