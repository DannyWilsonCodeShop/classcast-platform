import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import bcrypt from 'bcryptjs';

// Configure AWS
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    console.log('🔍 Processing password reset with token:', token);

    // Find and validate reset token
    const tokenParams = {
      TableName: 'password-reset-tokens',
      Key: {
        token: token
      }
    };

    const tokenResult = await dynamodb.get(tokenParams).promise();

    if (!tokenResult.Item) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetData = tokenResult.Item;

    // Check if token is expired
    if (new Date() > new Date(resetData.expiresAt)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Check if token has been used
    if (resetData.used) {
      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    console.log('✅ Valid reset token for user:', resetData.email);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    const updateParams = {
      TableName: 'classcast-users',
      Key: {
        userId: resetData.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    // Mark token as used
    const markUsedParams = {
      TableName: 'password-reset-tokens',
      Key: {
        token: token
      },
      UpdateExpression: 'SET used = :used, usedAt = :usedAt',
      ExpressionAttributeValues: {
        ':used': true,
        ':usedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(markUsedParams).promise();

    console.log('✅ Password reset completed for:', resetData.email);

    return res.status(200).json({
      message: 'Password reset successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}