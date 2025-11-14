const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function deployLambda(functionName, sourceFile, handler = 'index.handler') {
  try {
    console.log(`Deploying ${functionName}...`);
    
    // Create a temporary directory for this function
    const tempDir = `/tmp/${functionName}`;
    execSync(`mkdir -p ${tempDir}`);
    
    // Copy the source file
    execSync(`cp ${sourceFile} ${tempDir}/index.js`);
    
    // Create package.json
    const packageJson = {
      name: functionName,
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        'aws-sdk': '^2.1691.0'
      }
    };
    
    fs.writeFileSync(`${tempDir}/package.json`, JSON.stringify(packageJson, null, 2));
    
    // Install dependencies
    execSync(`cd ${tempDir} && npm install --production`, { stdio: 'inherit' });
    
    // Create zip file
    execSync(`cd ${tempDir} && zip -r ${functionName}.zip .`);
    
    // Read zip file
    const zipBuffer = fs.readFileSync(`${tempDir}/${functionName}.zip`);
    
    // Check if function exists
    let functionExists = false;
    try {
      await lambda.getFunction({ FunctionName: functionName }).promise();
      functionExists = true;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }
    
    if (functionExists) {
      // Update existing function
      await lambda.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: zipBuffer
      }).promise();
      console.log(`✅ Updated ${functionName}`);
    } else {
      // Create new function
      await lambda.createFunction({
        FunctionName: functionName,
        Runtime: 'nodejs18.x',
        Role: 'arn:aws:iam::' + process.env.AWS_ACCOUNT_ID + ':role/classcast-lambda-role',
        Handler: handler,
        Code: { ZipFile: zipBuffer },
        Description: `ClassCast ${functionName} function`,
        Timeout: 30,
        MemorySize: 256
      }).promise();
      console.log(`✅ Created ${functionName}`);
    }
    
    // Clean up
    execSync(`rm -rf ${tempDir}`);
    
  } catch (error) {
    console.error(`❌ Error deploying ${functionName}:`, error.message);
  }
}

async function main() {
  const functions = [
    {
      name: 'classcast-create-assignment',
      file: '../lambda/auth/create-assignment.ts',
      handler: 'index.handler'
    },
    {
      name: 'classcast-fetch-assignments',
      file: '../lambda/auth/fetch-assignments.ts',
      handler: 'index.handler'
    },
    {
      name: 'classcast-grade-submission',
      file: '../lambda/auth/grade-submission.ts',
      handler: 'index.handler'
    },
    {
      name: 'classcast-fetch-grades',
      file: '../lambda/auth/fetch-grades.ts',
      handler: 'index.handler'
    },
    {
      name: 'classcast-fetch-submissions',
      file: '../lambda/auth/fetch-submissions.ts',
      handler: 'index.handler'
    }
  ];
  
  for (const func of functions) {
    await deployLambda(func.name, func.file, func.handler);
  }
  
  console.log('\n🎉 Lambda deployment completed!');
}

main().catch(console.error);
