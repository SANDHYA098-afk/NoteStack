import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class NoteStackCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // DynamoDB Tables
    // ========================================================================

    const notesTable = new dynamodb.Table(this, 'NotesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    notesTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const sharedNotesTable = new dynamodb.Table(this, 'SharedNotesTable', {
      partitionKey: { name: 'sharedWithUserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'notificationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const starredNotesTable = new dynamodb.Table(this, 'StarredNotesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================================================
    // S3 Bucket
    // ========================================================================

    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      cors: [{
        allowedOrigins: ['*'],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedHeaders: ['*'],
        maxAge: 3600,
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ========================================================================
    // Cognito User Pool
    // ========================================================================

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = userPool.addClient('WebAppClient', {
      authFlows: {
        userPassword: true,
      },
      generateSecret: false,
    });

    // ========================================================================
    // Secrets Manager
    // ========================================================================

    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        ALLOWED_FILE_TYPES: ['pdf', 'png', 'jpg', 'jpeg'],
        BUCKET_NAME: filesBucket.bucketName,
      })),
    });

    // ========================================================================
    // Lambda — Shared Layer & Role
    // ========================================================================

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions
    notesTable.grantReadWriteData(lambdaRole);
    sharedNotesTable.grantReadWriteData(lambdaRole);
    notificationsTable.grantReadWriteData(lambdaRole);
    starredNotesTable.grantReadWriteData(lambdaRole);
    filesBucket.grantReadWrite(lambdaRole);
    appSecret.grantRead(lambdaRole);

    // Cognito read permission for ShareNote + GetAllNotes
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:ListUsers'],
      resources: [userPool.userPoolArn],
    }));

    // Shared environment variables
    const lambdaEnv = {
      BUCKET_NAME: filesBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      NOTES_TABLE: notesTable.tableName,
      SHARED_TABLE: sharedNotesTable.tableName,
      NOTIFICATIONS_TABLE: notificationsTable.tableName,
      STARRED_TABLE: starredNotesTable.tableName,
    };

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      role: lambdaRole,
      environment: lambdaEnv,
    };

    // Helper to resolve Lambda code path (relative to project root)
    const lambdasDir = path.join(__dirname, '../../domains');

    // ========================================================================
    // Lambda Functions
    // ========================================================================

    // Notes domain
    // NOTE: Run `bash cdk/bundle-lambdas.sh` before `cdk deploy`
    // This copies shared/utils.mjs into each Lambda directory and fixes imports

    const createNoteFn = new lambda.Function(this, 'CreateNote', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/CreateNote')),
    });

    const getNoteFn = new lambda.Function(this, 'GetNotes', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/GetNotes')),
    });

    const updateNoteFn = new lambda.Function(this, 'UpdateNote', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/UpdateNote')),
    });

    const deleteNoteFn = new lambda.Function(this, 'DeleteNote', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/DeleteNote')),
    });

    const getAllNotesFn = new lambda.Function(this, 'GetAllNotes', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/GetAllNotes')),
    });

    const searchNotesFn = new lambda.Function(this, 'SearchNotes', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/SearchNotes')),
    });

    const toggleStarFn = new lambda.Function(this, 'ToggleStar', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/ToggleStar')),
    });

    const getStarredFn = new lambda.Function(this, 'GetStarredNotes', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notes/lambdas/GetStarredNotes')),
    });

    // Files domain
    const uploadUrlFn = new lambda.Function(this, 'GenerateUploadUrl', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'files/lambdas/GenerateUploadUrl')),
    });

    const downloadUrlFn = new lambda.Function(this, 'GenerateDownloadUrl', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'files/lambdas/GenerateDownloadUrl')),
    });

    // Sharing domain
    const shareNoteFn = new lambda.Function(this, 'ShareNote', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'sharing/lambdas/ShareNote')),
    });

    // Notifications domain
    const getNotifFn = new lambda.Function(this, 'GetNotifications', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notifications/lambdas/GetNotifications')),
    });

    const markNotifFn = new lambda.Function(this, 'MarkNotificationRead', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'notifications/lambdas/MarkNotificationRead')),
    });

    // Cleanup domain
    const autoDeleteFn = new lambda.Function(this, 'AutoDeleteOldNotes', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(lambdasDir, 'cleanup/lambdas/AutoDeleteOldNotes')),
    });

    // ========================================================================
    // EventBridge — Daily Auto-Delete
    // ========================================================================

    new events.Rule(this, 'AutoDeleteRule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new targets.LambdaFunction(autoDeleteFn)],
    });

    // ========================================================================
    // API Gateway
    // ========================================================================

    const api = new apigateway.RestApi(this, 'Api', {
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuth', {
      cognitoUserPools: [userPool],
    });

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Gateway responses with CORS headers
    api.addGatewayResponse('Default4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      },
    });

    api.addGatewayResponse('Default5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      },
    });

    // --- /notes ---
    const notes = api.root.addResource('notes');
    notes.addMethod('POST', new apigateway.LambdaIntegration(createNoteFn), authOptions);
    notes.addMethod('GET', new apigateway.LambdaIntegration(getNoteFn), authOptions);
    notes.addMethod('PUT', new apigateway.LambdaIntegration(updateNoteFn), authOptions);
    notes.addMethod('DELETE', new apigateway.LambdaIntegration(deleteNoteFn), authOptions);

    // --- /notes/feed ---
    const feed = notes.addResource('feed');
    feed.addMethod('GET', new apigateway.LambdaIntegration(getAllNotesFn), authOptions);

    // --- /notes/search ---
    const search = notes.addResource('search');
    search.addMethod('GET', new apigateway.LambdaIntegration(searchNotesFn), authOptions);

    // --- /notes/upload-url ---
    const uploadUrl = notes.addResource('upload-url');
    uploadUrl.addMethod('POST', new apigateway.LambdaIntegration(uploadUrlFn), authOptions);

    // --- /notes/download-url ---
    const downloadUrl = notes.addResource('download-url');
    downloadUrl.addMethod('GET', new apigateway.LambdaIntegration(downloadUrlFn), authOptions);

    // --- /notes/share ---
    const share = notes.addResource('share');
    share.addMethod('POST', new apigateway.LambdaIntegration(shareNoteFn), authOptions);

    // --- /notes/star ---
    const star = notes.addResource('star');
    star.addMethod('POST', new apigateway.LambdaIntegration(toggleStarFn), authOptions);
    star.addMethod('GET', new apigateway.LambdaIntegration(getStarredFn), authOptions);

    // --- /notifications ---
    const notifications = api.root.addResource('notifications');
    notifications.addMethod('GET', new apigateway.LambdaIntegration(getNotifFn), authOptions);
    notifications.addMethod('PUT', new apigateway.LambdaIntegration(markNotifFn), authOptions);

    // ========================================================================
    // Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 Files Bucket',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
