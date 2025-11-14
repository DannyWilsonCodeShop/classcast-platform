import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    // Get students from database
    let students = [];
    
    try {
      const studentsResult = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: '#role = :role',
        ExpressionAttributeNames: {
          '#role': 'role'
        },
        ExpressionAttributeValues: {
          ':role': 'student'
        }
      }));
      
      students = studentsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        return NextResponse.json({
          success: true,
          data: [],
          total: 0
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      data: students,
      total: students.length
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}