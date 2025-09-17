#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';
const TEST_COURSE_ID = 'test-course-456';
const TEST_ASSIGNMENT_ID = 'test-assignment-789';

console.log('🤖 AI Integration Test Suite');
console.log('============================\n');

async function testAIIntegration() {
  const results = {
    tutoring: { status: 'pending', message: '' },
    grading: { status: 'pending', message: '' },
    plagiarism: { status: 'pending', message: '' },
    transcription: { status: 'pending', message: '' },
    recommendations: { status: 'pending', message: '' },
    analytics: { status: 'pending', message: '' },
    overall: 'pending'
  };

  try {
    // 1. Test AI Tutoring Assistant
    console.log('🤖 Testing AI Tutoring Assistant...');
    try {
      const tutoringResponse = await fetch(`${API_BASE_URL}/api/ai/tutoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Can you help me understand calculus derivatives?',
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          context: {
            subject: 'Mathematics',
            difficulty: 'intermediate',
            learningGoals: ['Understand derivatives', 'Solve calculus problems']
          }
        })
      });

      const tutoringData = await tutoringResponse.json();
      if (tutoringData.success) {
        results.tutoring = { status: 'success', message: 'AI tutoring working' };
        console.log('✅ AI Tutoring Assistant working');
      } else {
        throw new Error(tutoringData.error);
      }
    } catch (error) {
      results.tutoring = { status: 'error', message: error.message };
      console.log('❌ AI Tutoring error:', error.message);
    }

    // 2. Test AI Essay Grading
    console.log('\n📝 Testing AI Essay Grading...');
    try {
      const essay = `The importance of education in modern society cannot be overstated. Education serves as the foundation for personal development, economic growth, and social progress. Through education, individuals acquire knowledge, skills, and critical thinking abilities that enable them to contribute meaningfully to their communities and the world at large.`;

      const gradingResponse = await fetch(`${API_BASE_URL}/api/ai/grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay,
          rubric: {
            maxScore: 100,
            criteria: {
              content: { weight: 40, description: 'Quality of ideas and analysis' },
              structure: { weight: 25, description: 'Organization and flow' },
              grammar: { weight: 20, description: 'Grammar and mechanics' },
              style: { weight: 15, description: 'Writing style and clarity' }
            }
          },
          assignmentContext: {
            title: 'Importance of Education Essay',
            instructions: 'Write a comprehensive essay on the importance of education'
          }
        })
      });

      const gradingData = await gradingResponse.json();
      if (gradingData.success) {
        results.grading = { status: 'success', message: `Essay graded: ${gradingData.result.score}/${gradingData.result.maxScore}` };
        console.log('✅ AI Essay Grading working');
      } else {
        throw new Error(gradingData.error);
      }
    } catch (error) {
      results.grading = { status: 'error', message: error.message };
      console.log('❌ AI Grading error:', error.message);
    }

    // 3. Test Plagiarism Detection
    console.log('\n🔍 Testing Plagiarism Detection...');
    try {
      const plagiarismResponse = await fetch(`${API_BASE_URL}/api/ai/plagiarism`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'This is a test essay about the importance of education in society.',
          submissionId: 'test-submission-123',
          assignmentId: TEST_ASSIGNMENT_ID
        })
      });

      const plagiarismData = await plagiarismResponse.json();
      if (plagiarismData.success) {
        results.plagiarism = { status: 'success', message: `Plagiarism check: ${plagiarismData.result.isPlagiarized ? 'Detected' : 'Clean'}` };
        console.log('✅ Plagiarism Detection working');
      } else {
        throw new Error(plagiarismData.error);
      }
    } catch (error) {
      results.plagiarism = { status: 'error', message: error.message };
      console.log('❌ Plagiarism Detection error:', error.message);
    }

    // 4. Test AI Transcription
    console.log('\n🎤 Testing AI Transcription...');
    try {
      const transcriptionResponse = await fetch(`${API_BASE_URL}/api/ai/transcription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: 'https://example.com/test-audio.mp3',
          language: 'en',
          submissionId: 'test-submission-456',
          assignmentId: TEST_ASSIGNMENT_ID
        })
      });

      const transcriptionData = await transcriptionResponse.json();
      if (transcriptionData.success) {
        results.transcription = { status: 'success', message: 'Transcription service working' };
        console.log('✅ AI Transcription working');
      } else {
        throw new Error(transcriptionData.error);
      }
    } catch (error) {
      results.transcription = { status: 'error', message: error.message };
      console.log('❌ AI Transcription error:', error.message);
    }

    // 5. Test Smart Recommendations
    console.log('\n💡 Testing Smart Recommendations...');
    try {
      const recommendationsResponse = await fetch(`${API_BASE_URL}/api/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          type: 'content',
          context: {
            courseId: TEST_COURSE_ID,
            assignmentId: TEST_ASSIGNMENT_ID,
            userProfile: {
              interests: ['mathematics', 'science'],
              learningStyle: 'visual'
            }
          }
        })
      });

      const recommendationsData = await recommendationsResponse.json();
      if (recommendationsData.success) {
        results.recommendations = { status: 'success', message: `Generated ${recommendationsData.result.items.length} recommendations` };
        console.log('✅ Smart Recommendations working');
      } else {
        throw new Error(recommendationsData.error);
      }
    } catch (error) {
      results.recommendations = { status: 'error', message: error.message };
      console.log('❌ Smart Recommendations error:', error.message);
    }

    // 6. Test Predictive Analytics
    console.log('\n📊 Testing Predictive Analytics...');
    try {
      const analyticsResponse = await fetch(`${API_BASE_URL}/api/ai/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentData: {
            userId: TEST_USER_ID,
            courseId: TEST_COURSE_ID,
            assignmentHistory: [
              { assignmentId: 'assign1', grade: 85, completed: true },
              { assignmentId: 'assign2', grade: 92, completed: true },
              { assignmentId: 'assign3', grade: 78, completed: true }
            ],
            engagementMetrics: {
              loginFrequency: 5,
              timeSpent: 120,
              participationRate: 0.8
            }
          }
        })
      });

      const analyticsData = await analyticsResponse.json();
      if (analyticsData.success) {
        results.analytics = { status: 'success', message: `Success probability: ${analyticsData.result.successProbability}%` };
        console.log('✅ Predictive Analytics working');
      } else {
        throw new Error(analyticsData.error);
      }
    } catch (error) {
      results.analytics = { status: 'error', message: error.message };
      console.log('❌ Predictive Analytics error:', error.message);
    }

    // Overall assessment
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const totalTests = Object.keys(results).length - 1;
    
    if (successCount === totalTests) {
      results.overall = 'success';
    } else if (successCount >= totalTests * 0.7) {
      results.overall = 'warning';
    } else {
      results.overall = 'error';
    }

    // Generate report
    console.log('\n📋 AI INTEGRATION TEST REPORT');
    console.log('=============================');
    console.log(`AI Tutoring: ${results.tutoring.status === 'success' ? '✅' : '❌'} ${results.tutoring.message}`);
    console.log(`AI Grading: ${results.grading.status === 'success' ? '✅' : '❌'} ${results.grading.message}`);
    console.log(`Plagiarism Detection: ${results.plagiarism.status === 'success' ? '✅' : '❌'} ${results.plagiarism.message}`);
    console.log(`AI Transcription: ${results.transcription.status === 'success' ? '✅' : '❌'} ${results.transcription.message}`);
    console.log(`Smart Recommendations: ${results.recommendations.status === 'success' ? '✅' : '❌'} ${results.recommendations.message}`);
    console.log(`Predictive Analytics: ${results.analytics.status === 'success' ? '✅' : '❌'} ${results.analytics.message}`);
    console.log(`\nOverall Status: ${results.overall === 'success' ? '🎉 SUCCESS' : results.overall === 'warning' ? '⚠️ WARNING' : '❌ ERROR'}`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        totalTests: totalTests,
        successfulTests: successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`
      }
    };

    require('fs').writeFileSync('ai-integration-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: ai-integration-test-report.json');

    if (results.overall === 'success') {
      console.log('\n🚀 All AI features are working correctly!');
      console.log('Your ClassCast platform now has full AI capabilities!');
    } else {
      console.log('\n⚠️ Some AI features need attention. Check the details above.');
    }

  } catch (error) {
    console.error('\n❌ AI integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAIIntegration();
