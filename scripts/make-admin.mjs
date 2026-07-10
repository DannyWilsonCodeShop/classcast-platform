import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);

const result = await doc.send(new ScanCommand({
  TableName: 'classcast-users',
  FilterExpression: 'email = :email',
  ExpressionAttributeValues: { ':email': 'wilson.danny@me.com' },
}));

if (!result.Items || result.Items.length === 0) {
  console.log('User not found');
  process.exit(1);
}

const user = result.Items[0];
console.log('Found user:', user.userId, user.email);

await doc.send(new UpdateCommand({
  TableName: 'classcast-users',
  Key: { userId: user.userId },
  UpdateExpression: 'SET #role = :admin, isAdmin = :isTrue',
  ExpressionAttributeNames: { '#role': 'role' },
  ExpressionAttributeValues: { ':admin': 'admin', ':isTrue': true },
}));

console.log('✅ User updated to admin role');
