const https = require('https');

// Danny's user ID
const DANNY_USER_ID = 'user_1760812158887_ikixnd8zx';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          console.log('Raw response:', data);
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

async function testFeedAPI() {
  console.log('🧪 Testing Feed API on dev environment...\n');

  try {
    // Test the feed API
    const feedUrl = `https://development-testing-branch.d166bugwfgjggz.amplifyapp.com/api/student/feed?userId=${DANNY_USER_ID}`;
    console.log(`📡 Calling: ${feedUrl}\n`);

    const response = await makeRequest(feedUrl);

    console.log('📊 API Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('\n✅ API is working!');
      console.log(`\nFeed items: ${response.feed?.length || 0}`);
      console.log(`Courses: ${response.courses?.length || 0}\n`);

      if (response.courses) {
        console.log('📚 Courses:');
        response.courses.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} [${c.initials}] - ${c.code}`);
        });
      }

      if (response.feed && response.feed.length > 0) {
        console.log('\n📱 Feed Items:');
        response.feed.slice(0, 10).forEach((item, i) => {
          console.log(`   ${i + 1}. [${item.type}] ${item.title || 'Untitled'}`);
          if (item.courseInitials) {
            console.log(`      Course: ${item.courseInitials}`);
          }
        });
      }
    } else {
      console.log('❌ API returned error:', response.error);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    throw error;
  }
}

testFeedAPI()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

