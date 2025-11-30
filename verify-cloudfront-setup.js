const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { S3Client, GetBucketPolicyCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
const s3 = new S3Client({ region: 'us-east-1' });

const AMPLIFY_CLOUDFRONT = 'dt7gqfihc5ffq.cloudfront.net';
const S3_BUCKET = 'classcast-videos-463470937777-us-east-1';

async function verifySetup() {
  try {
    console.log('🔍 Verifying CloudFront and S3 setup...\n');
    
    // Step 1: Find the CloudFront distribution
    console.log('1️⃣  Searching for CloudFront distribution:', AMPLIFY_CLOUDFRONT);
    const listResponse = await cloudfront.send(new ListDistributionsCommand({}));
    
    let targetDistribution = null;
    if (listResponse.DistributionList && listResponse.DistributionList.Items) {
      targetDistribution = listResponse.DistributionList.Items.find(dist => 
        dist.DomainName === AMPLIFY_CLOUDFRONT
      );
    }
    
    if (!targetDistribution) {
      console.log('❌ CloudFront distribution NOT FOUND!');
      console.log('   This means the distribution you deleted was the Amplify one.');
      console.log('   Amplify will recreate it automatically, but it may take time.\n');
      
      console.log('📋 Current distributions:');
      if (listResponse.DistributionList && listResponse.DistributionList.Items) {
        listResponse.DistributionList.Items.forEach(dist => {
          console.log(`   - ${dist.DomainName} (${dist.Status})`);
        });
      } else {
        console.log('   No distributions found.');
      }
      
      console.log('\n⚠️  RECOMMENDATION:');
      console.log('   Wait for Amplify to recreate the CloudFront distribution.');
      console.log('   This happens automatically when you redeploy your app.');
      console.log('   In the meantime, your app will use direct S3 URLs (slower but functional).');
      return;
    }
    
    console.log('✅ Found distribution:', targetDistribution.Id);
    console.log('   Status:', targetDistribution.Status);
    console.log('   Enabled:', targetDistribution.Enabled);
    
    // Step 2: Get detailed distribution config
    console.log('\n2️⃣  Checking distribution configuration...');
    const distResponse = await cloudfront.send(new GetDistributionCommand({
      Id: targetDistribution.Id
    }));
    
    const config = distResponse.Distribution.DistributionConfig;
    
    console.log('   Origins:', config.Origins.Quantity);
    config.Origins.Items.forEach((origin, index) => {
      console.log(`   ${index + 1}. ${origin.Id}`);
      console.log(`      Domain: ${origin.DomainName}`);
      console.log(`      Type: ${origin.S3OriginConfig ? 'S3' : 'Custom'}`);
    });
    
    // Check if S3 bucket is an origin
    const s3Origin = config.Origins.Items.find(origin => 
      origin.DomainName.includes(S3_BUCKET)
    );
    
    if (s3Origin) {
      console.log('\n✅ S3 bucket IS configured as a CloudFront origin!');
      console.log('   Your S3 files will be served through CloudFront.');
    } else {
      console.log('\n⚠️  S3 bucket is NOT a CloudFront origin.');
      console.log('   CloudFront is only serving your Amplify app, not S3 assets.');
      console.log('   You may need to add S3 as an origin or use direct S3 URLs.');
    }
    
    // Step 3: Check S3 bucket configuration
    console.log('\n3️⃣  Checking S3 bucket configuration...');
    
    try {
      const corsResponse = await s3.send(new GetBucketCorsCommand({
        Bucket: S3_BUCKET
      }));
      
      console.log('✅ S3 CORS configured');
      console.log('   Rules:', corsResponse.CORSRules.length);
      corsResponse.CORSRules.forEach((rule, index) => {
        console.log(`   ${index + 1}. Allowed Origins:`, rule.AllowedOrigins.join(', '));
        console.log(`      Allowed Methods:`, rule.AllowedMethods.join(', '));
      });
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('⚠️  No CORS configuration found on S3 bucket');
      } else {
        console.log('❌ Error checking CORS:', error.message);
      }
    }
    
    // Step 4: Check if bucket is public or private
    try {
      const policyResponse = await s3.send(new GetBucketPolicyCommand({
        Bucket: S3_BUCKET
      }));
      console.log('\n✅ S3 bucket has a policy (likely public or CloudFront access)');
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        console.log('\n⚠️  S3 bucket has no policy (private bucket)');
        console.log('   Files can only be accessed via presigned URLs or CloudFront OAI');
      }
    }
    
    // Step 5: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    if (targetDistribution.Status === 'Deployed') {
      console.log('✅ CloudFront distribution is ACTIVE and DEPLOYED');
    } else {
      console.log('⏳ CloudFront distribution is still deploying...');
      console.log('   Status:', targetDistribution.Status);
    }
    
    if (s3Origin) {
      console.log('✅ S3 assets WILL be served through CloudFront');
      console.log('   Using: CLOUDFRONT_DOMAIN=class-cast.com');
    } else {
      console.log('⚠️  S3 assets will use DIRECT S3 URLs');
      console.log('   CloudFront is only for your Next.js app, not S3 files');
      console.log('\n💡 RECOMMENDATION:');
      console.log('   Option 1: Use direct S3 URLs (current setup)');
      console.log('   Option 2: Create a separate CloudFront distribution for S3');
      console.log('   Option 3: Add S3 as an origin to Amplify\'s CloudFront');
    }
    
    console.log('\n📝 Current .env.local setting:');
    console.log('   CLOUDFRONT_DOMAIN=class-cast.com');
    
    if (!s3Origin) {
      console.log('\n⚠️  This setting may not work as expected!');
      console.log('   Your S3 files are at: classcast-videos-463470937777-us-east-1.s3.amazonaws.com');
      console.log('   But class-cast.com points to your Amplify app, not S3.');
      console.log('\n   Recommendation: Remove CLOUDFRONT_DOMAIN or set it to empty');
      console.log('   This will use direct S3 URLs which are reliable.');
    }

  } catch (error) {
    console.error('❌ Error verifying setup:', error);
  }
}

verifySetup();
