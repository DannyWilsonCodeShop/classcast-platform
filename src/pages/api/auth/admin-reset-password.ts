
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';

// Configure AWS (if available)
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newPassword, adminReset = false } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    console.log('🔍 Looking up user:', email);

    // Find user by email
    const userParams = {
      TableName: 'classcast-users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    };

    const userResult = await dynamodb.scan(userParams).promise();

    if (!userResult.Items || userResult.Items.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.Items[0];
    console.log('✅ User found:', user.name);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    const updateParams = {
      TableName: 'classcast-users',
      Key: {
        userId: user.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    console.log('✅ Password updated successfully');

    return res.status(200).json({
      message: 'Password reset successfully',
      user: {
        name: user.name,
        email: user.email,
        userId: user.userId
      }
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
