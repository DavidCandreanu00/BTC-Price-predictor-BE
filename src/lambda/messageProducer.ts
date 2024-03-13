import * as AWS from 'aws-sdk';
import {APIGatewayProxyHandler} from "aws-lambda";
import {getUserDetails, sendMessageToSQS, updateStatus} from "./utils/awsUtilsFunctions";
import {fetchBTCPrice} from "./utils/btcUtilsFunctions";

const queueUrl = process.env.QUEUE_URL || '';
const tableName = process.env.USERS_DB_TABLE || '';

export const handler: APIGatewayProxyHandler = async event => {
    try {
        const userId = event.pathParameters?.userId;
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const sqs = new AWS.SQS();

        const requestBody = JSON.parse(event.body || '{}');
        const prediction = requestBody.prediction;

        if (!userId) {
            throw new Error('userId not provided');
        }

        if (!prediction) {
            throw new Error('prediction not provided in the event body');
        }

        // We first have to check to see if the user already has an open bet, and throw an error if so

        const user = await getUserDetails(dynamodb, tableName, userId);

        if (!user) {
            throw new Error('User not found');
        }

        const { status } = user;

        if (status !== 'open') {
            throw new Error('User already has an open bet');
        }

        const btcPrice = await fetchBTCPrice();
        console.log('Btc price at the time of the request: ', btcPrice);

        if (!btcPrice) {
            throw new Error('failed to fetch the BTC price');
        }

        await updateStatus(dynamodb, userId, 'pending', tableName);

        await sendMessageToSQS(sqs, { userId, prediction, btcPrice }, queueUrl);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Bet set successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
}
