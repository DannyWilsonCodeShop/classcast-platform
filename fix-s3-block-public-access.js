const { S3Client, PutPublicAccessBlockCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'cdk-hnb659fds-assets-463470937777-us-east-1';

async function fixS3BlockPublicAccess() {
  try {
    console.log('🔧 Checking S3 bucket public access block settings...');
    
    // First, check current settings
    try {
      const getResponse = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: BUCKET_NAME
      }));
      
      console.log('📋 Current public access block settings:');
      console.log('  BlockPublicAcls:', getResponse.PublicAccessBlockConfiguration.BlockPublicAcls);
      console.log('  IgnorePublicAcls:', getResponse.PublicAccessBlockConfiguration.IgnorePublicAcls);
      console.log('  BlockPublicPolicy:', getResponse.PublicAccessBlockConfiguration.BlockPublicPolicy);
      console.log('  RestrictPublicBuckets:', getResponse.PublicAccessBlockConfiguration.RestrictPublicBuckets);
      
      // If all are false, we're good
      if (!getResponse.PublicAccessBlockConfiguration.BlockPublicAcls &&
          !getResponse.PublicAccessBlockConfiguration.IgnorePublicAcls &&
          !getResponse.PublicAccessBlockConfiguration.BlockPublicPolicy &&
          !getResponse.PublicAccessBlockConfiguration.RestrictPublicBuckets) {
        console.log('✅ Public access is already allowed!');
        return;
      }
    } catch (error) {
      if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
        console.log('📋 No public access block configuration found (this is good)');
        return;
      } else {
        console.error('❌ Error getting public access block settings:', error.message);
        return;
      }
    }
    
    console.log('🔓 Disabling public access block settings...');
    
    // Disable all public access block settings
    await s3Client.send(new PutPublicAccessBlockCommand({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }));
    
    console.log('✅ Public access block settings disabled successfully!');
    console.log('💡 You can now set bucket policies for public read access');
    
  } catch (error) {
    console.error('❌ Error fixing S3 block public access:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'AccessDenied') {
      console.log('\n💡 This error suggests you need additional permissions:');
      console.log('   - s3:PutPublicAccessBlock');
      console.log('   - s3:PutBucketPolicy');
      console.log('   - s3:GetBucketPolicy');
      console.log('\n🔧 You may need to run this with elevated permissions or contact your AWS administrator.');
    }
  }
}

// Run the fix
fixS3BlockPublicAccess();
