const { AmplifyClient, GetAppCommand, ListJobsCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';

async function checkDeployment() {
  try {
    console.log('🔍 Checking Amplify Deployment Status...\n');
    console.log('App ID:', APP_ID);
    console.log('='.repeat(60));

    // Get app details
    const appResponse = await amplify.send(new GetAppCommand({
      appId: APP_ID
    }));

    console.log('\n📱 App Details:');
    console.log('   Name:', appResponse.app.name);
    console.log('   Default Domain:', appResponse.app.defaultDomain);
    console.log('   Repository:', appResponse.app.repository || 'N/A');

    // Get recent deployments
    console.log('\n📦 Recent Deployments:');
    const jobsResponse = await amplify.send(new ListJobsCommand({
      appId: APP_ID,
      branchName: 'main',
      maxResults: 5
    }));

    if (jobsResponse.jobSummaries && jobsResponse.jobSummaries.length > 0) {
      jobsResponse.jobSummaries.forEach((job, index) => {
        const status = job.status;
        const emoji = status === 'SUCCEED' ? '✅' : 
                     status === 'FAILED' ? '❌' : 
                     status === 'RUNNING' ? '🔄' : '⏳';
        
        console.log(`\n   ${index + 1}. ${emoji} ${status}`);
        console.log(`      Job ID: ${job.jobId}`);
        console.log(`      Commit: ${job.commitMessage?.substring(0, 60) || 'N/A'}`);
        console.log(`      Started: ${job.startTime}`);
        if (job.endTime) {
          console.log(`      Ended: ${job.endTime}`);
        }
      });

      const latestJob = jobsResponse.jobSummaries[0];
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 CURRENT STATUS');
      console.log('='.repeat(60));
      
      if (latestJob.status === 'SUCCEED') {
        console.log('\n✅ Latest deployment succeeded!');
        console.log('   CloudFront should be working now.');
        console.log('\n💡 Test it:');
        console.log('   node analyze-performance.js');
      } else if (latestJob.status === 'RUNNING') {
        console.log('\n🔄 Deployment in progress...');
        console.log('   This typically takes 5-10 minutes.');
        console.log('\n💡 Check again in a few minutes:');
        console.log('   node check-amplify-deployment.js');
      } else if (latestJob.status === 'FAILED') {
        console.log('\n❌ Latest deployment failed!');
        console.log('   This is why CloudFront shows an error.');
        console.log('\n🔧 To fix:');
        console.log('   1. Check build logs in Amplify Console');
        console.log('   2. Fix any build errors');
        console.log('   3. Push a new commit to trigger rebuild');
      } else {
        console.log('\n⏳ Deployment pending...');
        console.log('   Status:', latestJob.status);
      }

      // Check CloudFront error
      console.log('\n🌐 CloudFront Status:');
      const https = require('https');
      https.get('https://class-cast.com', (res) => {
        const cacheStatus = res.headers['x-cache'];
        if (cacheStatus && cacheStatus.includes('Error')) {
          console.log('   ❌ CloudFront Error:', cacheStatus);
          console.log('   This means CloudFront cannot reach Amplify origin.');
          console.log('\n   Possible causes:');
          console.log('   1. Amplify app is not deployed');
          console.log('   2. Amplify app returned an error');
          console.log('   3. CloudFront cache needs to be invalidated');
          
          if (latestJob.status === 'SUCCEED') {
            console.log('\n   💡 Try invalidating CloudFront cache:');
            console.log('   node invalidate-cloudfront-cache.js');
          }
        } else {
          console.log('   ✅ CloudFront is working correctly');
          console.log('   Cache Status:', cacheStatus);
        }
      });

    } else {
      console.log('   No deployments found');
    }

  } catch (error) {
    console.error('\n❌ Error checking deployment:', error.message);
    
    if (error.name === 'NotFoundException') {
      console.log('\n⚠️  App not found. Check your APP_ID.');
    }
  }
}

checkDeployment();
