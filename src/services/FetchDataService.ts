import { DynamoDBClient, DynamoDBClientConfig, QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/client-dynamodb";
import { Credentials } from "aws-sdk";

const auth = {
    secretAccessKey: 'NXgdaUkDHCOLl++20eNxASvgHopNZkCuPZrXt2hC',
    accessKeyId: 'AKIAY7VP2EXOUVNAEHE2'
};
const creds = new Credentials(auth.accessKeyId, auth.secretAccessKey);
const client = new DynamoDBClient({
    region: 'ap-south-1',
    credentials:  creds
} as DynamoDBClientConfig);

export const getSensors = async () => {
    const commandInput = {
        TableName: 'Sensors',
        AttributesToGet: ['sensor_id']
    } as ScanCommandInput;

    const command = new ScanCommand(commandInput);
    let sensorIds: (string | undefined)[] = [];
    try {
        const results: ScanCommandOutput = await client.send(command);
        if (results.Items?.length) {
            sensorIds = results.Items?.map(element => element.sensor_id.S).filter(element => element !== undefined);
        }
    } catch (err) {
        console.error(err);
    }
    return sensorIds;
}

export const getSensorData = async (sensorId: string, fromDate: string, toDate: string) => {
    
    let filterExpressionString = '';

    let expressionAttributes: any = {
        ':s': {S: sensorId}
    }

    if (fromDate && toDate) {
        expressionAttributes[':fd'] = {
            N: getTimestampInSeconds(fromDate).toString()
        };
        expressionAttributes[':td'] = {
            N: getTimestampInSeconds(toDate).toString()
        };
        filterExpressionString = ' AND #shtimestamp BETWEEN :fd AND :td';
    } else if (fromDate) {
        expressionAttributes[':fd'] = {
            N: getTimestampInSeconds(fromDate).toString()
        };
        filterExpressionString = ' AND #shtimestamp >= :fd';
    } else if (toDate) {
        expressionAttributes[':td'] = {
            N: getTimestampInSeconds(toDate).toString()
        };
        filterExpressionString = ' AND #shtimestamp <= :td';
    }

    let commandInput = {
        TableName: 'SensorReadings',
        ExpressionAttributeValues: expressionAttributes,
        KeyConditionExpression: 'sensor_id = :s' + filterExpressionString,
    } as QueryCommandInput;

    if (filterExpressionString) {
        commandInput.ExpressionAttributeNames = { "#shtimestamp": "timestamp" };
    }

    console.log(expressionAttributes);
    console.log(filterExpressionString);
    console.log(commandInput);

    const command = new QueryCommand(commandInput);

    try {
        const results: QueryCommandOutput = await client.send(command);

        let its = results.Items?.map(element => {

            const current = (element.current.N != undefined) ? 
            parseFloat(element.current.N) : 0;
            const timestamp = (element.timestamp.N != undefined) ? 
                parseInt(element.timestamp.N) : 0;
            const voltage = (element.voltage.N != undefined) ? 
                parseFloat(element.voltage.N) : 0;

            return {
                current: current,
                voltage: voltage,
                power: current * voltage,
                timestamp: timestamp
            }
        });
        return its;
    } catch (err) {
        console.error(err);
    }
};

const getTimestampInSeconds = (dateStr: string) => {
    return Math.floor((new Date(dateStr)).getTime()/1000);
}