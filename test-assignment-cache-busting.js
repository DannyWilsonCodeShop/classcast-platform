const https = require('https');

async function testAssignmentAPI() {
  const assignmentId = 'assignment_1768361755173_ti155u2nf';
  const cacheBuster = Date.now();
  
  console.log('🧪 Testing assignment API with cache busting...\n');
  
  // Test direct assignment API
  console.log('1️⃣ Testing direct assignment API:');
  console.log(`   URL: https://class-cast.com/api/assignments/${assignmentId}?t=${cacheBuster}`);
  
  const options = {
    hostname: 'class-cast.com',
    path: `/api/assignments/${assignmentId}?t=${cacheBuster}`,
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Cache-Control header: ${res.headers['cache-control']}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.success && json.data?.assignment) {
            const assignment = json.data.assignment;
            console.log('\n✅ Assignment data received:');
            console.log(`   Title: ${assignment.title}`);
            console.log(`   Description: ${assignment.description?.substring(0, 50)}...`);
            console.log(`   Resources: ${assignment.resources?.length || 0} items`);
            if (assignment.resources && assignment.resources.length > 0) {
              console.log('\n   📎 Resources:');
              assignment.resources.forEach((resource, i) => {
                console.log(`      ${i + 1}. ${resource.title} (${resource.type})`);
                console.log(`         URL: ${resource.url}`);
              });
            }
            console.log(`\n   Instructional Video: ${assignment.instructionalVideoUrl || 'None'}`);
            console.log(`   Updated At: ${assignment.updatedAt}`);
          } else {
            console.log('❌ Unexpected response format:', json);
          }
          
          resolve();
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.end();
  });
}

testAssignmentAPI().catch(console.error);
