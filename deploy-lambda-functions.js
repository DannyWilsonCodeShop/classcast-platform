const { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } = require('@aws-sdk/client-iam');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

const LAMBDA_ROLE_NAME = 'ClassCastLambdaExecutionRole';
const LAMBDA_ROLE_ARN = `arn:aws:iam::463470937777:role/${LAMBDA_ROLE_NAME}`;

// Required policies for Lambda functions
const REQUIRED_POLICIES = [
  'arn:aws:iam::aws:policy/AmazonCognitoPowerUser',
  'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
  'arn:aws:iam::aws:policy/AmazonS3FullAccess',
  'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
];

async function createLambdaRole() {
  try {
    console.log('Creating Lambda execution role...');
    
    const rolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    };

    const createRoleCommand = new CreateRoleCommand({
      RoleName: LAMBDA_ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify(rolePolicy),
      Description: 'Execution role for ClassCast Lambda functions'
    });

    await iamClient.send(createRoleCommand);
    console.log('✅ Lambda role created successfully');

    // Attach required policies
    for (const policyArn of REQUIRED_POLICIES) {
      try {
        await iamClient.send(new AttachRolePolicyCommand({
          RoleName: LAMBDA_ROLE_NAME,
          PolicyArn: policyArn
        }));
        console.log(`✅ Attached policy: ${policyArn}`);
      } catch (error) {
        console.log(`⚠️  Policy ${policyArn} may already be attached:`, error.message);
      }
    }

    // Wait for role to be ready
    console.log('Waiting for role to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    if (error.name === 'EntityAlreadyExistsException') {
      console.log('✅ Lambda role already exists');
    } else {
      throw error;
    }
  }
}

async function createZipFile(functionName) {
  const functionDir = path.join(__dirname, 'lambda', 'api', 'auth', functionName);
  const zipPath = path.join(__dirname, `${functionName}.zip`);
  
  console.log(`Creating zip file for ${functionName} from ${functionDir}...`);
  
  // Create zip file
  execSync(`cd ${functionDir} && zip -r ${zipPath} .`, { stdio: 'inherit' });
  
  return fs.readFileSync(zipPath);
}

async function deployLambdaFunction(functionName, handler, description) {
  try {
    console.log(`\n🚀 Deploying ${functionName} Lambda function...`);
    
    // Create zip file
    const zipBuffer = await createZipFile(functionName);
    
    const functionConfig = {
      FunctionName: `classcast-auth-${functionName}`,
      Runtime: 'nodejs18.x',
      Role: LAMBDA_ROLE_ARN,
      Handler: handler,
      Code: {
        ZipFile: zipBuffer
      },
      Description: description,
      Environment: {
        Variables: {
          COGNITO_USER_POOL_ID: 'us-east-1_uK50qBrap',
          COGNITO_USER_POOL_CLIENT_ID: '7tbaq74itv3gdda1bt25iqafvh',
          COGNITO_IDENTITY_POOL_ID: 'us-east-1:463470937777',
          API_GATEWAY_URL: 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod',
          FROM_EMAIL: 'noreply@myclasscast.com',
          REPLY_TO_EMAIL: 'support@myclasscast.com',
          NODE_ENV: 'production'
        }
      },
      Timeout: 30,
      MemorySize: 256
    };

    try {
      // Try to get existing function
      await lambdaClient.send(new GetFunctionCommand({ FunctionName: `classcast-auth-${functionName}` }));
      
      // Update existing function
      console.log(`Updating existing function: classcast-auth-${functionName}`);
      const updateCommand = new UpdateFunctionCodeCommand({
        FunctionName: `classcast-auth-${functionName}`,
        ZipFile: zipBuffer
      });
      
      await lambdaClient.send(updateCommand);
      console.log(`✅ Updated classcast-auth-${functionName} function`);
      
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        // Create new function
        console.log(`Creating new function: classcast-auth-${functionName}`);
        const createCommand = new CreateFunctionCommand(functionConfig);
        
        await lambdaClient.send(createCommand);
        console.log(`✅ Created classcast-auth-${functionName} function`);
      } else {
        throw error;
      }
    }

    // Clean up zip file
    fs.unlinkSync(`${functionName}.zip`);
    
  } catch (error) {
    console.error(`❌ Error deploying ${functionName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Lambda function deployment...\n');
    
    // Create Lambda execution role
    await createLambdaRole();
    
    // Deploy Lambda functions
    await deployLambdaFunction(
      'signup',
      'signup.handler',
      'ClassCast user signup Lambda function'
    );
    
    await deployLambdaFunction(
      'login',
      'login.handler',
      'ClassCast user login Lambda function'
    );
    
    await deployLambdaFunction(
      'verify-email',
      'verify-email.handler',
      'ClassCast email verification Lambda function'
    );
    
    await deployLambdaFunction(
      'resend-verification',
      'resend-verification.handler',
      'ClassCast resend verification code Lambda function'
    );
    
    console.log('\n🎉 All Lambda functions deployed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create API Gateway endpoints for these Lambda functions');
    console.log('2. Update your frontend to use the new API endpoints');
    console.log('3. Test the authentication flow');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();
