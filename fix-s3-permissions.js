const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'cdk-hnb659fds-assets-463470937777-us-east-1';

async function fixS3Permissions() {
  try {
    console.log('🔧 Fixing S3 bucket permissions for profile pictures...');
    
    // First, check if there's an existing bucket policy
    let existingPolicy = null;
    try {
      const getPolicyResponse = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: BUCKET_NAME
      }));
      existingPolicy = JSON.parse(getPolicyResponse.Policy);
      console.log('📋 Found existing bucket policy');
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        console.log('📋 No existing bucket policy found');
      } else {
        console.error('❌ Error getting existing policy:', error.message);
      }
    }

    // Create a new policy that allows public read access to profile-pictures folder
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadProfilePictures',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/profile-pictures/*`
        }
      ]
    };

    // If there's an existing policy, merge it
    if (existingPolicy) {
      console.log('🔄 Merging with existing policy...');
      bucketPolicy.Statement = [
        ...existingPolicy.Statement,
        ...bucketPolicy.Statement
      ];
    }

    // Apply the bucket policy
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    }));

    console.log('✅ S3 bucket policy updated successfully!');
    console.log('📝 Policy allows public read access to profile-pictures/*');
    
    // Test the policy by trying to access a profile picture
    console.log('🧪 Testing policy...');
    const testUrl = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/profile-pictures/test.jpg`;
    console.log(`Test URL: ${testUrl}`);
    console.log('💡 You can test this by visiting the URL in your browser');
    
  } catch (error) {
    console.error('❌ Error fixing S3 permissions:', error);
    console.error('Error details:', error.message);
  }
}

// Run the fix
fixS3Permissions();
