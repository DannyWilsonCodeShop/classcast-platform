const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();

const API_ID = '785t4qadp8';

async function fixOptionsIntegrations() {
  try {
    console.log('🔧 Fixing OPTIONS method integrations...');

    // Get all resources
    const resources = await apigateway.getResources({ restApiId: API_ID }).promise();
    
    // Fix OPTIONS methods that have no integration
    const resourcesToFix = [
      { id: 'h0ea6o', path: '/moderation/text' },
      { id: 'wxuqmw', path: '/moderation/video' },
      { id: 'yuazgv', path: '/moderation/submission' }
    ];

    for (const resource of resourcesToFix) {
      console.log(`\n🔧 Fixing ${resource.path} OPTIONS method...`);
      
      try {
        // Check current OPTIONS method
        const currentMethod = await apigateway.getMethod({
          restApiId: API_ID,
          resourceId: resource.id,
          httpMethod: 'OPTIONS'
        }).promise();
        
        console.log(`  Current integration type: ${currentMethod.methodIntegration?.type || 'NONE'}`);
        
        // Fix the integration
        await apigateway.putIntegration({
          restApiId: API_ID,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          type: 'MOCK',
          requestTemplates: {
            'application/json': '{"statusCode": 200}'
          }
        }).promise();
        console.log(`  ✅ Fixed OPTIONS integration for ${resource.path}`);

        // Add method response
        await apigateway.putMethodResponse({
          restApiId: API_ID,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true
          }
        }).promise();
        console.log(`  ✅ Added OPTIONS method response for ${resource.path}`);

        // Add integration response
        await apigateway.putIntegrationResponse({
          restApiId: API_ID,
          resourceId: resource.id,
          httpMethod: 'OPTIONS',
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'"
          }
        }).promise();
        console.log(`  ✅ Added OPTIONS integration response for ${resource.path}`);

      } catch (error) {
        if (error.code === 'ConflictException') {
          console.log(`  ⚠️ OPTIONS method already exists for ${resource.path}`);
        } else {
          console.log(`  ❌ Error fixing ${resource.path}: ${error.message}`);
        }
      }
    }

    // Fix root and moderation MOCK integrations
    console.log('\n🔧 Fixing MOCK integrations...');
    
    // Fix root resource
    try {
      await apigateway.putIntegrationResponse({
        restApiId: API_ID,
        resourceId: '66p844whrh',
        httpMethod: 'GET',
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"message": "ClassCast API", "version": "1.0"}'
        }
      }).promise();
      console.log('  ✅ Fixed root resource integration response');
    } catch (error) {
      console.log('  ⚠️ Root resource integration response already exists');
    }

    // Fix moderation resource
    try {
      await apigateway.putIntegrationResponse({
        restApiId: API_ID,
        resourceId: 'sen5na',
        httpMethod: 'GET',
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"message": "Content Moderation API", "endpoints": ["/moderation/text", "/moderation/video", "/moderation/submission"]}'
        }
      }).promise();
      console.log('  ✅ Fixed moderation resource integration response');
    } catch (error) {
      console.log('  ⚠️ Moderation resource integration response already exists');
    }

    // Now try to deploy
    console.log('\n🚀 Attempting to deploy API...');
    try {
      const deployment = await apigateway.createDeployment({
        restApiId: API_ID,
        stageName: 'prod',
        description: 'Content moderation deployment - fixed OPTIONS integrations'
      }).promise();
      
      console.log('✅ API deployment successful!');
      console.log('📋 Deployment ID:', deployment.id);
      console.log('🔗 Base URL:', `https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod`);
      
    } catch (deployError) {
      console.log('❌ Deployment failed:', deployError.message);
    }

  } catch (error) {
    console.error('❌ Error fixing OPTIONS integrations:', error);
  }
}

// Run the fix
fixOptionsIntegrations();
