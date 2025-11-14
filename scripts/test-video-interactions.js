const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const VIDEOS_TABLE = 'classcast-videos';
const INTERACTIONS_TABLE = 'classcast-video-interactions';

async function testVideoAPI() {
  console.log('🧪 Testing Video API...');
  
  try {
    // Test fetching videos
    const videosResponse = await fetch('http://localhost:3000/api/videos');
    if (!videosResponse.ok) {
      throw new Error(`Videos API returned ${videosResponse.status}`);
    }
    
    const videosData = await videosResponse.json();
    console.log(`✅ Videos API working - Found ${videosData.videos?.length || 0} videos`);
    
    if (videosData.videos && videosData.videos.length > 0) {
      const firstVideo = videosData.videos[0];
      console.log(`   Sample video: "${firstVideo.title}" by ${firstVideo.userName}`);
    }
    
    return videosData.videos || [];
  } catch (error) {
    console.log(`❌ Videos API test failed: ${error.message}`);
    console.log('   Make sure your Next.js server is running (npm run dev)');
    return [];
  }
}

async function testVideoInteractionsAPI(videoId) {
  console.log(`🧪 Testing Video Interactions API for video ${videoId}...`);
  
  try {
    // Test fetching interactions
    const interactionsResponse = await fetch(`http://localhost:3000/api/videos/${videoId}/interactions`);
    if (!interactionsResponse.ok) {
      throw new Error(`Interactions API returned ${interactionsResponse.status}`);
    }
    
    const interactionsData = await interactionsResponse.json();
    console.log(`✅ Interactions API working - Found ${interactionsData.interactions?.length || 0} interactions`);
    
    // Count different types of interactions
    const interactions = interactionsData.interactions || [];
    const likes = interactions.filter(i => i.type === 'like' && !i.deleted).length;
    const comments = interactions.filter(i => i.type === 'comment' && !i.deleted).length;
    const ratings = interactions.filter(i => i.type === 'rating' && !i.deleted).length;
    
    console.log(`   📊 Interaction breakdown:`);
    console.log(`      - Likes: ${likes}`);
    console.log(`      - Comments: ${comments}`);
    console.log(`      - Ratings: ${ratings}`);
    
    return interactions;
  } catch (error) {
    console.log(`❌ Interactions API test failed: ${error.message}`);
    return [];
  }
}

async function testLikeFunctionality(videoId) {
  console.log(`🧪 Testing Like Functionality for video ${videoId}...`);
  
  try {
    // Test liking a video
    const likeResponse = await fetch(`http://localhost:3000/api/videos/${videoId}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'like',
        userId: 'test-user-123',
        userName: 'Test User',
        userAvatar: '/api/placeholder/40/40'
      }),
    });
    
    if (!likeResponse.ok) {
      throw new Error(`Like API returned ${likeResponse.status}`);
    }
    
    const likeData = await likeResponse.json();
    console.log(`✅ Like functionality working - Created like: ${likeData.interaction?.id}`);
    
    // Test unliking the video
    const unlikeResponse = await fetch(`http://localhost:3000/api/videos/${videoId}/interactions?userId=test-user-123&type=like`, {
      method: 'DELETE',
    });
    
    if (!unlikeResponse.ok) {
      throw new Error(`Unlike API returned ${unlikeResponse.status}`);
    }
    
    const unlikeData = await unlikeResponse.json();
    console.log(`✅ Unlike functionality working - Removed like`);
    
    return true;
  } catch (error) {
    console.log(`❌ Like functionality test failed: ${error.message}`);
    return false;
  }
}

async function testCommentFunctionality(videoId) {
  console.log(`🧪 Testing Comment Functionality for video ${videoId}...`);
  
  try {
    // Test adding a comment
    const commentResponse = await fetch(`http://localhost:3000/api/videos/${videoId}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'comment',
        userId: 'test-user-123',
        userName: 'Test User',
        userAvatar: '/api/placeholder/40/40',
        content: 'This is a test comment from the automated test!'
      }),
    });
    
    if (!commentResponse.ok) {
      throw new Error(`Comment API returned ${commentResponse.status}`);
    }
    
    const commentData = await commentResponse.json();
    console.log(`✅ Comment functionality working - Created comment: ${commentData.interaction?.id}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Comment functionality test failed: ${error.message}`);
    return false;
  }
}

async function testRatingFunctionality(videoId, contentCreatorId) {
  console.log(`🧪 Testing Rating Functionality for video ${videoId}...`);
  
  try {
    // Test adding a rating
    const ratingResponse = await fetch(`http://localhost:3000/api/videos/${videoId}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'rating',
        userId: 'test-user-123',
        userName: 'Test User',
        userAvatar: '/api/placeholder/40/40',
        contentCreatorId: contentCreatorId,
        rating: 5,
        comment: 'Excellent content! This is a test rating.'
      }),
    });
    
    if (!ratingResponse.ok) {
      throw new Error(`Rating API returned ${ratingResponse.status}`);
    }
    
    const ratingData = await ratingResponse.json();
    console.log(`✅ Rating functionality working - Created rating: ${ratingData.interaction?.id}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Rating functionality test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseData() {
  console.log('🧪 Testing Database Data...');
  
  try {
    // Test videos table
    const videosResult = await docClient.send(new ScanCommand({
      TableName: VIDEOS_TABLE,
      Limit: 5
    }));
    
    console.log(`✅ Videos table accessible - Found ${videosResult.Items?.length || 0} videos`);
    
    // Test interactions table
    const interactionsResult = await docClient.send(new ScanCommand({
      TableName: INTERACTIONS_TABLE,
      Limit: 10
    }));
    
    console.log(`✅ Interactions table accessible - Found ${interactionsResult.Items?.length || 0} interactions`);
    
    // Show sample data
    if (videosResult.Items && videosResult.Items.length > 0) {
      const sampleVideo = videosResult.Items[0];
      console.log(`   Sample video: "${sampleVideo.title}" (${sampleVideo.stats?.likes || 0} likes, ${sampleVideo.stats?.comments || 0} comments)`);
    }
    
    return {
      videos: videosResult.Items || [],
      interactions: interactionsResult.Items || []
    };
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return { videos: [], interactions: [] };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Video Interactions Test Suite');
  console.log('==========================================');
  
  let allTestsPassed = true;
  
  // Test 1: Database Data
  const dbData = await testDatabaseData();
  console.log('');
  
  // Test 2: Video API
  const videos = await testVideoAPI();
  console.log('');
  
  if (videos.length === 0) {
    console.log('⚠️  No videos found. Please run the setup script first:');
    console.log('   ./scripts/setup-video-interactions.sh');
    allTestsPassed = false;
  } else {
    const testVideo = videos[0];
    
    // Test 3: Video Interactions API
    await testVideoInteractionsAPI(testVideo.id);
    console.log('');
    
    // Test 4: Like Functionality
    const likeTest = await testLikeFunctionality(testVideo.id);
    if (!likeTest) allTestsPassed = false;
    console.log('');
    
    // Test 5: Comment Functionality
    const commentTest = await testCommentFunctionality(testVideo.id);
    if (!commentTest) allTestsPassed = false;
    console.log('');
    
    // Test 6: Rating Functionality
    const ratingTest = await testRatingFunctionality(testVideo.id, testVideo.userId);
    if (!ratingTest) allTestsPassed = false;
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  
  if (allTestsPassed) {
    console.log('✅ All tests passed! Video interactions are working correctly.');
    console.log('');
    console.log('🎬 You can now:');
    console.log('   • View videos in the student dashboard');
    console.log('   • Like and unlike videos');
    console.log('   • Add comments to videos');
    console.log('   • Rate content creators');
    console.log('   • See real-time interaction counts');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure your Next.js server is running: npm run dev');
    console.log('   2. Make sure the database tables exist: ./scripts/setup-video-interactions.sh');
    console.log('   3. Check your AWS credentials and region settings');
  }
  
  console.log('');
  console.log('🎉 Test suite completed!');
}

// Run the tests
runAllTests().catch(console.error);
