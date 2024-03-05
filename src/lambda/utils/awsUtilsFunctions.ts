import * as AWS from "aws-sdk";

export async function updateStatus(dynamoDB: AWS.DynamoDB.DocumentClient, userId: string, status: string, tableName: string): Promise<void> {
    const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status }
    };
    await dynamoDB.update(params).promise();
}

export async function updateScore(dynamoDB: AWS.DynamoDB.DocumentClient, userId: string, delta: number, tableName: string): Promise<void> {
    const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'SET #score = #score + :delta',
        ExpressionAttributeNames: { '#score': 'score' },
        ExpressionAttributeValues: { ':delta': delta }
    };
    await dynamoDB.update(params).promise();
}

export async function sendMessageToSQS(sqs: AWS.SQS, message: any, queueUrl: string): Promise<void> {
    const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
        MessageGroupId: 'DelayedConsumerQueueGroupId'
    };
    await sqs.sendMessage(params).promise();
}
