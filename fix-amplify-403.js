const { AmplifyClient, GetAppCommand, UpdateAppCommand, GetBranchCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';

async function fixAmplify403() {
  console.log('🔧 Diagnosing Amplify 403 Error...\n');
  console.log('='.repeat(60));

  try {
    // Get app details
    const appResponse = await amplify.send(new GetAppCommand({
      appId: APP_ID
    }));

    const app = appResponse.app;
    
    console.log('\n📱 App Configuration:');
    console.log('   Name:', app.name);
    console.log('   Platform:', app.platform);
    console.log('   Repository:', app.repository);
    
    // Check branch configuration
    console.log('\n🌿 Checking main branch...');
    const branchResponse = await amplify.send(new GetBranchCommand({
      appId: APP_ID,
      branchName: 'main'
    }));

    const branch = branchResponse.branch;
    console.log('   Branch:', branch.branchName);
    console.log('   Stage:', branch.stage);
    console.log('   Framework:', branch.framework);
    console.log('   Enable Auto Build:', branch.enableAutoBuild);
    
    // Check if there's a custom build spec
    if (app.buildSpec) {
      console.log('\n📋 Custom Build Spec Found');
    }

    // Check environment variables
    console.log('\n🔐 Environment Variables:');
    if (app.environmentVariables) {
      Object.keys(app.environmentVariables).forEach(key => {
        if (!key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY')) {
          console.log(`   ${key}: ${app.environmentVariables[key]}`);
        } else {
          console.log(`   ${key}: ***`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNOSIS');
    console.log('='.repeat(60));

    console.log('\n❌ 403 Error Cause:');
    console.log('   When you deleted the CloudFront distribution, you broke the');
    console.log('   connection between your custom domain and Amplify.');
    
    console.log('\n   The old CloudFront (dt7gqfihc5ffq) no longer exists, but:');
    console.log('   - Your DNS still points to it');
    console.log('   - Amplify thinks the domain is still configured');
    console.log('   - CloudFront returns 403 because origin is unreachable');

    console.log('\n✅ SOLUTION:');
    console.log('\n   Option 1: Remove and Re-add Custom Domain (Recommended)');
    console.log('   This will create a NEW CloudFront distribution');
    console.log('   Steps:');
    console.log('   1. AWS Console → Amplify → Your App → Domain Management');
    console.log('   2. Remove "class-cast.com"');
    console.log('   3. Wait 2 minutes');
    console.log('   4. Add "class-cast.com" again');
    console.log('   5. Amplify will create a NEW CloudFront distribution');
    console.log('   6. Update DNS in GoDaddy with the NEW CloudFront domain');
    
    console.log('\n   Option 2: Use Amplify Default Domain (Temporary)');
    console.log('   Access your app at:');
    console.log('   https://main.d166bugwfgjggz.amplifyapp.com');
    console.log('   (This should work immediately)');

    console.log('\n   Option 3: Point DNS Directly to Amplify (Bypass CloudFront)');
    console.log('   In GoDaddy, change DNS:');
    console.log('   Type: CNAME');
    console.log('   Name: @');
    console.log('   Value: d166bugwfgjggz.amplifyapp.com');
    console.log('   (Not recommended - loses CDN benefits)');

    console.log('\n💡 Why This Happened:');
    console.log('   You deleted the Amplify CloudFront distribution (dt7gqfihc5ffq)');
    console.log('   Amplify doesn\'t automatically recreate it');
    console.log('   You need to manually trigger recreation by removing/re-adding domain');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fixAmplify403();
