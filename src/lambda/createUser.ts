import {APIGatewayProxyHandler} from "aws-lambda";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_DB_TABLE;

const generateUUID = () => {
    return uuidv4();
};

const checkIfUUIDExists = async (uuid: string) => {
    if (!tableName) {
        throw new Error('tableName not provided');
    }

    const params = {
        TableName: tableName,
        Key: { userId: uuid }
    };

    try {
        const data = await dynamodb.get(params).promise();
        return !!data.Item;
    } catch (err) {
        console.error('Error checking UUID existence:', err);
        throw err;
    }
};

const addUUIDToDB = async (uuid: string) => {
    if (!tableName) {
        throw Error;
    }

    const params = {
        TableName: tableName,
        Item: {
            userId: uuid,
            score: 0,
            status: 'open'
        }
    };

    try {
        await dynamodb.put(params).promise();
        console.log('UUID added to DynamoDB:', uuid);
    } catch (err) {
        console.error('Error adding UUID to DynamoDB:', err);
        throw err;
    }
};

export const handler: APIGatewayProxyHandler = async event => {
    try {
        let uuid = generateUUID();
        let exists = await checkIfUUIDExists(uuid);

        while (exists) {
            uuid = generateUUID();
            exists = await checkIfUUIDExists(uuid);
        }

        await addUUIDToDB(uuid);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: uuid
            })
        };

    } catch (err) {
        console.error('Error:', err);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: err
            })
        };
    }
};
