/**
 * Comprehensive Student Data Deletion Script
 * 
 * Deletes ALL data for specified students:
 * - Video submissions (DynamoDB + S3 files)
 * - Peer responses
 * - Community posts
 * - Community comments
 * - Interactions (likes, ratings, views)
 * - User profile data
 * - Course enrollments
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

const VIDEO_BUCKET = 'classcast-videos-463470937777-us-east-1';

// Students to delete
const STUDENTS_TO_DELETE = [
  'Shane Wilson',
  'Austin Wilson', 
  'Olivia Wilson',
  'EJ Wilson'
];

async function findUsersByName(names) {
  console.log('🔍 Finding users by name...');
  const users = [];

  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-users'
  }));

  const allUsers = result.Items || [];
  
  for (const name of names) {
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const matchedUsers = allUsers.filter(user => {
      const userFirst = (user.firstName || '').toLowerCase();
      const userLast = (user.lastName || '').toLowerCase();
      return userFirst === firstName.toLowerCase() && userLast === lastName.toLowerCase();
    });

    users.push(...matchedUsers);
  }

  console.log(`Found ${users.length} users to delete:`);
  users.forEach(u => console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) - ID: ${u.userId}`));
  
  return users;
}

async function deleteVideoSubmissions(userId) {
  console.log(`\n📹 Deleting video submissions for user ${userId}...`);
  let deletedCount = 0;
  let s3FilesDeleted = 0;

  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-submissions',
    FilterExpression: 'studentId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));

  const submissions = result.Items || [];
  console.log(`  Found ${submissions.length} submissions`);

  for (const submission of submissions) {
    // Delete video file from S3
    if (submission.videoUrl && !submission.isYouTube && !submission.videoUrl.includes('youtube')) {
      try {
        const s3Key = extractS3KeyFromUrl(submission.videoUrl);
        if (s3Key) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: VIDEO_BUCKET,
            Key: s3Key
          }));
          s3FilesDeleted++;
          console.log(`    ✅ Deleted S3 file: ${s3Key}`);
        }
      } catch (error) {
        console.error(`    ❌ Error deleting S3 file:`, error.message);
      }
    }

    // Delete thumbnail from S3
    if (submission.thumbnailUrl) {
      try {
        const thumbnailKey = extractS3KeyFromUrl(submission.thumbnailUrl);
        if (thumbnailKey) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: VIDEO_BUCKET,
            Key: thumbnailKey
          }));
          s3FilesDeleted++;
        }
      } catch (error) {
        console.error(`    ❌ Error deleting thumbnail:`, error.message);
      }
    }

    // Delete submission record
    await docClient.send(new DeleteCommand({
      TableName: 'classcast-submissions',
      Key: { submissionId: submission.submissionId }
    }));
    deletedCount++;
  }

  console.log(`  ✅ Deleted ${deletedCount} submissions and ${s3FilesDeleted} S3 files`);
  return { deletedCount, s3FilesDeleted };
}

async function deletePeerResponses(userId) {
  console.log(`\n💬 Deleting peer responses for user ${userId}...`);
  let deletedCount = 0;

  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-peer-responses',
    FilterExpression: 'reviewerId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));

  const responses = result.Items || [];
  console.log(`  Found ${responses.length} peer responses`);

  for (const response of responses) {
    // Log the response structure to see what key it has
    if (responses.length > 0 && deletedCount === 0) {
      console.log(`    Sample response keys:`, Object.keys(response));
    }

    // Use the 'id' field as the primary key
    const key = { id: response.id || response.responseId };
    
    try {
      await docClient.send(new DeleteCommand({
        TableName: 'classcast-peer-responses',
        Key: key
      }));
      deletedCount++;
    } catch (error) {
      console.error(`    ❌ Error deleting response ${response.id || response.responseId}:`, error.message);
    }
  }

  console.log(`  ✅ Deleted ${deletedCount} peer responses`);
  return deletedCount;
}

async function deleteCommunityPosts(userId) {
  console.log(`\n📝 Deleting community posts for user ${userId}...`);
  let deletedCount = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-community-posts',
      FilterExpression: 'authorId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const posts = result.Items || [];
    console.log(`  Found ${posts.length} community posts`);

    for (const post of posts) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: 'classcast-community-posts',
          Key: { postId: post.postId }
        }));
        deletedCount++;
      } catch (error) {
        console.error(`    ❌ Error deleting post:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} community posts`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`  ⚠️  Table does not exist, skipping...`);
    } else {
      throw error;
    }
  }
  
  return deletedCount;
}

async function deleteCommunityComments(userId) {
  console.log(`\n💭 Deleting community comments for user ${userId}...`);
  let deletedCount = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-community-comments',
      FilterExpression: 'authorId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const comments = result.Items || [];
    console.log(`  Found ${comments.length} community comments`);

    for (const comment of comments) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: 'classcast-community-comments',
          Key: { commentId: comment.commentId }
        }));
        deletedCount++;
      } catch (error) {
        console.error(`    ❌ Error deleting comment:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} community comments`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`  ⚠️  Table does not exist, skipping...`);
    } else {
      throw error;
    }
  }
  
  return deletedCount;
}

async function deleteInteractions(userId) {
  console.log(`\n👍 Deleting interactions for user ${userId}...`);
  let deletedCount = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-peer-interactions',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const interactions = result.Items || [];
    console.log(`  Found ${interactions.length} interactions`);

    for (const interaction of interactions) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: 'classcast-peer-interactions',
          Key: { id: interaction.id }
        }));
        deletedCount++;
      } catch (error) {
        console.error(`    ❌ Error deleting interaction:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} interactions`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`  ⚠️  Table does not exist, skipping...`);
    } else {
      throw error;
    }
  }
  
  return deletedCount;
}

async function removeFromCourseEnrollments(userId) {
  console.log(`\n🎓 Removing from course enrollments for user ${userId}...`);
  let coursesUpdated = 0;

  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-courses'
  }));

  const courses = result.Items || [];

  for (const course of courses) {
    if (course.enrollment?.students) {
      const hasStudent = course.enrollment.students.some(s => s.userId === userId);
      
      if (hasStudent) {
        const updatedStudents = course.enrollment.students.filter(s => s.userId !== userId);
        
        await docClient.send(new UpdateCommand({
          TableName: 'classcast-courses',
          Key: { courseId: course.courseId },
          UpdateExpression: 'SET enrollment.students = :students, currentEnrollment = :count',
          ExpressionAttributeValues: {
            ':students': updatedStudents,
            ':count': updatedStudents.length
          }
        }));
        
        coursesUpdated++;
        console.log(`    ✅ Removed from course: ${course.title || course.courseName}`);
      }
    }
  }

  console.log(`  ✅ Updated ${coursesUpdated} course enrollments`);
  return coursesUpdated;
}

async function deleteUserProfile(userId) {
  console.log(`\n👤 Deleting user profile for ${userId}...`);
  
  await docClient.send(new DeleteCommand({
    TableName: 'classcast-users',
    Key: { userId }
  }));
  
  console.log(`  ✅ Deleted user profile`);
}

function extractS3KeyFromUrl(url) {
  if (!url) return null;
  if (!url.startsWith('http')) return url;
  
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    if (path.startsWith('/')) path = path.substring(1);
    return path || null;
  } catch (error) {
    return null;
  }
}

async function deleteStudentData(user) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🗑️  DELETING ALL DATA FOR: ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`    User ID: ${user.userId}`);
  console.log(`${'='.repeat(80)}`);

  const report = {
    userName: `${user.firstName} ${user.lastName}`,
    userId: user.userId,
    email: user.email,
    submissionsDeleted: 0,
    s3FilesDeleted: 0,
    peerResponsesDeleted: 0,
    communityPostsDeleted: 0,
    communityCommentsDeleted: 0,
    interactionsDeleted: 0,
    coursesUpdated: 0
  };

  try {
    // Delete in order
    const submissionsResult = await deleteVideoSubmissions(user.userId);
    report.submissionsDeleted = submissionsResult.deletedCount;
    report.s3FilesDeleted = submissionsResult.s3FilesDeleted;

    report.peerResponsesDeleted = await deletePeerResponses(user.userId);
    report.communityPostsDeleted = await deleteCommunityPosts(user.userId);
    report.communityCommentsDeleted = await deleteCommunityComments(user.userId);
    report.interactionsDeleted = await deleteInteractions(user.userId);
    report.coursesUpdated = await removeFromCourseEnrollments(user.userId);
    
    await deleteUserProfile(user.userId);

    console.log(`\n✅ COMPLETED DELETION FOR: ${user.firstName} ${user.lastName}`);
    return report;

  } catch (error) {
    console.error(`\n❌ ERROR deleting data for ${user.firstName} ${user.lastName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting comprehensive student data deletion...\n');

  try {
    // Find users
    const users = await findUsersByName(STUDENTS_TO_DELETE);

    if (users.length === 0) {
      console.log('\n⚠️  No users found matching the specified names.');
      return;
    }

    console.log(`\n⚠️  WARNING: This will permanently delete ALL data for ${users.length} students!`);
    console.log('This includes:');
    console.log('  - Video submissions and files');
    console.log('  - Peer responses');
    console.log('  - Community posts and comments');
    console.log('  - All interactions');
    console.log('  - Course enrollments');
    console.log('  - User profiles');
    console.log('\nPress Ctrl+C within 5 seconds to cancel...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete each user's data
    const reports = [];
    for (const user of users) {
      const report = await deleteStudentData(user);
      reports.push(report);
    }

    // Final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 DELETION SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    const totals = {
      submissionsDeleted: 0,
      s3FilesDeleted: 0,
      peerResponsesDeleted: 0,
      communityPostsDeleted: 0,
      communityCommentsDeleted: 0,
      interactionsDeleted: 0,
      coursesUpdated: 0
    };

    reports.forEach(report => {
      console.log(`${report.userName} (${report.email}):`);
      console.log(`  - Submissions: ${report.submissionsDeleted}`);
      console.log(`  - S3 Files: ${report.s3FilesDeleted}`);
      console.log(`  - Peer Responses: ${report.peerResponsesDeleted}`);
      console.log(`  - Community Posts: ${report.communityPostsDeleted}`);
      console.log(`  - Community Comments: ${report.communityCommentsDeleted}`);
      console.log(`  - Interactions: ${report.interactionsDeleted}`);
      console.log(`  - Courses Updated: ${report.coursesUpdated}\n`);

      // Add to totals
      totals.submissionsDeleted += report.submissionsDeleted;
      totals.s3FilesDeleted += report.s3FilesDeleted;
      totals.peerResponsesDeleted += report.peerResponsesDeleted;
      totals.communityPostsDeleted += report.communityPostsDeleted;
      totals.communityCommentsDeleted += report.communityCommentsDeleted;
      totals.interactionsDeleted += report.interactionsDeleted;
      totals.coursesUpdated += report.coursesUpdated;
    });

    console.log('TOTALS:');
    console.log(`  - Total Submissions Deleted: ${totals.submissionsDeleted}`);
    console.log(`  - Total S3 Files Deleted: ${totals.s3FilesDeleted}`);
    console.log(`  - Total Peer Responses Deleted: ${totals.peerResponsesDeleted}`);
    console.log(`  - Total Community Posts Deleted: ${totals.communityPostsDeleted}`);
    console.log(`  - Total Community Comments Deleted: ${totals.communityCommentsDeleted}`);
    console.log(`  - Total Interactions Deleted: ${totals.interactionsDeleted}`);
    console.log(`  - Total Courses Updated: ${totals.coursesUpdated}`);
    console.log(`  - Total Users Deleted: ${users.length}`);

    console.log(`\n✅ ALL DATA SUCCESSFULLY DELETED FOR ${users.length} STUDENTS!\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

