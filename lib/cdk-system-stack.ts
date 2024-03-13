import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class CdkSystemStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'DelayedMessagesQueue', {
      visibilityTimeout: Duration.seconds(300),
      deliveryDelay: Duration.seconds(60),
      fifo: true,
      contentBasedDeduplication: true,
    });

    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING }
    });

    const messageProducerLambda = new lambda.Function(this, 'MessageProducerLambda',
        getLambdaProps(
            'messageProducer',
            'The purpose of this lambda is to start the user score update process',
            table.tableName,
            queue.queueUrl,

        )
    );

    const messageConsumerLambda = new lambda.Function(this, 'MessageConsumerLambda',
        getLambdaProps(
            'messageConsumer',
            'The purpose of this lambda is to finalize the user score update process',
            table.tableName,
            queue.queueUrl,

        )
    );

    const createUserLambda = new lambda.Function(this, 'CreateUserLambda',
        getLambdaProps(
            'createUser',
            'The purpose of this lambda is to generate a new userId',
            table.tableName,
            queue.queueUrl,

        )
    );

    const getCurrentScoreLambda = new lambda.Function(this, 'GetCurrentScoreLambda',
        getLambdaProps(
            'getUserScore',
            'The purpose of this lambda is to get the current score of the user',
            table.tableName,
            queue.queueUrl,

        )
    );

    const api = new apigateway.RestApi(this, "CDKAppAPI", {
      restApiName: "CDK App API",
      description: "This API allows users to interact with the app.",
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
    });

    table.grantReadWriteData(messageProducerLambda);
    table.grantReadWriteData(messageConsumerLambda);
    table.grantReadWriteData(createUserLambda);
    table.grantReadWriteData(getCurrentScoreLambda);

    queue.grantSendMessages(messageProducerLambda);

    const eventSource = new SqsEventSource(queue);
    messageConsumerLambda.addEventSource(eventSource);

    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');

    const createUserIntegration = new apigateway.LambdaIntegration(createUserLambda);
    const postMessageIntegration = new apigateway.LambdaIntegration(messageProducerLambda);
    const getCurrentScoreIntegration = new apigateway.LambdaIntegration(getCurrentScoreLambda);

    users.addMethod('POST', createUserIntegration);
    user.addMethod('POST', postMessageIntegration);
    user.addMethod('GET', getCurrentScoreIntegration);
  }
}

function getLambdaProps (
  handlerFileName: string,
  description: string,
  tableName: string,
  queueUrl: string,
  ) {
  return {
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('./src/lambda'),
    handler: `${handlerFileName}.handler`,
    description: description,
    environment: {
      USERS_DB_TABLE: tableName,
      QUEUE_URL: queueUrl,
    }
  }
}
