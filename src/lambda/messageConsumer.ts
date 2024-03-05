import * as AWS from 'aws-sdk';
import {updateScore, updateStatus} from "./utils/awsUtilsFunctions";

const tableName = process.env.USERS_DB_TABLE;

export const handler = async (event: any) => {

    for (const record of event.Records) {
        console.log('SQS record:', JSON.stringify(record, null, 2));
        const message = JSON.parse(record.body);

        const userId = message.userId;
        const action = message.action;

        try {
            const dynamodb = new AWS.DynamoDB.DocumentClient();

            if (!tableName) {
                throw new Error('tableName not provided');
            }

            if (!userId || !action) {
                throw new Error('userId or action not provided in the message');
            }

            if (action === 'add') {
                await updateScore(dynamodb, userId, 1, tableName);
            } else if (action === 'subtract') {
                await updateScore(dynamodb, userId, -1, tableName);
            } else {
                throw new Error(`Invalid action: ${action}`);
            }

            await updateStatus(dynamodb, userId, 'open', tableName);

            console.log(`Updated score and status for user ${userId}`);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }
};
