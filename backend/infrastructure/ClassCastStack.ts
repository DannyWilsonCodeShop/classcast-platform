// ============================================================================
// CLASSCAST CDK STACK - Infrastructure as Code
// ============================================================================

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ClassCastStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // S3 BUCKET FOR FILE STORAGE
    // ============================================================================
    
    const fileBucket = new s3.Bucket(this, 'ClassCastFileBucket', {
      bucketName: `classcast-clean-files-${this.account}-${this.region}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1)
        }
      ]
    });

    // ============================================================================
    // COGNITO USER POOL
    // ============================================================================
    
    const userPool = new cognito.UserPool(this, 'ClassCastUserPool', {
      userPoolName: 'ClassCastCleanUsers',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
        givenName: {
          required: true,
          mutable: true
        },
        familyName: {
          required: true,
          mutable: true
        }
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        instructorId: new cognito.StringAttribute({ mutable: true }),
        department: new cognito.StringAttribute({ mutable: true })
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'ClassCastUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      generateSecret: false
    });

    // User Pool Groups
    new cognito.CfnUserPoolGroup(this, 'StudentsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Students',
      description: 'Student users'
    });

    new cognito.CfnUserPoolGroup(this, 'InstructorsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Instructors',
      description: 'Instructor users'
    });

    // ============================================================================
    // DYNAMODB TABLES
    // ============================================================================
    
    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'ClassCastCleanUsers',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // GSI for email lookups
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING }
    });

    // Courses Table
    const coursesTable = new dynamodb.Table(this, 'CoursesTable', {
      tableName: 'ClassCastCleanCourses',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // GSI for instructor courses
    coursesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING }
    });

    // Assignments Table
    const assignmentsTable = new dynamodb.Table(this, 'AssignmentsTable', {
      tableName: 'ClassCastCleanAssignments',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // GSI for due date queries
    assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING }
    });

    // Submissions Table
    const submissionsTable = new dynamodb.Table(this, 'SubmissionsTable', {
      tableName: 'ClassCastCleanSubmissions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // GSI for student submissions
    submissionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING }
    });

    // ============================================================================
    // LAMBDA FUNCTIONS
    // ============================================================================
    
    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        COURSES_TABLE_NAME: coursesTable.tableName,
        ASSIGNMENTS_TABLE_NAME: assignmentsTable.tableName,
        SUBMISSIONS_TABLE_NAME: submissionsTable.tableName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        S3_BUCKET_NAME: fileBucket.bucketName
      }
    };

    // Auth Lambda
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastAuth',
      code: lambda.Code.fromAsset('../functions/simple-auth'),
      timeout: cdk.Duration.seconds(30)
    });

    // Users Lambda
    const usersLambda = new lambda.Function(this, 'UsersLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastUsers',
      code: lambda.Code.fromAsset('../functions/simple-users'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName
      }
    });

    // Courses Lambda
    const coursesLambda = new lambda.Function(this, 'CoursesLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastCourses',
      code: lambda.Code.fromAsset('../functions/simple-courses'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        COURSES_TABLE_NAME: coursesTable.tableName
      }
    });

    // Videos Lambda
    const videosLambda = new lambda.Function(this, 'VideosLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastVideos',
      code: lambda.Code.fromAsset('../functions/simple-videos'),
      timeout: cdk.Duration.seconds(30)
    });

    // Assignments Lambda
    const assignmentsLambda = new lambda.Function(this, 'AssignmentsLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastAssignments',
      code: lambda.Code.fromAsset('../functions/simple-assignments'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        ASSIGNMENTS_TABLE_NAME: assignmentsTable.tableName
      }
    });

    // Submissions Lambda
    const submissionsLambda = new lambda.Function(this, 'SubmissionsLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastSubmissions',
      code: lambda.Code.fromAsset('../functions/simple-submissions'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        SUBMISSIONS_TABLE_NAME: submissionsTable.tableName
      }
    });

    // Peer Reviews Lambda
    const peerReviewsLambda = new lambda.Function(this, 'PeerReviewsLambda', {
      ...lambdaConfig,
      functionName: 'ClassCastPeerReviews',
      code: lambda.Code.fromAsset('../functions/simple-peer-reviews'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        SUBMISSIONS_TABLE_NAME: submissionsTable.tableName
      }
    });

    // ============================================================================
    // IAM PERMISSIONS
    // ============================================================================
    
    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(authLambda);
    usersTable.grantReadWriteData(usersLambda);
    coursesTable.grantReadWriteData(coursesLambda);
    assignmentsTable.grantReadWriteData(assignmentsLambda);
    submissionsTable.grantReadWriteData(submissionsLambda);
    submissionsTable.grantReadWriteData(peerReviewsLambda);

    // Grant S3 permissions
    fileBucket.grantReadWrite(authLambda);
    fileBucket.grantReadWrite(usersLambda);
    fileBucket.grantReadWrite(coursesLambda);

    // Grant Cognito permissions
    authLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminGetUser',
        'cognito-idp:InitiateAuth'
      ],
      resources: [userPool.userPoolArn]
    }));

    // ============================================================================
    // API GATEWAY
    // ============================================================================
    
    const api = new apigateway.RestApi(this, 'ClassCastAPI', {
      restApiName: 'ClassCast API',
      description: 'API for ClassCast Platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Auth endpoints
    const auth = api.root.addResource('auth');
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    auth.addResource('logout').addMethod('POST', new apigateway.LambdaIntegration(authLambda));
    auth.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(authLambda));

    // Users endpoints
    const users = api.root.addResource('users');
    const userProfile = users.addResource('{userId}').addResource('profile');
    userProfile.addMethod('GET', new apigateway.LambdaIntegration(usersLambda));
    userProfile.addMethod('PUT', new apigateway.LambdaIntegration(usersLambda));

    // Courses endpoints
    const courses = api.root.addResource('courses');
    courses.addMethod('GET', new apigateway.LambdaIntegration(coursesLambda));
    courses.addMethod('POST', new apigateway.LambdaIntegration(coursesLambda));
    const course = courses.addResource('{courseId}');
    course.addMethod('GET', new apigateway.LambdaIntegration(coursesLambda));
    course.addMethod('PUT', new apigateway.LambdaIntegration(coursesLambda));
    course.addMethod('DELETE', new apigateway.LambdaIntegration(coursesLambda));

    // Videos endpoints
    const videos = api.root.addResource('videos');
    videos.addMethod('GET', new apigateway.LambdaIntegration(videosLambda));
    videos.addMethod('POST', new apigateway.LambdaIntegration(videosLambda));
    const video = videos.addResource('{videoId}');
    video.addMethod('GET', new apigateway.LambdaIntegration(videosLambda));
    video.addMethod('PUT', new apigateway.LambdaIntegration(videosLambda));
    video.addMethod('DELETE', new apigateway.LambdaIntegration(videosLambda));

    // Assignments endpoints
    const assignments = api.root.addResource('assignments');
    assignments.addMethod('GET', new apigateway.LambdaIntegration(assignmentsLambda));
    assignments.addMethod('POST', new apigateway.LambdaIntegration(assignmentsLambda));
    const assignment = assignments.addResource('{assignmentId}');
    assignment.addMethod('GET', new apigateway.LambdaIntegration(assignmentsLambda));
    assignment.addMethod('PUT', new apigateway.LambdaIntegration(assignmentsLambda));
    assignment.addMethod('DELETE', new apigateway.LambdaIntegration(assignmentsLambda));

    // Submissions endpoints
    const submissions = api.root.addResource('submissions');
    submissions.addMethod('GET', new apigateway.LambdaIntegration(submissionsLambda));
    submissions.addMethod('POST', new apigateway.LambdaIntegration(submissionsLambda));
    const submission = submissions.addResource('{submissionId}');
    submission.addMethod('GET', new apigateway.LambdaIntegration(submissionsLambda));
    submission.addMethod('PUT', new apigateway.LambdaIntegration(submissionsLambda));
    submission.addMethod('DELETE', new apigateway.LambdaIntegration(submissionsLambda));
    // Grade a submission
    const submissionGrade = submission.addResource('grade');
    submissionGrade.addMethod('PUT', new apigateway.LambdaIntegration(submissionsLambda));
    // Get submissions by assignment
    const submissionsByAssignment = submissions.addResource('assignment').addResource('{assignmentId}');
    submissionsByAssignment.addMethod('GET', new apigateway.LambdaIntegration(submissionsLambda));
    // Get submissions by student
    const submissionsByStudent = submissions.addResource('student').addResource('{studentId}');
    submissionsByStudent.addMethod('GET', new apigateway.LambdaIntegration(submissionsLambda));

    // Peer Reviews endpoints
    const peerReviews = api.root.addResource('peer-reviews');
    peerReviews.addMethod('GET', new apigateway.LambdaIntegration(peerReviewsLambda));
    peerReviews.addMethod('POST', new apigateway.LambdaIntegration(peerReviewsLambda));
    const peerReview = peerReviews.addResource('{reviewId}');
    peerReview.addMethod('GET', new apigateway.LambdaIntegration(peerReviewsLambda));
    peerReview.addMethod('PUT', new apigateway.LambdaIntegration(peerReviewsLambda));
    peerReview.addMethod('DELETE', new apigateway.LambdaIntegration(peerReviewsLambda));
    // Get reviews for a video
    const reviewsByVideo = peerReviews.addResource('video').addResource('{videoId}');
    reviewsByVideo.addMethod('GET', new apigateway.LambdaIntegration(peerReviewsLambda));
    // Get reviews by reviewer
    const reviewsByReviewer = peerReviews.addResource('reviewer').addResource('{reviewerId}');
    reviewsByReviewer.addMethod('GET', new apigateway.LambdaIntegration(peerReviewsLambda));
    // Get all reviews for an assignment
    const reviewsByAssignment = peerReviews.addResource('assignment').addResource('{assignmentId}');
    reviewsByAssignment.addMethod('GET', new apigateway.LambdaIntegration(peerReviewsLambda));

    // ============================================================================
    // OUTPUTS
    // ============================================================================
    
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'FileBucketName', {
      value: fileBucket.bucketName,
      description: 'S3 File Bucket Name'
    });
  }
}
