import * as AWS from 'aws-sdk';
import {APIGatewayProxyHandler} from "aws-lambda";
import {sendMessageToSQS, updateStatus} from "./utils/awsUtilsFunctions";

const queueUrl = process.env.QUEUE_URL;
const tableName = process.env.USERS_DB_TABLE;

export const handler: APIGatewayProxyHandler = async event => {
    try {
        const userId = event.pathParameters?.userId;
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const sqs = new AWS.SQS();

        if (!userId) {
            throw new Error('userId not provided');
        }

        if (!tableName) {
            throw new Error('tableName not provided');
        }

        if (!queueUrl) {
            throw new Error('queueUrl not provided');
        }

        const requestBody = JSON.parse(event.body || '{}');
        const action = requestBody.action;

        if (!action) {
            throw new Error('action not provided in the event body');
        }

        await updateStatus(dynamodb, userId, 'pending', tableName);

        await sendMessageToSQS(sqs, { userId, action }, queueUrl);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Message sent successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error })
        };
    }
}
