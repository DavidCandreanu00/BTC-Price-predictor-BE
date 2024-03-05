import {APIGatewayProxyHandler} from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_DB_TABLE;

export const handler: APIGatewayProxyHandler = async event => {
    try {
        const userId = event.pathParameters?.userId;

        if (!userId) {
            throw new Error('userId not provided');
        }

        if (!tableName) {
            throw new Error('tableName not provided');
        }

        const params = {
            TableName: tableName,
            Key: { userId: userId }
        };
        const data = await dynamodb.get(params).promise();
        const user = data.Item;

        if (!user) {
            throw new Error('User not found');
        }

        const { score, status } = user;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                score,
                status
            })
        };
    } catch (err) {
        console.error('Error:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: err || 'Internal Server Error'
            })
        };
    }
};
