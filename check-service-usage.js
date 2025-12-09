const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListBucketsCommand, GetBucketLocationCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { LambdaClient, ListFunctionsCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { CognitoIdentityProviderClient, ListUserPoolsCommand, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

const region = process.env.REGION || 'us-east-1';

const cloudwatch = new CloudWatchClient({ region });
const dynamodb = new DynamoDBClient({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const cognito = new CognitoIdentityProviderClient({ region });

async function getMetrics(namespace, metricName, dimensions, stat = 'Sum') {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  try {
    const command = new GetMetricStatisticsCommand({
      Namespace: namespace,
      MetricName: metricName,
      Dimensions: dimensions,
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400, // 1 day
      Statistics: [stat],
    });

    const response = await cloudwatch.send(command);
    const total = response.Datapoints?.reduce((sum, dp) => sum + (dp[stat] || 0), 0) || 0;
    return total;
  } catch (error) {
    return 0;
  }
}

async function checkDynamoDB() {
  console.log('\n📊 DynamoDB Usage:');
  console.log('='.repeat(60));

  try {
    const { TableNames } = await dynamodb.send(new ListTablesCommand({}));
    console.log(`\nTotal Tables: ${TableNames?.length || 0}`);

    for (const tableName of TableNames || []) {
      const { Table } = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
      
      // Get read/write metrics
      const readUnits = await getMetrics('AWS/DynamoDB', 'ConsumedReadCapacityUnits', 
        [{ Name: 'TableName', Value: tableName }]);
      const writeUnits = await getMetrics('AWS/DynamoDB', 'ConsumedWriteCapacityUnits',
        [{ Name: 'TableName', Value: tableName }]);

      console.log(`\n  📋 ${tableName}`);
      console.log(`     Items: ${Table.ItemCount || 0}`);
      console.log(`     Size: ${((Table.TableSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`     Read Units (30d): ${readUnits.toFixed(0)}`);
      console.log(`     Write Units (30d): ${writeUnits.toFixed(0)}`);
      console.log(`     Billing Mode: ${Table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
    }
  } catch (error) {
    console.error('Error checking DynamoDB:', error.message);
  }
}

async function checkS3() {
  console.log('\n\n💾 S3 Storage Usage:');
  console.log('='.repeat(60));

  try {
    const { Buckets } = await s3.send(new ListBucketsCommand({}));
    console.log(`\nTotal Buckets: ${Buckets?.length || 0}`);

    let totalSize = 0;
    let totalObjects = 0;

    for (const bucket of Buckets || []) {
      try {
        // Get bucket size and object count
        const objects = await s3.send(new ListObjectsV2Command({ 
          Bucket: bucket.Name,
          MaxKeys: 1000 
        }));

        const bucketSize = objects.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
        const objectCount = objects.KeyCount || 0;

        totalSize += bucketSize;
        totalObjects += objectCount;

        console.log(`\n  🪣 ${bucket.Name}`);
        console.log(`     Objects: ${objectCount}${objects.IsTruncated ? '+' : ''}`);
        console.log(`     Size: ${(bucketSize / 1024 / 1024 / 1024).toFixed(2)} GB`);

        // Get data transfer metrics
        const bytesDownloaded = await getMetrics('AWS/S3', 'BytesDownloaded',
          [{ Name: 'BucketName', Value: bucket.Name }]);
        const requests = await getMetrics('AWS/S3', 'AllRequests',
          [{ Name: 'BucketName', Value: bucket.Name }]);

        if (bytesDownloaded > 0 || requests > 0) {
          console.log(`     Data Transfer (30d): ${(bytesDownloaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
          console.log(`     Requests (30d): ${requests.toFixed(0)}`);
        }
      } catch (err) {
        console.log(`\n  🪣 ${bucket.Name}: Unable to access`);
      }
    }

    console.log(`\n  📊 Total Storage: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  📊 Total Objects: ${totalObjects}+`);
  } catch (error) {
    console.error('Error checking S3:', error.message);
  }
}

async function checkLambda() {
  console.log('\n\n⚡ Lambda Usage:');
  console.log('='.repeat(60));

  try {
    const { Functions } = await lambda.send(new ListFunctionsCommand({}));
    console.log(`\nTotal Functions: ${Functions?.length || 0}`);

    let totalInvocations = 0;
    let totalDuration = 0;

    for (const func of Functions || []) {
      const invocations = await getMetrics('AWS/Lambda', 'Invocations',
        [{ Name: 'FunctionName', Value: func.FunctionName }]);
      const duration = await getMetrics('AWS/Lambda', 'Duration',
        [{ Name: 'FunctionName', Value: func.FunctionName }], 'Average');
      const errors = await getMetrics('AWS/Lambda', 'Errors',
        [{ Name: 'FunctionName', Value: func.FunctionName }]);

      totalInvocations += invocations;
      totalDuration += duration * invocations;

      if (invocations > 0) {
        console.log(`\n  ⚡ ${func.FunctionName}`);
        console.log(`     Memory: ${func.MemorySize} MB`);
        console.log(`     Invocations (30d): ${invocations.toFixed(0)}`);
        console.log(`     Avg Duration: ${duration.toFixed(0)} ms`);
        console.log(`     Errors: ${errors.toFixed(0)}`);
        console.log(`     GB-seconds: ${((func.MemorySize / 1024) * (duration / 1000) * invocations).toFixed(2)}`);
      }
    }

    console.log(`\n  📊 Total Invocations: ${totalInvocations.toFixed(0)}`);
    console.log(`  📊 Total Compute Time: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
  } catch (error) {
    console.error('Error checking Lambda:', error.message);
  }
}

async function checkCognito() {
  console.log('\n\n👥 Cognito Usage:');
  console.log('='.repeat(60));

  try {
    const { UserPools } = await cognito.send(new ListUserPoolsCommand({ MaxResults: 10 }));
    console.log(`\nTotal User Pools: ${UserPools?.length || 0}`);

    for (const pool of UserPools || []) {
      const details = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: pool.Id }));
      
      console.log(`\n  👥 ${pool.Name}`);
      console.log(`     ID: ${pool.Id}`);
      console.log(`     Status: ${details.UserPool?.Status}`);
      console.log(`     MFA: ${details.UserPool?.MfaConfiguration || 'OFF'}`);
    }
  } catch (error) {
    console.error('Error checking Cognito:', error.message);
  }
}

async function checkAmplify() {
  console.log('\n\n🚀 Amplify Hosting:');
  console.log('='.repeat(60));

  try {
    // Check Amplify data transfer
    const dataTransfer = await getMetrics('AWS/AmplifyHosting', 'BytesDownloaded', []);
    const requests = await getMetrics('AWS/AmplifyHosting', 'Requests', []);

    console.log(`\n  Data Transfer (30d): ${(dataTransfer / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Requests (30d): ${requests.toFixed(0)}`);
  } catch (error) {
    console.log('\n  No Amplify metrics available');
  }
}

async function main() {
  console.log('🔍 AWS Service Usage Analysis');
  console.log('📅 Period: Last 30 days');
  console.log('='.repeat(60));

  await checkDynamoDB();
  await checkS3();
  await checkLambda();
  await checkCognito();
  await checkAmplify();

  console.log('\n\n💡 Cost Optimization Tips:');
  console.log('='.repeat(60));
  console.log('1. Enable DynamoDB on-demand billing for variable workloads');
  console.log('2. Set S3 lifecycle policies to move old videos to Glacier');
  console.log('3. Enable CloudFront caching to reduce S3 requests');
  console.log('4. Use S3 Transfer Acceleration only when needed');
  console.log('5. Monitor Lambda cold starts and optimize memory allocation');
  console.log('6. Consider using YouTube/Google Drive links instead of S3 storage');
}

main().catch(console.error);
