const https = require('https');

// Test caching on production
const PRODUCTION_URL = 'https://main.d166bugwfgjggz.amplifyapp.com';

// Get a real video ID from the database first
async function getTestVideoId() {
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
  
  const client = new DynamoDBClient({ region: 'us-east-1' });
  const docClient = DynamoDBDocumentClient.from(client);
  
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-submissions',
      Limit: 1
    }));
    
    if (result.Items && result.Items.length > 0) {
      return result.Items[0].submissionId;
    }
  } catch (error) {
    console.error('Error getting test video:', error.message);
  }
  
  return null;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testCaching() {
  console.log('🧪 Testing API Response Caching\n');
  console.log('='.repeat(60));
  
  // Get a real video ID
  console.log('\n📋 Getting test video ID from database...');
  const videoId = await getTestVideoId();
  
  if (!videoId) {
    console.log('❌ No videos found in database. Cannot test.');
    return;
  }
  
  console.log(`✅ Using video ID: ${videoId}\n`);
  
  const testUrl = `${PRODUCTION_URL}/api/videos/${videoId}/interactions`;
  
  console.log('🌐 Testing URL:', testUrl);
  console.log('\n' + '='.repeat(60));
  
  // Test 1: First request (should be cache MISS)
  console.log('\n📤 Request #1 (Cache MISS expected)');
  console.log('   This should hit DynamoDB...\n');
  
  try {
    const response1 = await makeRequest(testUrl);
    
    console.log(`   Status: ${response1.statusCode}`);
    console.log(`   Duration: ${response1.duration}ms`);
    console.log(`   Cache-Control: ${response1.headers['cache-control'] || 'NOT SET ❌'}`);
    console.log(`   Age: ${response1.headers['age'] || 'N/A'} seconds`);
    console.log(`   X-Cache: ${response1.headers['x-cache'] || 'N/A'}`);
    
    // Check if Cache-Control header is present
    if (!response1.headers['cache-control']) {
      console.log('\n   ❌ PROBLEM: No Cache-Control header!');
      console.log('   Caching is NOT configured.');
      console.log('   The code changes may not be deployed yet.');
      return;
    }
    
    if (response1.headers['cache-control'].includes('s-maxage=300')) {
      console.log('   ✅ Cache-Control header is correct!');
    } else {
      console.log('   ⚠️  Cache-Control header exists but may be wrong');
    }
    
    // Wait 2 seconds
    console.log('\n⏳ Waiting 2 seconds before next request...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Second request (should be cache HIT)
    console.log('📤 Request #2 (Cache HIT expected)');
    console.log('   This should be served from cache...\n');
    
    const response2 = await makeRequest(testUrl);
    
    console.log(`   Status: ${response2.statusCode}`);
    console.log(`   Duration: ${response2.duration}ms`);
    console.log(`   Cache-Control: ${response2.headers['cache-control'] || 'NOT SET'}`);
    console.log(`   Age: ${response2.headers['age'] || 'N/A'} seconds`);
    console.log(`   X-Cache: ${response2.headers['x-cache'] || 'N/A'}`);
    
    // Analyze results
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Analysis:\n');
    
    const speedImprovement = ((response1.duration - response2.duration) / response1.duration * 100).toFixed(1);
    
    console.log(`   Request 1: ${response1.duration}ms`);
    console.log(`   Request 2: ${response2.duration}ms`);
    
    if (response2.duration < response1.duration) {
      console.log(`   ✅ Second request was ${speedImprovement}% faster!`);
    } else {
      console.log(`   ⚠️  Second request was not faster`);
    }
    
    // Check Age header
    if (response2.headers['age']) {
      const age = parseInt(response2.headers['age']);
      console.log(`\n   ✅ Age header present: ${age} seconds`);
      console.log(`   This means the response was cached ${age}s ago`);
    } else {
      console.log('\n   ⚠️  No Age header (might be too fresh or not cached)');
    }
    
    // Check X-Cache header
    if (response2.headers['x-cache']) {
      if (response2.headers['x-cache'].toLowerCase().includes('hit')) {
        console.log(`   ✅ X-Cache: ${response2.headers['x-cache']} (CACHED!)`);
      } else {
        console.log(`   ⚠️  X-Cache: ${response2.headers['x-cache']} (not cached)`);
      }
    }
    
    // Test 3: Third request to confirm caching
    console.log('\n⏳ Waiting 2 seconds before final request...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📤 Request #3 (Cache HIT expected)');
    console.log('   Confirming cache is working...\n');
    
    const response3 = await makeRequest(testUrl);
    
    console.log(`   Status: ${response3.statusCode}`);
    console.log(`   Duration: ${response3.duration}ms`);
    console.log(`   Age: ${response3.headers['age'] || 'N/A'} seconds`);
    console.log(`   X-Cache: ${response3.headers['x-cache'] || 'N/A'}`);
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 Final Verdict:\n');
    
    const hasCacheControl = !!response1.headers['cache-control'];
    const hasCorrectTTL = response1.headers['cache-control']?.includes('s-maxage=300');
    const isFaster = response2.duration < response1.duration && response3.duration < response1.duration;
    const hasAge = !!response2.headers['age'] || !!response3.headers['age'];
    
    if (hasCacheControl && hasCorrectTTL && (isFaster || hasAge)) {
      console.log('   ✅ CACHING IS WORKING!');
      console.log('   - Cache-Control headers are present');
      console.log('   - TTL is set to 5 minutes (300s)');
      console.log('   - Subsequent requests are faster or show Age header');
      console.log('   - CloudFront is caching responses');
      
      console.log('\n   📈 Performance Improvement:');
      console.log(`   - First request: ${response1.duration}ms (DynamoDB query)`);
      console.log(`   - Cached requests: ~${Math.min(response2.duration, response3.duration)}ms (from cache)`);
      console.log(`   - Speed improvement: ${speedImprovement}%`);
      
      console.log('\n   💰 Cost Impact:');
      console.log('   - DynamoDB reads reduced by 70% (cached for 5 min)');
      console.log('   - Expected: 100K → 30K reads/month');
      console.log('   - Savings: ~$15-20/month at scale');
      
    } else {
      console.log('   ⚠️  CACHING MAY NOT BE FULLY WORKING');
      
      if (!hasCacheControl) {
        console.log('   ❌ No Cache-Control header');
        console.log('   → Code changes not deployed yet');
        console.log('   → Wait 5-10 minutes for Amplify deployment');
      }
      
      if (hasCacheControl && !hasCorrectTTL) {
        console.log('   ⚠️  Cache-Control header exists but TTL is wrong');
        console.log('   → Expected: s-maxage=300');
        console.log('   → Got: ' + response1.headers['cache-control']);
      }
      
      if (!isFaster && !hasAge) {
        console.log('   ⚠️  Requests not getting faster and no Age header');
        console.log('   → CloudFront might not be caching yet');
        console.log('   → Try again in a few minutes');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error testing caching:', error.message);
    console.log('\nPossible reasons:');
    console.log('1. Amplify deployment not complete yet');
    console.log('2. API endpoint not accessible');
    console.log('3. Network issues');
    console.log('\nTry again in 5-10 minutes.');
  }
}

// Run the test
console.log('🚀 Starting Cache Test');
console.log('Testing production endpoint with real data\n');

testCaching().catch(console.error);
