const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

async function testAllStorage() {
  console.log('🧪 Testing All Data Storage...\n');

  // Test 1: Check Users Table
  console.log('1️⃣ Checking Users in DynamoDB...');
  try {
    const usersResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-users',
      Limit: 5
    }));
    
    console.log(`✅ Found ${usersResult.Items?.length || 0} users in classcast-users table`);
    if (usersResult.Items && usersResult.Items.length > 0) {
      console.log('   Sample user:', {
        userId: usersResult.Items[0].userId?.S || usersResult.Items[0].userId,
        email: usersResult.Items[0].email?.S || usersResult.Items[0].email,
        role: usersResult.Items[0].role?.S || usersResult.Items[0].role
      });
    }
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
  }

  // Test 2: Check Assignments Table
  console.log('\n2️⃣ Checking Assignments in DynamoDB...');
  try {
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-assignments',
      Limit: 5
    }));
    
    console.log(`✅ Found ${assignmentsResult.Items?.length || 0} assignments in classcast-assignments table`);
    if (assignmentsResult.Items && assignmentsResult.Items.length > 0) {
      console.log('   Sample assignment:', {
        assignmentId: assignmentsResult.Items[0].assignmentId?.S || assignmentsResult.Items[0].assignmentId,
        title: assignmentsResult.Items[0].title?.S || assignmentsResult.Items[0].title,
        instructorId: assignmentsResult.Items[0].instructorId?.S || assignmentsResult.Items[0].instructorId
      });
    }
  } catch (error) {
    console.log('❌ Error checking assignments:', error.message);
  }

  // Test 3: Check Courses Table
  console.log('\n3️⃣ Checking Courses in DynamoDB...');
  try {
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses',
      Limit: 5
    }));
    
    console.log(`✅ Found ${coursesResult.Items?.length || 0} courses in classcast-courses table`);
    if (coursesResult.Items && coursesResult.Items.length > 0) {
      console.log('   Sample course:', {
        courseId: coursesResult.Items[0].courseId?.S || coursesResult.Items[0].courseId,
        courseName: coursesResult.Items[0].courseName?.S || coursesResult.Items[0].courseName,
        instructorId: coursesResult.Items[0].instructorId?.S || coursesResult.Items[0].instructorId
      });
    }
  } catch (error) {
    console.log('❌ Error checking courses:', error.message);
  }

  // Test 4: Check Submissions Table
  console.log('\n4️⃣ Checking Submissions in DynamoDB...');
  try {
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-submissions',
      Limit: 5
    }));
    
    console.log(`✅ Found ${submissionsResult.Items?.length || 0} submissions in classcast-submissions table`);
    if (submissionsResult.Items && submissionsResult.Items.length > 0) {
      console.log('   Sample submission:', {
        submissionId: submissionsResult.Items[0].submissionId?.S || submissionsResult.Items[0].submissionId,
        assignmentId: submissionsResult.Items[0].assignmentId?.S || submissionsResult.Items[0].assignmentId,
        studentId: submissionsResult.Items[0].studentId?.S || submissionsResult.Items[0].studentId
      });
    }
  } catch (error) {
    console.log('❌ Error checking submissions:', error.message);
  }

  // Test 5: Check S3 Bucket for Videos
  console.log('\n5️⃣ Checking S3 Bucket for Videos...');
  try {
    const s3Result = await s3Client.send(new ListObjectsV2Command({
      Bucket: 'classcast-videos-463470937777-us-east-1',
      MaxKeys: 10
    }));
    
    console.log(`✅ Found ${s3Result.Contents?.length || 0} objects in S3 bucket`);
    if (s3Result.Contents && s3Result.Contents.length > 0) {
      console.log('   Sample files:');
      s3Result.Contents.slice(0, 3).forEach((file, index) => {
        console.log(`     ${index + 1}. ${file.Key} (${Math.round(file.Size / 1024)}KB, ${file.LastModified?.toISOString()})`);
      });
    }
  } catch (error) {
    console.log('❌ Error checking S3 bucket:', error.message);
  }

  // Test 6: Check Content Moderation Table
  console.log('\n6️⃣ Checking Content Moderation in DynamoDB...');
  try {
    const moderationResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-content-moderation',
      Limit: 5
    }));
    
    console.log(`✅ Found ${moderationResult.Items?.length || 0} moderation records in classcast-content-moderation table`);
    if (moderationResult.Items && moderationResult.Items.length > 0) {
      console.log('   Sample moderation record:', {
        id: moderationResult.Items[0].id?.S || moderationResult.Items[0].id,
        contentType: moderationResult.Items[0].contentType?.S || moderationResult.Items[0].contentType,
        status: moderationResult.Items[0].status?.S || moderationResult.Items[0].status
      });
    }
  } catch (error) {
    console.log('❌ Error checking content moderation:', error.message);
  }

  console.log('\n🎉 Storage test completed!');
}

// Run the test
testAllStorage().catch(console.error);
