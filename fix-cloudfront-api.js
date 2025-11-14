const { CloudFrontClient, GetDistributionCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });

async function fixCloudFrontAPI() {
  try {
    console.log('🔍 Getting CloudFront distribution configuration...');
    
    // Get current distribution config
    const getDistResponse = await cloudfront.send(new GetDistributionCommand({
      Id: 'EZMZ02WF6QMOM'
    }));
    
    const distribution = getDistResponse.Distribution;
    const config = distribution.DistributionConfig;
    
    console.log('📋 Current behaviors:', config.CacheBehaviors.Quantity);
    
    // Create new behavior for API calls
    const apiBehavior = {
      PathPattern: '/api/*',
      TargetOriginId: 'class-cast.com-mg50smi991r',
      ViewerProtocolPolicy: 'redirect-to-https',
      AllowedMethods: {
        Quantity: 7,
        Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        CachedMethods: {
          Quantity: 2,
          Items: ['HEAD', 'GET']
        }
      },
      Compress: true,
      CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
      OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
      ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03', // CORS-with-preflight
      SmoothStreaming: false,
      FieldLevelEncryptionId: '',
      LambdaFunctionAssociations: {
        Quantity: 0,
        Items: []
      },
      FunctionAssociations: {
        Quantity: 0,
        Items: []
      }
    };
    
    // Add API behavior to existing behaviors
    const newBehaviors = [...(config.CacheBehaviors.Items || []), apiBehavior];
    
    const updateConfig = {
      ...config,
      CacheBehaviors: {
        Quantity: newBehaviors.length,
        Items: newBehaviors
      }
    };
    
    console.log('🚀 Updating CloudFront distribution with API behavior...');
    
    const updateResponse = await cloudfront.send(new UpdateDistributionCommand({
      Id: 'EZMZ02WF6QMOM',
      DistributionConfig: updateConfig,
      IfMatch: getDistResponse.ETag
    }));
    
    console.log('✅ CloudFront distribution updated successfully!');
    console.log('📝 Distribution ID:', updateResponse.Distribution.Id);
    console.log('⏳ Status:', updateResponse.Distribution.Status);
    console.log('🔄 This may take 10-15 minutes to deploy globally');
    
  } catch (error) {
    console.error('❌ Error updating CloudFront:', error);
  }
}

fixCloudFrontAPI();
