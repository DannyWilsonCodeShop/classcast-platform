import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiGatewayStackProps extends cdk.StackProps {
  authStack: any; // Reference to AuthStack
  databaseStack?: any; // Reference to DatabaseStack (optional)
  storageStack?: any; // Reference to StorageStack (optional)
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
  public readonly lambdaFunctions: { [key: string]: lambda.Function };

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create Lambda functions for different API endpoints
    this.lambdaFunctions = this.createLambdaFunctions(props);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'DemoProjectAPI', {
      restApiName: 'DemoProject-API',
      description: 'DemoProject REST API with Lambda integration',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.days(1),
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            logGroupName: '/aws/apigateway/DemoProject/access-logs',
            retention: logs.RetentionDays.ONE_WEEK,
          })
        ),
      },
    });

    // Create Cognito Authorizer
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'DemoProjectAuthorizer', {
      cognitoUserPools: [props.authStack.userPool],
      authorizerName: 'DemoProject-Cognito-Authorizer',
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // Create API resources and methods
    this.createApiResources();

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: 'DemoProject-ApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: 'DemoProject-ApiGatewayId',
    });

    new cdk.CfnOutput(this, 'AuthorizerId', {
      value: this.authorizer.authorizerId,
      description: 'Cognito Authorizer ID',
      exportName: 'DemoProject-AuthorizerId',
    });
  }

  private createLambdaFunctions(props: ApiGatewayStackProps): { [key: string]: lambda.Function } {
    const functions: { [key: string]: lambda.Function } = {};

    // Health Check Lambda
    functions.health = new lambda.Function(this, 'HealthCheckLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Health check event:', JSON.stringify(event, null, 2));
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
              message: 'DemoProject API is healthy',
              timestamp: new Date().toISOString(),
              environment: process.env.NODE_ENV || 'development',
              region: process.env.AWS_REGION || 'unknown'
            })
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
      },
    });

    // User Management Lambda
    functions.users = new lambda.Function(this, 'UsersLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Users API event:', JSON.stringify(event, null, 2));
          
          const { httpMethod, pathParameters, body, requestContext } = event;
          const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
          
          try {
            switch (httpMethod) {
              case 'GET':
                if (pathParameters && pathParameters.userId) {
                  // Get specific user
                  const user = await cognitoIdp.adminGetUser({
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: pathParameters.userId
                  }).promise();
                  
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      user: {
                        userId: user.Username,
                        email: user.UserAttributes.find(attr => attr.Name === 'email')?.Value,
                        firstName: user.UserAttributes.find(attr => attr.Name === 'given_name')?.Value,
                        lastName: user.UserAttributes.find(attr => attr.Name === 'family_name')?.Value,
                        role: user.UserAttributes.find(attr => attr.Name === 'custom:role')?.Value,
                        department: user.UserAttributes.find(attr => attr.Name === 'custom:department')?.Value,
                        status: user.UserStatus
                      }
                    })
                  };
                } else {
                  // List users (admin only)
                  const users = await cognitoIdp.listUsers({
                    UserPoolId: process.env.USER_POOL_ID,
                    Limit: 50
                  }).promise();
                  
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      users: users.Users.map(user => ({
                        userId: user.Username,
                        email: user.Attributes.find(attr => attr.Name === 'email')?.Value,
                        firstName: user.Attributes.find(attr => attr.Name === 'given_name')?.Value,
                        lastName: user.Attributes.find(attr => attr.Name === 'family_name')?.Value,
                        role: user.Attributes.find(attr => attr.Name === 'custom:role')?.Value,
                        status: user.UserStatus
                      }))
                    })
                  };
                }
                
              case 'POST':
                // Create new user
                const userData = JSON.parse(body);
                const createUserResult = await cognitoIdp.adminCreateUser({
                  UserPoolId: process.env.USER_POOL_ID,
                  Username: userData.username,
                  UserAttributes: [
                    { Name: 'email', Value: userData.email },
                    { Name: 'given_name', Value: userData.firstName },
                    { Name: 'family_name', Value: userData.lastName },
                    { Name: 'custom:role', Value: userData.role || 'student' },
                    { Name: 'custom:department', Value: userData.department || '' }
                  ],
                  MessageAction: 'SUPPRESS'
                }).promise();
                
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'User created successfully',
                    userId: createUserResult.User.Username
                  })
                };
                
              case 'PUT':
                // Update user
                const updateData = JSON.parse(body);
                await cognitoIdp.adminUpdateUserAttributes({
                  UserPoolId: process.env.USER_POOL_ID,
                  Username: pathParameters.userId,
                  UserAttributes: [
                    { Name: 'given_name', Value: updateData.firstName },
                    { Name: 'family_name', Value: updateData.lastName },
                    { Name: 'custom:department', Value: updateData.department || '' }
                  ]
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'User updated successfully'
                  })
                };
                
              case 'DELETE':
                // Delete user
                await cognitoIdp.adminDeleteUser({
                  UserPoolId: process.env.USER_POOL_ID,
                  Username: pathParameters.userId
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'User deleted successfully'
                  })
                };
                
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    error: 'Method not allowed'
                  })
                };
            }
          } catch (error) {
            console.error('Error in users API:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        USER_POOL_ID: props.authStack.userPool.userPoolId,
      },
    });

    // File Upload Lambda
    functions.upload = new lambda.Function(this, 'FileUploadLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('File upload event:', JSON.stringify(event, null, 2));
          
          const { httpMethod, body, requestContext } = event;
          const s3 = new AWS.S3();
          
          try {
            switch (httpMethod) {
              case 'POST':
                // Generate presigned URL for file upload
                const { fileName, fileType, fileSize, userId, folder } = JSON.parse(body);
                
                const key = folder ? \`\${folder}/\${userId}/\${fileName}\` : \`\${userId}/\${fileName}\`;
                const presignedUrl = await s3.getSignedUrlPromise('putObject', {
                  Bucket: process.env.S3_BUCKET_NAME,
                  Key: key,
                  ContentType: fileType,
                  Expires: 3600, // 1 hour
                  Metadata: {
                    'user-id': userId,
                    'original-name': fileName,
                    'upload-timestamp': new Date().toISOString()
                  }
                });
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    uploadUrl: presignedUrl,
                    key: key,
                    expiresIn: 3600
                  })
                };
                
              case 'GET':
                // List user files
                const { userId: listUserId, folder: listFolder } = event.queryStringParameters || {};
                
                if (!listUserId) {
                  return {
                    statusCode: 400,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      error: 'User ID is required'
                    })
                  };
                }
                
                const prefix = listFolder ? \`\${listFolder}/\${listUserId}/\` : \`\${listUserId}/\`;
                const listResult = await s3.listObjectsV2({
                  Bucket: process.env.S3_BUCKET_NAME,
                  Prefix: prefix,
                  MaxKeys: 100
                }).promise();
                
                const files = listResult.Contents.map(obj => ({
                  key: obj.Key,
                  size: obj.Size,
                  lastModified: obj.LastModified,
                  fileName: obj.Key.split('/').pop()
                }));
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    files: files
                  })
                };
                
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    error: 'Method not allowed'
                  })
                };
            }
          } catch (error) {
            console.error('Error in file upload API:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        S3_BUCKET_NAME: props.storageStack?.bucket?.bucketName || 'demoproject-storage',
      },
    });

    // Course Management Lambda
    functions.courses = new lambda.Function(this, 'CoursesLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Courses API event:', JSON.stringify(event, null, 2));
          
          const { httpMethod, pathParameters, body, requestContext } = event;
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          
          try {
            switch (httpMethod) {
              case 'GET':
                if (pathParameters && pathParameters.courseId) {
                  // Get specific course
                  const course = await dynamodb.get({
                    TableName: process.env.COURSES_TABLE_NAME || 'DemoProject-Courses',
                    Key: { courseId: pathParameters.courseId }
                  }).promise();
                  
                  if (!course.Item) {
                    return {
                      statusCode: 404,
                      headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                      },
                      body: JSON.stringify({
                        error: 'Course not found'
                      })
                    };
                  }
                  
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      course: course.Item
                    })
                  };
                } else {
                  // List courses
                  const courses = await dynamodb.scan({
                    TableName: process.env.COURSES_TABLE_NAME || 'DemoProject-Courses',
                    Limit: 50
                  }).promise();
                  
                  return {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                      courses: courses.Items || []
                    })
                  };
                }
                
              case 'POST':
                // Create new course
                const courseData = JSON.parse(body);
                const courseId = 'course_' + Date.now();
                
                await dynamodb.put({
                  TableName: process.env.COURSES_TABLE_NAME || 'DemoProject-Courses',
                  Item: {
                    courseId: courseId,
                    title: courseData.title,
                    description: courseData.description,
                    instructorId: courseData.instructorId,
                    department: courseData.department,
                    credits: courseData.credits,
                    startDate: courseData.startDate,
                    endDate: courseData.endDate,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                }).promise();
                
                return {
                  statusCode: 201,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'Course created successfully',
                    courseId: courseId
                  })
                };
                
              case 'PUT':
                // Update course
                const updateData = JSON.parse(body);
                await dynamodb.update({
                  TableName: process.env.COURSES_TABLE_NAME || 'DemoProject-Courses',
                  Key: { courseId: pathParameters.courseId },
                  UpdateExpression: 'SET title = :title, description = :description, updatedAt = :updatedAt',
                  ExpressionAttributeValues: {
                    ':title': updateData.title,
                    ':description': updateData.description,
                    ':updatedAt': new Date().toISOString()
                  }
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'Course updated successfully'
                  })
                };
                
              case 'DELETE':
                // Delete course
                await dynamodb.delete({
                  TableName: process.env.COURSES_TABLE_NAME || 'DemoProject-Courses',
                  Key: { courseId: pathParameters.courseId }
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    message: 'Course deleted successfully'
                  })
                };
                
              default:
                return {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({
                    error: 'Method not allowed'
                  })
                };
            }
          } catch (error) {
            console.error('Error in courses API:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
              })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        COURSES_TABLE_NAME: 'DemoProject-Courses',
      },
    });

    // Grant permissions to Lambda functions
    if (props.authStack.userPool) {
      props.authStack.userPool.grant(functions.users, 'cognito-idp:AdminGetUser', 'cognito-idp:AdminCreateUser', 'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminDeleteUser', 'cognito-idp:listUsers');
    }

    if (props.storageStack?.bucket) {
      props.storageStack.bucket.grantReadWrite(functions.upload);
    }

    if (props.databaseStack?.tables) {
      // Grant DynamoDB permissions if tables exist
      Object.values(props.databaseStack.tables).forEach((table: any) => {
        if (table) {
          table.grantReadWriteData(functions.courses);
        }
      });
    }

    return functions;
  }

  private createApiResources(): void {
    // Health check endpoint (public)
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.health));

    // Users endpoint (authenticated)
    const usersResource = this.api.root.addResource('users');
    usersResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.users), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    usersResource.addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunctions.users), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Specific user endpoint (authenticated)
    const userResource = usersResource.addResource('{userId}');
    userResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.users), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    userResource.addMethod('PUT', new apigateway.LambdaIntegration(this.lambdaFunctions.users), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    userResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.lambdaFunctions.users), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // File upload endpoint (authenticated)
    const uploadResource = this.api.root.addResource('upload');
    uploadResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.upload), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunctions.upload), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Courses endpoint (authenticated)
    const coursesResource = this.api.root.addResource('courses');
    coursesResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.courses), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    coursesResource.addMethod('POST', new apigateway.LambdaIntegration(this.lambdaFunctions.courses), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Specific course endpoint (authenticated)
    const courseResource = coursesResource.addResource('{courseId}');
    courseResource.addMethod('GET', new apigateway.LambdaIntegration(this.lambdaFunctions.courses), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    courseResource.addMethod('PUT', new apigateway.LambdaIntegration(this.lambdaFunctions.courses), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    courseResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.lambdaFunctions.courses), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // CORS will be handled by Lambda functions in their responses
  }
}
