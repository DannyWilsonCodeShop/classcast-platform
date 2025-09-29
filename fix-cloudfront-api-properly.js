const { CloudFrontClient, GetDistributionCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
const DISTRIBUTION_ID = 'EZMZ02WF6QMOM';

async function fixCloudFrontAPI() {
  try {
    console.log('Getting current CloudFront distribution configuration...');
    
    // Get current distribution config
    const getDistResponse = await cloudfront.send(new GetDistributionCommand({
      Id: DISTRIBUTION_ID
    }));
    
    const distribution = getDistResponse.Distribution;
    const config = distribution.DistributionConfig;
    
    console.log('Current cache behaviors:', config.CacheBehaviors.Items.length);
    
    // Check if /api/* behavior exists
    const apiBehavior = config.CacheBehaviors.Items.find(behavior => 
      behavior.PathPattern === '/api/*'
    );
    
    if (apiBehavior) {
      console.log('Found existing /api/* behavior, updating it...');
      
      // Update the existing behavior to ensure it allows all methods and doesn't cache
      apiBehavior.AllowedMethods = {
        Quantity: 7,
        Items: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
        CachedMethods: {
          Quantity: 2,
          Items: ['HEAD', 'GET']
        }
      };
      
      // Remove TTL settings since cache policy is used
      delete apiBehavior.DefaultTTL;
      delete apiBehavior.MaxTTL;
      delete apiBehavior.MinTTL;
      
      // Ensure CORS headers are passed through
      apiBehavior.ResponseHeadersPolicyId = '67f7725c-6f97-4210-82d7-5512b31e9d03';
      
    } else {
      console.log('Creating new /api/* behavior...');
      
      // Create new behavior for /api/*
      const newBehavior = {
        PathPattern: '/api/*',
        TargetOriginId: config.DefaultCacheBehavior.TargetOriginId,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 7,
          Items: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
          CachedMethods: {
            Quantity: 2,
            Items: ['HEAD', 'GET']
          }
        },
        Compress: false,
        ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03',
        TrustedSigners: {
          Enabled: false,
          Quantity: 0
        },
        TrustedKeyGroups: {
          Enabled: false,
          Quantity: 0
        }
      };
      
      config.CacheBehaviors.Items.push(newBehavior);
      config.CacheBehaviors.Quantity = config.CacheBehaviors.Items.length;
    }
    
    // Update the distribution
    console.log('Updating CloudFront distribution...');
    const updateCommand = new UpdateDistributionCommand({
      Id: DISTRIBUTION_ID,
      DistributionConfig: config,
      IfMatch: getDistResponse.ETag
    });
    
    const updateResponse = await cloudfront.send(updateCommand);
    console.log('CloudFront distribution updated successfully!');
    console.log('Distribution ID:', updateResponse.Distribution.Id);
    console.log('Status:', updateResponse.Distribution.Status);
    
    console.log('\n✅ CloudFront configuration updated!');
    console.log('⏰ Changes will take 10-15 minutes to propagate globally');
    console.log('🧪 Test the /api/upload endpoint after propagation');
    
  } catch (error) {
    console.error('Error updating CloudFront:', error);
    if (error.name === 'PreconditionFailed') {
      console.log('\n⚠️  Distribution was modified by another process. Please try again.');
    }
  }
}

fixCloudFrontAPI();
