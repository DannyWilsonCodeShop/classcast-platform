/**
 * Script to create test peer video submissions for real courses
 * Run with: node create-peer-videos-for-real-courses.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

async function createPeerVideosForRealCourses() {
  try {
    console.log('🔍 Scanning all submissions...');
    
    const scanResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      Limit: 50
    }));
    
    const allSubmissions = scanResult.Items || [];
    console.log(`Found ${allSubmissions.length} total submission(s)`);
    
    // Get unique courses with valid courseIds
    const courses = new Map();
    allSubmissions.forEach(sub => {
      if (sub.courseId && sub.courseId !== 'undefined' && sub.courseId !== 'test_course_delete') {
        if (!courses.has(sub.courseId)) {
          courses.set(sub.courseId, {
            courseId: sub.courseId,
            assignments: new Set()
          });
        }
        if (sub.assignmentId && sub.assignmentId !== 'test_assignment_delete') {
          courses.get(sub.courseId).assignments.add(sub.assignmentId);
        }
      }
    });
    
    console.log(`\nFound ${courses.size} unique course(s) with valid data:`);
    courses.forEach((course, courseId) => {
      console.log(`  📚 ${courseId}: ${course.assignments.size} assignment(s)`);
    });
    
    if (courses.size === 0) {
      console.log('\n⚠️  No valid courses found. Cannot create peer videos.');
      return;
    }
    
    // Create test students
    const testStudents = [
      { id: 'student_alice_test_456', name: 'Alice Johnson' },
      { id: 'student_bob_test_789', name: 'Bob Smith' },
      { id: 'student_carol_test_012', name: 'Carol Williams' }
    ];
    
    let createdCount = 0;
    
    // For each course, create peer videos
    for (const [courseId, courseData] of courses.entries()) {
      console.log(`\n🎓 Creating peer videos for course: ${courseId}`);
      
      const assignments = Array.from(courseData.assignments);
      
      // Create 2 videos per student per course (using first 2 assignments)
      for (const student of testStudents) {
        for (let i = 0; i < Math.min(2, assignments.length); i++) {
          const assignmentId = assignments[i];
          const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();
          
          const submission = {
            submissionId,
            assignmentId,
            studentId: student.id,
            courseId,
            videoUrl: `https://classcast-videos-463470937777-us-east-1.s3.amazonaws.com/peer-test-${student.id}-${i}.webm`,
            videoId: null,
            videoTitle: `${student.name}'s Video - Assignment ${i + 1}`,
            videoDescription: `Test peer video submission from ${student.name} for course ${courseId}`,
            duration: Math.floor(Math.random() * 300) + 60,
            fileName: `${student.id}-video-${i}.webm`,
            fileSize: Math.floor(Math.random() * 5000000) + 1000000,
            fileType: 'video/webm',
            thumbnailUrl: `/api/placeholder/300/200`,
            isRecorded: true,
            isUploaded: false,
            isLocalStorage: false,
            status: 'submitted',
            grade: null,
            instructorFeedback: null,
            submittedAt: now,
            createdAt: now,
            updatedAt: now,
            gradedAt: null
          };
          
          await docClient.send(new PutCommand({
            TableName: SUBMISSIONS_TABLE,
            Item: submission
          }));
          
          createdCount++;
          console.log(`  ✅ Created: ${student.name} - Assignment ${i + 1}`);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} peer video submissions!`);
    console.log('\n💡 These videos are now in your actual courses and should appear on:');
    console.log('   • https://class-cast.com/student/peer-reviews');
    console.log('   • https://class-cast.com/student/dashboard (Videos to Review count)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createPeerVideosForRealCourses()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });

