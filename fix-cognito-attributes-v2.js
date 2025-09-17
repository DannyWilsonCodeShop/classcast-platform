const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = 'us-east-1_uK50qBrap';

async function addCustomAttributes() {
  try {
    console.log('🔧 Adding custom attributes to Cognito User Pool...\n');

    const customAttributes = [
      {
        Name: 'role',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '50'
        }
      },
      {
        Name: 'studentId',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '50'
        }
      },
      {
        Name: 'instructorId',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '50'
        }
      },
      {
        Name: 'department',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '100'
        }
      },
      {
        Name: 'bio',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '500'
        }
      },
      {
        Name: 'avatar',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '500'
        }
      },
      {
        Name: 'lastLogin',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '50'
        }
      },
      {
        Name: 'preferences',
        AttributeDataType: 'String',
        Mutable: true,
        Required: false,
        StringAttributeConstraints: {
          MinLength: '0',
          MaxLength: '1000'
        }
      }
    ];

    for (const attribute of customAttributes) {
      try {
        console.log(`Adding attribute: ${attribute.Name}`);
        await cognito.addCustomAttributes({
          UserPoolId: USER_POOL_ID,
          CustomAttributes: [attribute]
        }).promise();
        console.log(`✅ Added: ${attribute.Name}`);
      } catch (error) {
        if (error.code === 'InvalidParameterException' && error.message.includes('already exists')) {
          console.log(`⚠️ Already exists: ${attribute.Name}`);
        } else {
          console.log(`❌ Failed to add ${attribute.Name}:`, error.message);
        }
      }
    }

    console.log('\n🔍 Verifying custom attributes...');
    const userPool = await cognito.describeUserPool({
      UserPoolId: USER_POOL_ID
    }).promise();

    const customAttrs = userPool.UserPool.SchemaAttributes.filter(attr => 
      attr.Name.startsWith('custom:')
    );

    console.log(`\n📋 Found ${customAttrs.length} custom attributes:`);
    customAttrs.forEach(attr => {
      console.log(`  - ${attr.Name} (${attr.AttributeDataType})`);
    });

    console.log('\n✅ Custom attributes setup complete!');
    console.log('\n🚀 You can now test user signup again.');

  } catch (error) {
    console.error('❌ Error adding custom attributes:', error);
  }
}

addCustomAttributes();
