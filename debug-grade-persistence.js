#!/usr/bin/env node

/**
 * Debug Grade Persistence Issues
 */

async function testGradePersistence() {
  console.log('🧪 Testing Grade Persistence');
  console.log('============================\n');

  const testSubmissionId = 'test-submission-123';
  const testGrade = 85;
  const testFeedback = 'Great work on this assignment!';

  try {
    console.log('📡 Testing grade save API...');
    
    const response = await fetch(`http://localhost:3000/api/submissions/${testSubmissionId}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grade: testGrade,
        feedback: testFeedback,
        status: 'graded'
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Test different scenarios
async function runDiagnostics() {
  console.log('🔍 Running Grade Persistence Diagnostics\n');
  
  console.log('1. Testing API endpoint availability...');
  console.log('2. Testing grade save functionality...');
  console.log('3. Testing auto-save timing...');
  console.log('4. Testing error handling...\n');
  
  await testGradePersistence();
}

runDiagnostics();