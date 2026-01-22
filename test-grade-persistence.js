#!/usr/bin/env node

/**
 * Test Grade Persistence Functionality
 */

async function testGradePersistence() {
  console.log('🧪 Testing Grade Persistence System');
  console.log('==================================\n');

  // Test scenarios
  const testCases = [
    {
      name: 'Valid Grade Save',
      submissionId: 'test-submission-1',
      grade: 85,
      feedback: 'Great work!',
      expectedSuccess: true
    },
    {
      name: 'Grade Only (No Feedback)',
      submissionId: 'test-submission-2', 
      grade: 92,
      feedback: '',
      expectedSuccess: true
    },
    {
      name: 'Feedback Only (No Grade)',
      submissionId: 'test-submission-3',
      grade: null,
      feedback: 'Please revise and resubmit',
      expectedSuccess: true
    },
    {
      name: 'Invalid Grade (Too High)',
      submissionId: 'test-submission-4',
      grade: 150,
      feedback: 'Test feedback',
      expectedSuccess: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    try {
      const body = {};
      if (testCase.grade !== null) body.grade = testCase.grade;
      if (testCase.feedback) body.feedback = testCase.feedback;
      body.status = 'graded';

      const response = await fetch(`http://localhost:3000/api/submissions/${testCase.submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (testCase.expectedSuccess) {
        if (response.ok && data.success) {
          console.log('✅ Test passed');
        } else {
          console.log('❌ Test failed - expected success but got error:', data);
        }
      } else {
        if (!response.ok || !data.success) {
          console.log('✅ Test passed - correctly rejected invalid input');
        } else {
          console.log('❌ Test failed - should have rejected invalid input');
        }
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }
}

testGradePersistence();