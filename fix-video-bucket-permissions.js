const { 
  S3Client, 
  PutBucketCorsCommand, 
  GetBucketCorsCommand,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand 
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });
const VIDEO_BUCKET = 'classcast-videos-463470937777-us-east-1';

async function fixVideoBucketPermissions() {
  try {
    console.log('🔧 Fixing S3 video bucket permissions and CORS...');
    console.log(`📦 Bucket: ${VIDEO_BUCKET}`);
    
    // Step 1: Configure CORS
    console.log('\n📝 Step 1: Configuring CORS...');
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
          AllowedOrigins: [
            'https://class-cast.com',
            'http://localhost:3000',
            'http://localhost:3001'
          ],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
          MaxAgeSeconds: 3000
        }
      ]
    };

    try {
      await s3Client.send(new PutBucketCorsCommand({
        Bucket: VIDEO_BUCKET,
        CORSConfiguration: corsConfiguration
      }));
      console.log('✅ CORS configuration updated successfully!');
    } catch (error) {
      console.error('❌ Error setting CORS:', error.message);
      throw error;
    }

    // Step 2: Configure Bucket Policy for presigned URLs
    console.log('\n📝 Step 2: Configuring bucket policy...');
    
    // Get existing policy if any
    let existingPolicy = null;
    try {
      const getPolicyResponse = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: VIDEO_BUCKET
      }));
      existingPolicy = JSON.parse(getPolicyResponse.Policy);
      console.log('📋 Found existing bucket policy');
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        console.log('📋 No existing bucket policy found, creating new one');
      } else {
        console.warn('⚠️  Error getting existing policy:', error.message);
      }
    }

    // Create policy that allows authenticated access via presigned URLs
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowPresignedURLAccess',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: `arn:aws:s3:::${VIDEO_BUCKET}/*`,
          Condition: {
            StringLike: {
              's3:ExistingObjectTag/AccessLevel': 'public-read'
            }
          }
        }
      ]
    };

    // Note: We don't want fully public access - presigned URLs will handle auth
    // So we'll skip the bucket policy for now and rely on IAM + presigned URLs
    console.log('ℹ️  Skipping bucket policy - relying on presigned URLs for access control');

    // Step 3: Verify configuration
    console.log('\n📝 Step 3: Verifying CORS configuration...');
    try {
      const corsResponse = await s3Client.send(new GetBucketCorsCommand({
        Bucket: VIDEO_BUCKET
      }));
      console.log('✅ CORS rules verified:');
      corsResponse.CORSRules.forEach((rule, index) => {
        console.log(`  Rule ${index + 1}:`);
        console.log(`    - Methods: ${rule.AllowedMethods.join(', ')}`);
        console.log(`    - Origins: ${rule.AllowedOrigins.join(', ')}`);
        console.log(`    - Headers: ${rule.AllowedHeaders.join(', ')}`);
      });
    } catch (error) {
      console.error('❌ Error verifying CORS:', error.message);
    }

    console.log('\n✅ Video bucket permissions fixed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✓ CORS configured for video playback');
    console.log('  ✓ Presigned URLs will provide authenticated access');
    console.log('  ✓ Origins: class-cast.com and localhost');
    console.log('\n💡 Videos should now play correctly with signed URLs!');

  } catch (error) {
    console.error('\n❌ Error fixing video bucket permissions:', error);
    console.error('Error details:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Ensure you have AWS credentials configured');
    console.error('  2. Verify you have S3 permissions (s3:PutBucketCors, s3:PutBucketPolicy)');
    console.error('  3. Check that the bucket name is correct');
    process.exit(1);
  }
}

// Run the fix
fixVideoBucketPermissions();

