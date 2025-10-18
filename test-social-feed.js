const https = require('https');

// Test student user ID (Danny Wilson - dwilson1919@aol.com)
const TEST_USER_ID = 'user_1760122607792_al2161cme';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testSocialFeed() {
  console.log('🧪 Testing Social Media Feed API...\n');

  try {
    const url = `https://class-cast.com/api/student/feed?userId=${TEST_USER_ID}`;
    console.log(`📡 Fetching feed from: ${url}\n`);

    const response = await makeRequest(url);

    if (response.success) {
      console.log('✅ Feed API working!\n');
      
      console.log('=' .repeat(70));
      console.log('📊 FEED SUMMARY:');
      console.log('='.repeat(70));
      console.log(`Total feed items: ${response.feed.length}`);
      console.log(`Total courses: ${response.courses.length}\n`);

      // Group by type
      const videoCount = response.feed.filter(item => item.type === 'video').length;
      const communityCount = response.feed.filter(item => item.type === 'community').length;
      const assignmentCount = response.feed.filter(item => item.type === 'assignment').length;

      console.log('📦 Feed Items by Type:');
      console.log(`   📹 Videos: ${videoCount}`);
      console.log(`   💬 Community Posts: ${communityCount}`);
      console.log(`   📝 Assignments: ${assignmentCount}\n`);

      console.log('📚 Enrolled Courses:');
      response.courses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.name} (${course.code})`);
        console.log(`      Initials: ${course.initials}`);
        console.log(`      Unread: ${course.unreadCount}`);
      });

      console.log('\n' + '='.repeat(70));
      console.log('📱 RECENT FEED ITEMS (Top 5):');
      console.log('='.repeat(70));
      response.feed.slice(0, 5).forEach((item, index) => {
        console.log(`\n${index + 1}. [${item.type.toUpperCase()}] ${item.title || 'Untitled'}`);
        console.log(`   Course: ${item.courseInitials || 'N/A'}`);
        console.log(`   Posted: ${new Date(item.timestamp).toLocaleString()}`);
        if (item.author) {
          console.log(`   By: ${item.author.name}`);
        }
        console.log(`   ❤️ ${item.likes || 0} likes | 💬 ${item.comments || 0} comments`);
      });

      console.log('\n' + '='.repeat(70));
      console.log('✅ TEST PASSED');
      console.log('='.repeat(70));
      console.log('🎉 Social feed is working correctly!');
      console.log('📱 Visit: https://class-cast.com/student/dashboard-new');
      console.log('='.repeat(70));

    } else {
      console.log('❌ API returned error:', response.error);
    }

  } catch (error) {
    console.error('❌ Error testing feed:', error);
    throw error;
  }
}

testSocialFeed()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

