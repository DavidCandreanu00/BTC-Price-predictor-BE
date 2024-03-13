import * as AWS from 'aws-sdk';
import {updateScore, updateStatus} from "./utils/awsUtilsFunctions";
import {fetchBTCPrice} from "./utils/btcUtilsFunctions";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_DB_TABLE || '';

export const handler = async (event: any) => {

    for (const record of event.Records) {
        console.log('SQS record:', JSON.stringify(record, null, 2));
        const message = JSON.parse(record.body);

        const userId = message.userId;
        const prediction = message.prediction;
        const bctPriceAtBetTime = message.btcPrice;

        try {
            if (!userId || !prediction) {
                throw new Error('userId or prediction not provided in the message');
            }

            const btcPrice = await fetchBTCPrice();

            if (prediction === 'up') {
                btcPrice >= bctPriceAtBetTime ?
                    await updateScore(dynamodb, userId, 1, tableName) :
                    await updateScore(dynamodb, userId, -1, tableName);
            } else if (prediction === 'down') {
                btcPrice < bctPriceAtBetTime ?
                    await updateScore(dynamodb, userId, 1, tableName) :
                    await updateScore(dynamodb, userId, -1, tableName);
            } else {
                throw new Error(`Invalid prediction: ${prediction}`);
            }

            await updateStatus(dynamodb, userId, 'open', tableName);

            console.log(`Updated score and status for user ${userId}`);
            console.log(`Prediction: ${prediction}, price on prediction: ${bctPriceAtBetTime}, actual price: ${btcPrice}.`);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }
};
