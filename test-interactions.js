// Test script for video interactions API
const testVideoId = 'submission_1761354464846_cneu92q7m'; // From the console errors
const testUserId = 'user_1760812158887_ikixnd8zx'; // From the console errors

async function testInteractions() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing video interactions API...');
  
  try {
    // Test 1: Get interactions (should work now)
    console.log('\n1. Testing GET interactions...');
    const getResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/interactions?type=comment`);
    const getData = await getResponse.json();
    console.log('GET Response:', getResponse.status, getData);
    
    // Test 2: Post a comment (should work now)
    console.log('\n2. Testing POST comment...');
    const postResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comment',
        userId: testUserId,
        userName: 'Test User',
        userAvatar: '/api/placeholder/40/40',
        content: 'Test comment from API test'
      })
    });
    const postData = await postResponse.json();
    console.log('POST Response:', postResponse.status, postData);
    
    // Test 3: Post a rating (should work now)
    console.log('\n3. Testing POST rating...');
    const ratingResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'rating',
        userId: testUserId,
        userName: 'Test User',
        userAvatar: '/api/placeholder/40/40',
        rating: 5,
        contentCreatorId: 'some-creator-id'
      })
    });
    const ratingData = await ratingResponse.json();
    console.log('Rating Response:', ratingResponse.status, ratingData);
    
    // Test 4: Track view (should work now)
    console.log('\n4. Testing POST view tracking...');
    const viewResponse = await fetch(`${baseUrl}/api/videos/${testVideoId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId
      })
    });
    const viewData = await viewResponse.json();
    console.log('View Response:', viewResponse.status, viewData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run if this is the main module
if (require.main === module) {
  testInteractions();
}

module.exports = { testInteractions };