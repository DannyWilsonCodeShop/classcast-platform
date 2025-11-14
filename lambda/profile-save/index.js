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

        // Handle avatar - ONLY S3 URLs, NO base64 processing
        let avatarUrl = '';
        
        // Only accept S3 URLs, ignore any base64 data
        if (profileData.avatar && profileData.avatar.startsWith('https://')) {
            avatarUrl = profileData.avatar;
        }
        // If it's base64 data, ignore it completely
        else if (profileData.avatar && profileData.avatar.startsWith('data:image/')) {
            console.log('Ignoring base64 avatar data - only S3 URLs accepted');
            avatarUrl = '';
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
            'funFact', 'hobbies', 'department', 'avatar', 'careerGoals', 
            'classOf', 'yearsExperience'
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
