const { AmplifyClient, GetJobCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';
const JOB_ID = '161'; // Latest failed job

async function getBuildLogs() {
  try {
    console.log('📋 Fetching Build Logs...\n');
    
    const response = await amplify.send(new GetJobCommand({
      appId: APP_ID,
      branchName: 'main',
      jobId: JOB_ID
    }));

    const job = response.job;
    
    console.log('Job Status:', job.summary.status);
    console.log('Job Type:', job.summary.jobType);
    console.log('Started:', job.summary.startTime);
    console.log('Ended:', job.summary.endTime);
    console.log('\n' + '='.repeat(60));
    console.log('BUILD STEPS:');
    console.log('='.repeat(60));

    job.steps.forEach((step, index) => {
      const emoji = step.status === 'SUCCEED' ? '✅' : 
                   step.status === 'FAILED' ? '❌' : 
                   step.status === 'RUNNING' ? '🔄' : '⏳';
      
      console.log(`\n${index + 1}. ${emoji} ${step.stepName}`);
      console.log(`   Status: ${step.status}`);
      console.log(`   Started: ${step.startTime}`);
      if (step.endTime) {
        console.log(`   Ended: ${step.endTime}`);
      }
      
      if (step.logUrl) {
        console.log(`   Logs: ${step.logUrl}`);
      }
      
      // Show context for failed steps
      if (step.status === 'FAILED' && step.context) {
        console.log(`   Error: ${step.context}`);
      }
    });

    // Find the failed step
    const failedStep = job.steps.find(s => s.status === 'FAILED');
    if (failedStep) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ FAILED STEP:', failedStep.stepName);
      console.log('='.repeat(60));
      console.log('\nTo see full logs:');
      console.log('1. Go to AWS Amplify Console');
      console.log('2. Select your app');
      console.log('3. Click on the failed build');
      console.log('4. View detailed logs');
      console.log('\nOr visit:', failedStep.logUrl);
    }

  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
  }
}

getBuildLogs();
