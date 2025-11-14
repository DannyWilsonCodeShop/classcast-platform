/**
 * PERMANENT DELETION of test student data
 * 
 * This script will completely and permanently delete:
 * - All video submissions (DynamoDB records)
 * - All video files from S3
 * - All thumbnails from S3
 * - All peer responses
 * - Course enrollments
 * - User profiles
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

const VIDEO_BUCKET = 'classcast-videos-463470937777-us-east-1';

// Student user IDs to permanently delete
const STUDENTS_TO_DELETE = [
  { userId: 'user_1760397943147_epc5y6z99', name: 'Shane Wilson' },
  { userId: 'user_1759493077051_vp8wpn6j2', name: 'Austin Wilson' },
  { userId: 'user_1760122607792_al2161cme', name: 'Olivia Wilson' },
  { userId: 'user_1760601996117_bcpnlf8cl', name: 'EJ Wilson' }
];

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

async function deleteSubmissions(userId, userName) {
  console.log(`\n📹 Deleting submissions for ${userName}...`);
  let submissionsDeleted = 0;
  let s3FilesDeleted = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-submissions',
      FilterExpression: 'studentId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const submissions = result.Items || [];
    console.log(`  Found ${submissions.length} submissions to delete`);

    for (const submission of submissions) {
      // Delete video file from S3
      if (submission.videoUrl && !submission.isYouTube && !submission.videoUrl.includes('youtube')) {
        const s3Key = extractS3KeyFromUrl(submission.videoUrl);
        if (s3Key) {
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: VIDEO_BUCKET,
              Key: s3Key
            }));
            s3FilesDeleted++;
            console.log(`    ✅ Deleted S3: ${s3Key}`);
          } catch (error) {
            console.error(`    ⚠️  S3 delete failed: ${error.message}`);
          }
        }
      }

      // Delete thumbnail from S3
      if (submission.thumbnailUrl) {
        const thumbnailKey = extractS3KeyFromUrl(submission.thumbnailUrl);
        if (thumbnailKey) {
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: VIDEO_BUCKET,
              Key: thumbnailKey
            }));
            s3FilesDeleted++;
          } catch (error) {
            // Ignore thumbnail errors
          }
        }
      }

      // Delete submission record
      try {
        await docClient.send(new DeleteCommand({
          TableName: 'classcast-submissions',
          Key: { submissionId: submission.submissionId }
        }));
        submissionsDeleted++;
      } catch (error) {
        console.error(`    ❌ Failed to delete submission: ${error.message}`);
      }
    }

    console.log(`  ✅ Deleted ${submissionsDeleted} submissions, ${s3FilesDeleted} S3 files`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }

  return { submissionsDeleted, s3FilesDeleted };
}

async function deletePeerResponses(userId, userName) {
  console.log(`\n💬 Deleting peer responses for ${userName}...`);
  let deletedCount = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-peer-responses',
      FilterExpression: 'reviewerId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const responses = result.Items || [];
    console.log(`  Found ${responses.length} peer responses to delete`);

    for (const response of responses) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: 'classcast-peer-responses',
          Key: { id: response.id }
        }));
        deletedCount++;
      } catch (error) {
        console.error(`    ❌ Failed to delete response: ${error.message}`);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} peer responses`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }

  return deletedCount;
}

async function removeFromEnrollments(userId, userName) {
  console.log(`\n🎓 Removing ${userName} from course enrollments...`);
  let coursesUpdated = 0;

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));

    const courses = result.Items || [];

    for (const course of courses) {
      if (course.enrollment?.students) {
        const hasStudent = course.enrollment.students.some(s => s.userId === userId);
        
        if (hasStudent) {
          const updatedStudents = course.enrollment.students.filter(s => s.userId !== userId);
          
          try {
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
            console.log(`    ✅ Removed from: ${course.title || course.courseName}`);
          } catch (error) {
            console.error(`    ❌ Failed to update course: ${error.message}`);
          }
        }
      }
    }

    console.log(`  ✅ Updated ${coursesUpdated} courses`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }

  return coursesUpdated;
}

async function deleteUserProfile(userId, userName) {
  console.log(`\n👤 Deleting user profile for ${userName}...`);
  
  try {
    await docClient.send(new DeleteCommand({
      TableName: 'classcast-users',
      Key: { userId }
    }));
    console.log(`  ✅ User profile deleted`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function permanentlyDeleteStudent(student) {
  console.log('\n' + '='.repeat(80));
  console.log(`🗑️  PERMANENTLY DELETING: ${student.name}`);
  console.log(`    User ID: ${student.userId}`);
  console.log('='.repeat(80));

  const report = {
    userName: student.name,
    userId: student.userId,
    submissionsDeleted: 0,
    s3FilesDeleted: 0,
    peerResponsesDeleted: 0,
    coursesUpdated: 0,
    userDeleted: false
  };

  try {
    const submissionsResult = await deleteSubmissions(student.userId, student.name);
    report.submissionsDeleted = submissionsResult.submissionsDeleted;
    report.s3FilesDeleted = submissionsResult.s3FilesDeleted;

    report.peerResponsesDeleted = await deletePeerResponses(student.userId, student.name);
    report.coursesUpdated = await removeFromEnrollments(student.userId, student.name);
    report.userDeleted = await deleteUserProfile(student.userId, student.name);

    console.log(`\n✅ COMPLETED: ${student.name}`);
    return report;
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    return report;
  }
}

async function main() {
  console.log('🚀 PERMANENT DELETION OF TEST STUDENTS\n');
  console.log('⚠️  WARNING: This will PERMANENTLY delete all data!');
  console.log('\nStudents to delete:');
  STUDENTS_TO_DELETE.forEach(s => console.log(`  - ${s.name} (${s.userId})`));
  
  console.log('\n⏰ Starting deletion in 5 seconds... Press Ctrl+C to cancel!\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const reports = [];

  for (const student of STUDENTS_TO_DELETE) {
    const report = await permanentlyDeleteStudent(student);
    reports.push(report);
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL DELETION SUMMARY');
  console.log('='.repeat(80) + '\n');

  const totals = {
    submissionsDeleted: 0,
    s3FilesDeleted: 0,
    peerResponsesDeleted: 0,
    coursesUpdated: 0,
    usersDeleted: 0
  };

  reports.forEach(report => {
    console.log(`${report.userName}:`);
    console.log(`  - Submissions: ${report.submissionsDeleted}`);
    console.log(`  - S3 Files: ${report.s3FilesDeleted}`);
    console.log(`  - Peer Responses: ${report.peerResponsesDeleted}`);
    console.log(`  - Courses Updated: ${report.coursesUpdated}`);
    console.log(`  - User Deleted: ${report.userDeleted ? 'YES' : 'NO'}\n`);

    totals.submissionsDeleted += report.submissionsDeleted;
    totals.s3FilesDeleted += report.s3FilesDeleted;
    totals.peerResponsesDeleted += report.peerResponsesDeleted;
    totals.coursesUpdated += report.coursesUpdated;
    if (report.userDeleted) totals.usersDeleted++;
  });

  console.log('GRAND TOTALS:');
  console.log(`  - Submissions Deleted: ${totals.submissionsDeleted}`);
  console.log(`  - S3 Files Deleted: ${totals.s3FilesDeleted}`);
  console.log(`  - Peer Responses Deleted: ${totals.peerResponsesDeleted}`);
  console.log(`  - Courses Updated: ${totals.coursesUpdated}`);
  console.log(`  - Users Deleted: ${totals.usersDeleted}`);

  console.log('\n✅ PERMANENT DELETION COMPLETE!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

