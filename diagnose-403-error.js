#!/usr/bin/env node

/**
 * Diagnose 403 CloudFront Error
 * 
 * This script helps diagnose the CloudFront 403 error when updating assignments
 */

async function diagnose403Error() {
  console.log('🔍 Diagnosing CloudFront 403 Error...\n');
  
  const assignmentId = 'assignment_1768361755173_ti155u2nf'; // From your error
  const baseUrl = 'https://class-cast.com';
  const localUrl = 'http://localhost:3000';
  
  console.log('📋 Testing Assignment API Endpoints:\n');
  
  // Test 1: Check if the assignment exists via GET
  console.log('1️⃣ Testing GET assignment (should work)...');
  try {
    const getResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClassCast-Diagnostic/1.0'
      }
    });
    
    console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(getResponse.headers.entries()), null, 2)}`);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log(`   ✅ Assignment found: "${data.data?.assignment?.title}"`);
    } else {
      const errorText = await getResponse.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
  
  console.log('\n2️⃣ Testing PUT assignment (the failing request)...');
  try {
    const putResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClassCast-Diagnostic/1.0'
      },
      body: JSON.stringify({
        title: 'Test Update',
        description: 'Diagnostic test update'
      })
    });
    
    console.log(`   Status: ${putResponse.status} ${putResponse.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(putResponse.headers.entries()), null, 2)}`);
    
    if (putResponse.ok) {
      console.log(`   ✅ PUT request succeeded`);
    } else {
      const errorText = await putResponse.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 500)}...`);
      
      // Check if it's a CloudFront error
      if (errorText.includes('CloudFront') || errorText.includes('403 ERROR')) {
        console.log('\n🚨 CLOUDFRONT 403 ERROR DETECTED!');
        console.log('This suggests:');
        console.log('• CloudFront is blocking PUT requests to /api/assignments/*');
        console.log('• The API Gateway might not be configured to handle PUT methods');
        console.log('• There might be a WAF rule blocking the request');
        console.log('• The CloudFront behavior might not be forwarding PUT requests correctly');
      }
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
  
  console.log('\n3️⃣ Testing OPTIONS request (CORS preflight)...');
  try {
    const optionsResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClassCast-Diagnostic/1.0'
      }
    });
    
    console.log(`   Status: ${optionsResponse.status} ${optionsResponse.statusText}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Methods: ${optionsResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`     Access-Control-Allow-Headers: ${optionsResponse.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`     Access-Control-Allow-Origin: ${optionsResponse.headers.get('Access-Control-Allow-Origin')}`);
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
  
  console.log('\n4️⃣ Testing local development server (if running)...');
  try {
    const localResponse = await fetch(`${localUrl}/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Local Test Update',
        description: 'Local diagnostic test update'
      })
    });
    
    console.log(`   Status: ${localResponse.status} ${localResponse.statusText}`);
    
    if (localResponse.ok) {
      console.log(`   ✅ Local PUT request works - issue is with CloudFront/production`);
    } else {
      console.log(`   ❌ Local PUT also fails - issue might be in the API code`);
    }
  } catch (error) {
    console.log(`   ℹ️ Local server not running or not accessible`);
  }
  
  console.log('\n📊 Diagnosis Summary:');
  console.log('If you see a CloudFront 403 error above, the issue is likely:');
  console.log('');
  console.log('🔧 Possible Solutions:');
  console.log('1. Check CloudFront distribution settings');
  console.log('2. Verify API Gateway allows PUT method for /api/assignments/*');
  console.log('3. Check if there are WAF rules blocking PUT requests');
  console.log('4. Ensure CloudFront behavior forwards all HTTP methods');
  console.log('5. Clear CloudFront cache for /api/* paths');
  console.log('');
  console.log('🚀 Quick Fix Options:');
  console.log('• Use PATCH instead of PUT (if supported)');
  console.log('• Use POST with action parameter');
  console.log('• Bypass CloudFront for API calls (use API Gateway directly)');
}

if (require.main === module) {
  diagnose403Error().catch(console.error);
}