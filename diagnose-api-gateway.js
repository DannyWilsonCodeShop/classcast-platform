const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();

const API_ID = '785t4qadp8';

async function diagnoseApiGateway() {
  try {
    console.log('🔍 Diagnosing API Gateway issues...');

    // Get all resources
    const resources = await apigateway.getResources({ restApiId: API_ID }).promise();
    
    console.log('\n📋 All Resources:');
    for (const resource of resources.items) {
      console.log(`\n${resource.path} (${resource.id})`);
      console.log(`  Parent: ${resource.parentId || 'ROOT'}`);
      console.log(`  Methods: ${resource.resourceMethods ? Object.keys(resource.resourceMethods).join(', ') : 'NONE'}`);
      
      if (resource.resourceMethods) {
        for (const [method, methodData] of Object.entries(resource.resourceMethods)) {
          try {
            const methodDetails = await apigateway.getMethod({
              restApiId: API_ID,
              resourceId: resource.id,
              httpMethod: method
            }).promise();
            
            console.log(`    ${method}:`);
            console.log(`      Auth: ${methodDetails.authorizationType}`);
            console.log(`      Integration: ${methodDetails.methodIntegration ? methodDetails.methodIntegration.type : 'NONE'}`);
            
            if (methodDetails.methodIntegration && methodDetails.methodIntegration.uri) {
              console.log(`      URI: ${methodDetails.methodIntegration.uri}`);
            }
          } catch (error) {
            console.log(`    ${method}: ERROR - ${error.message}`);
          }
        }
      }
    }

    // Check for problematic resources
    console.log('\n🚨 Problematic Resources:');
    const problematicResources = [];
    
    for (const resource of resources.items) {
      // Check if resource has children but no methods
      const hasChildren = resources.items.some(child => child.parentId === resource.id);
      const hasMethods = resource.resourceMethods && Object.keys(resource.resourceMethods).length > 0;
      
      if (hasChildren && !hasMethods) {
        problematicResources.push(resource);
        console.log(`  ❌ ${resource.path} (${resource.id}) - Has children but no methods`);
      }
      
      // Check if resource has methods but no integrations
      if (hasMethods) {
        for (const method of Object.keys(resource.resourceMethods)) {
          try {
            const methodDetails = await apigateway.getMethod({
              restApiId: API_ID,
              resourceId: resource.id,
              httpMethod: method
            }).promise();
            
            if (!methodDetails.methodIntegration || !methodDetails.methodIntegration.uri) {
              console.log(`  ❌ ${resource.path} ${method} - Has method but no integration`);
            }
          } catch (error) {
            console.log(`  ❌ ${resource.path} ${method} - Error checking method: ${error.message}`);
          }
        }
      }
    }

    if (problematicResources.length === 0) {
      console.log('  ✅ No problematic resources found');
    }

    // Try to identify the specific method causing deployment failure
    console.log('\n🔍 Checking for methods without integrations...');
    
    for (const resource of resources.items) {
      if (resource.resourceMethods) {
        for (const method of Object.keys(resource.resourceMethods)) {
          try {
            const methodDetails = await apigateway.getMethod({
              restApiId: API_ID,
              resourceId: resource.id,
              httpMethod: method
            }).promise();
            
            if (!methodDetails.methodIntegration) {
              console.log(`❌ ${resource.path} ${method} - No integration at all`);
            } else if (!methodDetails.methodIntegration.uri) {
              console.log(`❌ ${resource.path} ${method} - Integration exists but no URI`);
            }
          } catch (error) {
            console.log(`❌ ${resource.path} ${method} - Cannot retrieve method details: ${error.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error diagnosing API Gateway:', error);
  }
}

// Run the diagnosis
diagnoseApiGateway();
