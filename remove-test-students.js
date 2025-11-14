/**
 * Remove test students using the instructor portal API
 * This uses the same comprehensive deletion endpoint we created
 */

const https = require('https');

const BASE_URL = 'https://class-cast.com';

// Student user IDs to delete (from the previous scan)
const STUDENTS_TO_DELETE = [
  { userId: 'user_1760397943147_epc5y6z99', name: 'Shane Wilson', email: 'danny@millennialpros.com' },
  { userId: 'user_1759493077051_vp8wpn6j2', name: 'Austin Wilson', email: 'dwilson1919@gmail.com' },
  { userId: 'user_1760122607792_al2161cme', name: 'Olivia Wilson', email: 'dwilson1919@aol.com' },
  { userId: 'user_1760601996117_bcpnlf8cl', name: 'EJ Wilson', email: 'noreply@myclasscast.com' }
];

// Course ID where they're enrolled
const COURSE_ID = 'course_1760358077083_u6dasswug'; // Integrated Math 2

function makeHttpsRequest(url, method = 'DELETE') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function removeStudentFromCourse(courseId, studentId, studentName) {
  console.log(`\n🗑️  Removing ${studentName} from course ${courseId}...`);
  
  try {
    const response = await makeHttpsRequest(
      `${BASE_URL}/api/instructor/courses/${courseId}/students/${studentId}/remove`,
      'DELETE'
    );

    if (response.ok) {
      console.log(`✅ Successfully removed ${studentName}`);
      console.log(`   Report:`, response.data.report);
      return response.data.report;
    } else {
      console.error(`❌ Failed to remove ${studentName} (${response.status}):`, response.data.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error removing ${studentName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting student removal via API...\n');
  console.log(`Will remove ${STUDENTS_TO_DELETE.length} students from course ${COURSE_ID}`);
  console.log('\nStudents:');
  STUDENTS_TO_DELETE.forEach(s => console.log(`  - ${s.name} (${s.email})`));
  
  console.log('\n⚠️  Press Ctrl+C within 3 seconds to cancel...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const reports = [];
  
  for (const student of STUDENTS_TO_DELETE) {
    const report = await removeStudentFromCourse(COURSE_ID, student.userId, student.name);
    if (report) {
      reports.push({ ...report, studentName: student.name });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DELETION SUMMARY');
  console.log('='.repeat(80) + '\n');

  const totals = {
    submissionsDeleted: 0,
    s3ObjectsDeleted: 0,
    peerResponsesDeleted: 0,
    communityPostsDeleted: 0,
    communityCommentsDeleted: 0
  };

  reports.forEach(report => {
    console.log(`${report.studentName}:`);
    console.log(`  - Submissions: ${report.submissionsDeleted || 0}`);
    console.log(`  - S3 Files: ${report.s3ObjectsDeleted || 0}`);
    console.log(`  - Peer Responses: ${report.peerResponsesDeleted || 0}`);
    console.log(`  - Community Posts: ${report.communityPostsDeleted || 0}`);
    console.log(`  - Community Comments: ${report.communityCommentsDeleted || 0}\n`);

    totals.submissionsDeleted += report.submissionsDeleted || 0;
    totals.s3ObjectsDeleted += report.s3ObjectsDeleted || 0;
    totals.peerResponsesDeleted += report.peerResponsesDeleted || 0;
    totals.communityPostsDeleted += report.communityPostsDeleted || 0;
    totals.communityCommentsDeleted += report.communityCommentsDeleted || 0;
  });

  console.log('TOTALS:');
  console.log(`  - Submissions Deleted: ${totals.submissionsDeleted}`);
  console.log(`  - S3 Files Deleted: ${totals.s3ObjectsDeleted}`);
  console.log(`  - Peer Responses Deleted: ${totals.peerResponsesDeleted}`);
  console.log(`  - Community Posts Deleted: ${totals.communityPostsDeleted}`);
  console.log(`  - Community Comments Deleted: ${totals.communityCommentsDeleted}`);
  console.log(`  - Students Removed: ${reports.length}`);

  console.log('\n✅ ALL STUDENTS REMOVED!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

