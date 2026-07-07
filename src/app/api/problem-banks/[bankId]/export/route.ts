import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BANKS_TABLE = 'classcast-problem-banks';
const PROBLEMS_TABLE = 'classcast-problems';

export async function GET(request: NextRequest, { params }: { params: { bankId: string } }) {
  try {
    const { bankId } = params;

    // Fetch bank for the title
    const bankResult = await docClient.send(new GetCommand({
      TableName: BANKS_TABLE,
      Key: { bankId },
    }));
    if (!bankResult.Item) {
      return NextResponse.json({ success: false, error: 'Problem bank not found' }, { status: 404 });
    }

    // Fetch problems
    const problemsResult = await docClient.send(new QueryCommand({
      TableName: PROBLEMS_TABLE,
      IndexName: 'bankId-index',
      KeyConditionExpression: 'bankId = :bankId',
      ExpressionAttributeValues: { ':bankId': bankId },
      ScanIndexForward: true,
    }));
    const problems = problemsResult.Items || [];

    // Build CSV
    const csvLines = ['#,Problem Text,Image URL'];
    problems.forEach((p: any, idx: number) => {
      const text = (p.content || '').replace(/"/g, '""');
      const imageUrl = p.imageUrl || '';
      csvLines.push(`${idx + 1},"${text}",${imageUrl}`);
    });

    const csvContent = csvLines.join('\n');
    const fileName = `${bankResult.Item.title.replace(/[^a-zA-Z0-9]/g, '_')}_problems.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting problem bank:', error);
    return NextResponse.json({ success: false, error: 'Failed to export bank' }, { status: 500 });
  }
}
