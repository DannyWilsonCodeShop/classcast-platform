import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    // Try to scan the submissions table
    const scanCommand = new ScanCommand({
      TableName: 'classcast-submissions',
      Limit: 1
    });

    const result = await docClient.send(scanCommand);
    
    return NextResponse.json({
      success: true,
      message: 'DynamoDB connection successful',
      itemCount: result.Count,
      scannedCount: result.ScannedCount
    });

  } catch (error) {
    console.error('DynamoDB test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}
