const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    console.log('AWS Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('S3 Bucket:', process.env.S3_VIDEOS_BUCKET || 'classcast-videos-463470937777-us-east-1');
    
    const client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const result = await client.send(new ListBucketsCommand({}));
    console.log('S3 Connection successful!');
    console.log('Available buckets:', result.Buckets?.map(b => b.Name));
    
    // Test specific bucket access
    const bucketName = process.env.S3_VIDEOS_BUCKET || 'classcast-videos-463470937777-us-east-1';
    console.log(`Testing access to bucket: ${bucketName}`);
    
    return true;
  } catch (error) {
    console.error('S3 Connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

testS3Connection();
