import {APIGatewayProxyHandler} from "aws-lambda";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import {addUUIDToDB, checkIfUUIDExists} from "./utils/awsUtilsFunctions";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USERS_DB_TABLE || '';

const generateUUID = () => {
    return uuidv4();
};

export const handler: APIGatewayProxyHandler = async event => {
    try {
        let uuid = generateUUID();
        let exists = await checkIfUUIDExists(dynamodb, tableName, uuid);

        while (exists) {
            uuid = generateUUID();
            exists = await checkIfUUIDExists(dynamodb, tableName, uuid);
        }

        await addUUIDToDB(dynamodb, tableName, uuid);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                userId: uuid
            })
        };

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
