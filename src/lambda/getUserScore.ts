import {APIGatewayProxyHandler} from 'aws-lambda';
import * as AWS from 'aws-sdk';
import {getUserDetails} from "./utils/awsUtilsFunctions";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_DB_TABLE || '';

export const handler: APIGatewayProxyHandler = async event => {
    try {
        const userId = event.pathParameters?.userId;

        if (!userId) {
            throw new Error('userId not provided');
        }

        const user = await getUserDetails(dynamodb, tableName, userId);

        if (!user) {
            throw new Error('User not found');
        }

        const { score, status } = user;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                userId: userId,
                score,
                status
            })
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
};
