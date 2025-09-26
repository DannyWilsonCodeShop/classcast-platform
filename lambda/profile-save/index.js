const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const BUCKET_NAME = 'cdk-hnb659fds-assets-463470937777-us-east-1';

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userId, ...profileData } = body;

        if (!userId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'User ID is required' } })
            };
        }

        // Handle avatar upload if present
        let avatarUrl = profileData.avatar;
        if (profileData.avatar && profileData.avatar.startsWith('data:image/')) {
            try {
                // Extract base64 data
                const base64Data = profileData.avatar.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Generate unique filename
                const timestamp = Date.now();
                const filename = `avatar_${userId}_${timestamp}.jpg`;
                const key = `profile-pictures/${filename}`;

                // Upload to S3
                const uploadCommand = new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: key,
                    Body: buffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read'
                });

                await s3Client.send(uploadCommand);
                avatarUrl = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;
            } catch (uploadError) {
                console.error('Avatar upload error:', uploadError);
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS'
                    },
                    body: JSON.stringify({ error: { message: 'Failed to upload avatar' } })
                };
            }
        }

        // Prepare update expression
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        // Add updatedAt
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = { S: new Date().toISOString() };

        // Process each field
        const allowedFields = [
            'firstName', 'lastName', 'bio', 'schoolName', 'favoriteSubject', 
            'funFact', 'hobbies', 'department', 'avatar'
        ];

        for (const [key, value] of Object.entries(profileData)) {
            if (allowedFields.includes(key) && value !== undefined && value !== null) {
                const attributeName = `#${key}`;
                const attributeValue = `:${key}`;
                
                updateExpression.push(`${attributeName} = ${attributeValue}`);
                expressionAttributeNames[attributeName] = key;
                
                if (key === 'avatar') {
                    expressionAttributeValues[attributeValue] = { S: avatarUrl };
                } else {
                    expressionAttributeValues[attributeValue] = { S: String(value) };
                }
            }
        }

        if (updateExpression.length === 1) { // Only updatedAt
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Profile updated successfully',
                    user: { ...profileData, avatar: avatarUrl }
                })
            };
        }

        // Update DynamoDB
        const updateCommand = new UpdateItemCommand({
            TableName: 'classcast-users',
            Key: {
                userId: { S: userId }
            },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        });

        const result = await dynamoDBClient.send(updateCommand);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                message: 'Profile updated successfully',
                user: { ...profileData, avatar: avatarUrl }
            })
        };

    } catch (error) {
        console.error('Profile save error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                error: {
                    message: 'Failed to save profile: ' + error.message
                }
            })
        };
    }
};
