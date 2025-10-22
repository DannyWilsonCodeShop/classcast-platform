const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function debugFeedVideos() {
  try {
    console.log('\n🔍 DEBUGGING FEED VIDEO ISSUE\n');
    
    // Get user
    const userId = 'user_1760812158887_ikixnd8zx';
    console.log('👤 User ID:', userId);
    
    // Get user's courses
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));
    
    const allCourses = coursesResult.Items || [];
    const studentCourses = allCourses.filter(course => 
      course.enrollment?.students?.some((s) => s.userId === userId)
    );
    
    const courseIds = studentCourses.map(c => c.courseId);
    console.log('\n🎓 Student enrolled in', studentCourses.length, 'courses:');
    studentCourses.forEach(c => {
      console.log(`  - ${c.courseName || c.name} (${c.courseId})`);
    });
    console.log('\n📋 Course IDs:', courseIds);
    
    // Get video submissions
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-submissions'
    }));
    
    const submissions = submissionsResult.Items || [];
    console.log('\n📹 Total submissions in database:', submissions.length);
    
    // Check each submission
    console.log('\n🔍 CHECKING EACH SUBMISSION:\n');
    console.log('='.repeat(80));
    
    let includedCount = 0;
    let excludedCount = 0;
    
    submissions.forEach((sub, i) => {
      console.log(`\n${i + 1}. Submission: ${sub.submissionId}`);
      console.log(`   Title: ${sub.videoTitle || sub.title || 'Untitled'}`);
      console.log(`   Course ID: ${sub.courseId}`);
      console.log(`   Status: ${sub.status || 'N/A'}`);
      console.log(`   Hidden: ${sub.hidden || sub.isHidden || false}`);
      console.log(`   Deleted: ${sub.isDeleted || false}`);
      
      // Check filters
      const inCourse = courseIds.includes(sub.courseId);
      const notDeleted = sub.status !== 'deleted';
      const notHidden = !sub.hidden && !sub.isHidden;
      
      console.log(`   ✓ In student's courses? ${inCourse}`);
      console.log(`   ✓ Not deleted status? ${notDeleted}`);
      console.log(`   ✓ Not hidden? ${notHidden}`);
      
      if (inCourse && notDeleted && notHidden) {
        console.log('   ✅ WOULD BE INCLUDED IN FEED');
        includedCount++;
      } else {
        console.log('   ❌ EXCLUDED FROM FEED');
        if (!inCourse) console.log('      → Course mismatch');
        if (!notDeleted) console.log('      → Status is deleted');
        if (!notHidden) console.log('      → Hidden flag is true');
        excludedCount++;
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total submissions: ${submissions.length}`);
    console.log(`   ✅ Would be included: ${includedCount}`);
    console.log(`   ❌ Would be excluded: ${excludedCount}`);
    
    if (includedCount === 0) {
      console.log('\n⚠️  NO VIDEOS WILL APPEAR IN FEED!');
      console.log('\nPossible reasons:');
      console.log('  1. Videos are in courses student is not enrolled in');
      console.log('  2. Videos have status="deleted"');
      console.log('  3. Videos have hidden=true');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFeedVideos();

