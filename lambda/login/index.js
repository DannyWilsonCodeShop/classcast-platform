const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });

const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_uK50qBrap';
const USER_POOL_CLIENT_ID = process.env.CLIENT_ID || '7tbaq74itv3gdda1bt25iqafvh';

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Basic validation
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Email and password are required' } })
            };
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Please enter a valid email address' } })
            };
        }

        // Password length validation
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

        // Authenticate with Cognito
        const authCommand = new InitiateAuthCommand({
            ClientId: USER_POOL_CLIENT_ID,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        const authResponse = await cognitoClient.send(authCommand);

        if (!authResponse.AuthenticationResult) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: { message: 'Invalid email or password' } })
            };
        }

        // Get user details
        const getUserCommand = new GetUserCommand({
            AccessToken: authResponse.AuthenticationResult.AccessToken,
        });

        const userResponse = await cognitoClient.send(getUserCommand);

        // Map user attributes
        const userAttributes = userResponse.UserAttributes || [];
        const emailAttr = userAttributes.find(attr => attr.Name === 'email')?.Value || email;
        const firstNameAttr = userAttributes.find(attr => attr.Name === 'given_name')?.Value || '';
        const lastNameAttr = userAttributes.find(attr => attr.Name === 'family_name')?.Value || '';
        const roleAttr = userAttributes.find(attr => attr.Name === 'custom:role')?.Value || 'student';
        const emailVerified = userAttributes.find(attr => attr.Name === 'email_verified')?.Value === 'true';

        // Get additional user data from DynamoDB
        let userProfile = null;
        try {
            const getItemCommand = new GetItemCommand({
                TableName: 'classcast-users',
                Key: {
                    userId: { S: email }
                }
            });

            const dbResponse = await dynamoDBClient.send(getItemCommand);
            if (dbResponse.Item) {
                userProfile = {
                    studentId: dbResponse.Item.studentId?.S,
                    instructorId: dbResponse.Item.instructorId?.S,
                    department: dbResponse.Item.department?.S,
                    avatar: dbResponse.Item.avatar?.S,
                    bio: dbResponse.Item.bio?.S,
                    schoolName: dbResponse.Item.schoolName?.S,
                    favoriteSubject: dbResponse.Item.favoriteSubject?.S,
                    funFact: dbResponse.Item.funFact?.S,
                    hobbies: dbResponse.Item.hobbies?.S
                };
            }
        } catch (dbError) {
            console.log('Could not fetch user profile from DynamoDB:', dbError.message);
        }

        // Check if email is verified
        if (!emailVerified) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ 
                    error: { 
                        message: 'Email not verified',
                        code: 'EMAIL_NOT_VERIFIED',
                        email: emailAttr
                    } 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                message: 'Login successful',
                user: {
                    id: userResponse.Username,
                    email: emailAttr,
                    firstName: firstNameAttr,
                    lastName: lastNameAttr,
                    role: roleAttr,
                    studentId: userProfile?.studentId,
                    instructorId: userProfile?.instructorId,
                    department: userProfile?.department,
                    avatar: userProfile?.avatar,
                    bio: userProfile?.bio,
                    schoolName: userProfile?.schoolName,
                    favoriteSubject: userProfile?.favoriteSubject,
                    funFact: userProfile?.funFact,
                    hobbies: userProfile?.hobbies,
                    emailVerified: emailVerified,
                },
                tokens: {
                    accessToken: authResponse.AuthenticationResult.AccessToken,
                    refreshToken: authResponse.AuthenticationResult.RefreshToken,
                    idToken: authResponse.AuthenticationResult.IdToken || authResponse.AuthenticationResult.AccessToken,
                    expiresIn: authResponse.AuthenticationResult.ExpiresIn || 3600,
                },
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        
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
                    message: 'Authentication failed: ' + error.message
                }
            })
        };
    }
};
