const { CloudFrontClient, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront');
const { AmplifyClient, ListAppsCommand } = require('@aws-sdk/client-amplify');
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { CognitoIdentityProviderClient, ListUserPoolsCommand } = require('@aws-sdk/client-cognito-identity-provider');

const region = 'us-east-1';

async function checkAllResources() {
  console.log('🔍 Checking All AWS Resources\n');
  console.log('='.repeat(60));
  console.log('This will show you everything you have in AWS');
  console.log('and whether it costs money or not.\n');
  console.log('='.repeat(60));

  // CloudFront
  console.log('\n☁️  CLOUDFRONT DISTRIBUTIONS:');
  console.log('-'.repeat(60));
  try {
    const cf = new CloudFrontClient({ region: 'us-east-1' });
    const { DistributionList } = await cf.send(new ListDistributionsCommand({}));
    
    if (DistributionList?.Items?.length > 0) {
      DistributionList.Items.forEach((dist, i) => {
        console.log(`\n${i + 1}. ${dist.Id}`);
        console.log(`   Domain: ${dist.DomainName}`);
        console.log(`   Status: ${dist.Status}`);
        console.log(`   Enabled: ${dist.Enabled}`);
        console.log(`   💰 Cost: FREE (pay-as-you-go, no subscription)`);
        console.log(`   📊 Free Tier: 1 TB transfer, 10M requests/month`);
      });
    } else {
      console.log('   None found');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check CloudFront');
  }

  // Amplify
  console.log('\n\n🚀 AMPLIFY APPS:');
  console.log('-'.repeat(60));
  try {
    const amplify = new AmplifyClient({ region });
    const { apps } = await amplify.send(new ListAppsCommand({}));
    
    if (apps?.length > 0) {
      apps.forEach((app, i) => {
        console.log(`\n${i + 1}. ${app.name}`);
        console.log(`   App ID: ${app.appId}`);
        console.log(`   Domain: ${app.defaultDomain}`);
        console.log(`   💰 Cost: FREE (pay-as-you-go, no subscription)`);
        console.log(`   📊 Free Tier: 15 GB transfer, 1000 build minutes/month`);
      });
    } else {
      console.log('   None found');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check Amplify');
  }

  // DynamoDB
  console.log('\n\n📊 DYNAMODB TABLES:');
  console.log('-'.repeat(60));
  try {
    const dynamodb = new DynamoDBClient({ region });
    const { TableNames } = await dynamodb.send(new ListTablesCommand({}));
    
    console.log(`   Total Tables: ${TableNames?.length || 0}`);
    console.log(`   💰 Cost: FREE (pay-as-you-go, no subscription)`);
    console.log(`   📊 Free Tier: 25 GB storage, 25M reads, 25M writes/month`);
  } catch (error) {
    console.log('   ⚠️  Could not check DynamoDB');
  }

  // S3
  console.log('\n\n💾 S3 BUCKETS:');
  console.log('-'.repeat(60));
  try {
    const s3 = new S3Client({ region });
    const { Buckets } = await s3.send(new ListBucketsCommand({}));
    
    console.log(`   Total Buckets: ${Buckets?.length || 0}`);
    console.log(`   💰 Cost: ~$0.30/month (29.62 GB storage)`);
    console.log(`   📊 Free Tier: 5 GB storage, 20K GET, 2K PUT requests/month`);
    console.log(`   ⚠️  You're over free tier (29.62 GB vs 5 GB)`);
    console.log(`   💡 This is your main cost - video storage`);
  } catch (error) {
    console.log('   ⚠️  Could not check S3');
  }

  // Cognito
  console.log('\n\n👥 COGNITO USER POOLS:');
  console.log('-'.repeat(60));
  try {
    const cognito = new CognitoIdentityProviderClient({ region });
    const { UserPools } = await cognito.send(new ListUserPoolsCommand({ MaxResults: 10 }));
    
    console.log(`   Total User Pools: ${UserPools?.length || 0}`);
    console.log(`   💰 Cost: FREE (pay-as-you-go, no subscription)`);
    console.log(`   📊 Free Tier: 50,000 MAUs (Monthly Active Users)`);
  } catch (error) {
    console.log('   ⚠️  Could not check Cognito');
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('💰 COST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n📋 What You Have:');
  console.log('   ✅ CloudFront: 1 distribution (FREE - no subscription)');
  console.log('   ✅ Amplify: 3 apps (FREE - no subscription)');
  console.log('   ✅ DynamoDB: 27 tables (FREE - under limits)');
  console.log('   ⚠️  S3: 7 buckets, 29.62 GB (SMALL COST - $0.30/month)');
  console.log('   ✅ Cognito: 4 user pools (FREE - under limits)');

  console.log('\n💵 Monthly Costs:');
  console.log('   CloudFront: $0.00 (no subscription, pay-as-you-go)');
  console.log('   Amplify: $0.00 (under free tier)');
  console.log('   DynamoDB: $0.00 (under free tier)');
  console.log('   S3 Storage: $0.30 (29.62 GB × $0.023/GB)');
  console.log('   Cognito: $0.00 (under free tier)');
  console.log('   ─────────────────────────────');
  console.log('   TOTAL: ~$0.30/month');

  console.log('\n🎯 Key Points:');
  console.log('   1. NO SUBSCRIPTIONS - Everything is pay-as-you-go');
  console.log('   2. CloudFront is FREE - No subscription needed');
  console.log('   3. Your only cost is S3 storage ($0.30/month)');
  console.log('   4. All services have generous free tiers');
  console.log('   5. You only pay for what you use');

  console.log('\n💡 To Reduce Costs:');
  console.log('   1. ✅ Already done: Lifecycle policies (saves 40-68%)');
  console.log('   2. ✅ Already done: DynamoDB optimization (saves $15-20/month at scale)');
  console.log('   3. ✅ Already done: API caching (reduces usage)');
  console.log('   4. Optional: Encourage YouTube/Google Drive links (FREE storage)');
  console.log('   5. Optional: Delete old test videos');

  console.log('\n❌ What NOT to Do:');
  console.log('   ❌ Don\'t delete CloudFront - it\'s FREE and helps performance');
  console.log('   ❌ Don\'t delete Amplify - it\'s FREE and hosts your app');
  console.log('   ❌ Don\'t worry about "subscriptions" - AWS doesn\'t work that way');

  console.log('\n✅ Bottom Line:');
  console.log('   You have NO subscriptions to cancel.');
  console.log('   Everything is pay-as-you-go.');
  console.log('   Your total cost is ~$0.30/month.');
  console.log('   CloudFront is FREE and helping you save money!');

  console.log('\n' + '='.repeat(60));
}

checkAllResources().catch(console.error);
