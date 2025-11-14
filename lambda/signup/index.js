const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });

const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_uK50qBrap';
const USER_POOL_CLIENT_ID = process.env.CLIENT_ID || '7tbaq74itv3gdda1bt25iqafvh';

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { email, firstName, lastName, password, role, studentId, department } = body;

        // Basic validation
        if (!email || !password || !firstName || !lastName || !role) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Missing required fields' } })
            };
        }

        if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Invalid role specified' } })
            };
        }

        if (role === 'instructor' && !department) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Department is required for instructor role' } })
            };
        }

        // Password validation
        if (password.length < 8) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Password must be at least 8 characters long' } })
            };
        }

        // Create user in Cognito with auto-confirmation
        const createUserCommand = new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'given_name', Value: firstName },
                { Name: 'family_name', Value: lastName },
                { Name: 'email_verified', Value: 'true' }
            ],
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS'
        });

        console.log('Creating user in Cognito:', email);
        const createUserResult = await cognitoClient.send(createUserCommand);
        console.log('Cognito user creation result:', createUserResult);

        // Set permanent password
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            Password: password,
            Permanent: true
        });

        await cognitoClient.send(setPasswordCommand);

        // Create user profile in DynamoDB
        // Normalize email to lowercase for consistency
        const normalizedEmail = email.toLowerCase().trim();

        const userProfile = {
            userId: { S: normalizedEmail },
            email: { S: normalizedEmail },
            firstName: { S: firstName },
            lastName: { S: lastName },
            role: { S: role },
            status: { S: 'active' },
            enabled: { BOOL: true },
            schoolLogo: { S: '/logos/cristo-rey-atlanta.png' }, // Default school logo
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() },
            lastLogin: { S: new Date().toISOString() },
            preferences: {
                M: {
                    notifications: {
                        M: {
                            email: { BOOL: true },
                            push: { BOOL: false }
                        }
                    }
                }
            }
        };

        if (role === 'student' && studentId) {
            userProfile.studentId = { S: studentId };
        }

        if (role === 'instructor') {
            userProfile.instructorId = { S: `INS-${Date.now()}` };
            if (department) {
                userProfile.department = { S: department };
            }
        }

        const putItemCommand = new PutItemCommand({
            TableName: 'classcast-users',
            Item: userProfile
        });

        await dynamoDBClient.send(putItemCommand);

        console.log('User created successfully in Cognito:', createUserResult.User.Username);
        console.log('User profile created in DynamoDB for:', email);

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                message: 'Account created successfully! You can now log in immediately.',
                user: {
                    id: email,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    role: role,
                    emailVerified: true
                },
                nextStep: 'login',
                needsVerification: false,
                requiresEmailConfirmation: false
            })
        };

    } catch (error) {
        console.error('Signup error:', error);
        
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
                    message: 'Failed to create auto-confirmed user: ' + error.message
                }
            })
        };
    }
};
