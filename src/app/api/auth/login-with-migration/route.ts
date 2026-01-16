import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { generateTokens } from '@/lib/jwt';
import { cognitoAuthService } from '@/lib/cognitoAuth';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

/**
 * Login endpoint with Cognito to JWT lazy migration support
 * 
 * Flow:
 * 1. Try JWT authentication (DynamoDB lookup)
 * 2. If user not found, try Cognito authentication
 * 3. If Cognito succeeds, migrate user's password to DynamoDB
 * 4. Return JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN WITH MIGRATION API CALLED ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login request:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();

    // ========================================================================
    // STEP 1: Try JWT authentication (DynamoDB)
    // ========================================================================
    console.log('Step 1: Checking DynamoDB for user...');
    
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': sanitizedEmail
      }
    }));

    if (userResult.Items && userResult.Items.length > 0) {
      const userData = userResult.Items[0];
      console.log('Found user in DynamoDB:', userData.userId);
      
      // Check if user has a password (migrated) or needs migration
      if (userData.password) {
        // User has been migrated - use JWT authentication
        console.log('User has password - using JWT authentication');
        
        const passwordMatch = await bcrypt.compare(sanitizedPassword, userData.password);
        
        if (!passwordMatch) {
          console.log('Password mismatch');
          return NextResponse.json(
            { success: false, error: 'Invalid email or password' },
            { status: 401 }
          );
        }
        
        // Create user object
        const user = {
          id: userData.userId,
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'student',
          avatar: userData.avatar || '/api/placeholder/40/40',
          emailVerified: userData.emailVerified || false,
          bio: userData.bio || '',
          careerGoals: userData.careerGoals || '',
          classOf: userData.classOf || '',
          funFact: userData.funFact || '',
          favoriteSubject: userData.favoriteSubject || '',
          hobbies: userData.hobbies || '',
          schoolName: userData.schoolName || '',
          studentId: userData.studentId,
          instructorId: userData.instructorCode,
          department: userData.department || '',
        };
        
        // Generate JWT tokens
        const tokens = generateTokens({
          id: user.id,
          email: user.email,
          role: user.role,
        });

        return NextResponse.json({
          success: true,
          user,
          tokens,
        });
      } else {
        // User exists but no password - needs migration from Cognito
        console.log('User exists but no password - attempting Cognito migration');
        
        try {
          // Try to authenticate with Cognito
          const cognitoResult = await cognitoAuthService.signIn(sanitizedEmail, sanitizedPassword);
          console.log('Cognito authentication successful - migrating password');
          
          // Hash the password
          const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
          
          // Update user in DynamoDB with password
          await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId: userData.userId },
            UpdateExpression: 'SET password = :password, passwordMigrated = :migrated, passwordMigrationDate = :date, updatedAt = :updated',
            ExpressionAttributeValues: {
              ':password': hashedPassword,
              ':migrated': true,
              ':date': new Date().toISOString(),
              ':updated': new Date().toISOString()
            }
          }));
          
          console.log('Password migrated successfully for user:', userData.userId);
          
          // Create user object
          const user = {
            id: userData.userId,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            role: userData.role || 'student',
            avatar: userData.avatar || '/api/placeholder/40/40',
            emailVerified: userData.emailVerified || false,
            bio: userData.bio || '',
            careerGoals: userData.careerGoals || '',
            classOf: userData.classOf || '',
            funFact: userData.funFact || '',
            favoriteSubject: userData.favoriteSubject || '',
            hobbies: userData.hobbies || '',
            schoolName: userData.schoolName || '',
            studentId: userData.studentId,
            instructorId: userData.instructorCode,
            department: userData.department || '',
          };
          
          // Generate JWT tokens
          const tokens = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
          });

          return NextResponse.json({
            success: true,
            user,
            tokens,
            migrated: true, // Indicate that migration occurred
          });
          
        } catch (cognitoError) {
          console.error('Cognito authentication failed:', cognitoError);
          return NextResponse.json(
            { success: false, error: 'Invalid email or password' },
            { status: 401 }
          );
        }
      }
    }

    // ========================================================================
    // STEP 2: User not in DynamoDB - try Cognito authentication
    // ========================================================================
    console.log('Step 2: User not in DynamoDB - trying Cognito...');
    
    try {
      const cognitoResult = await cognitoAuthService.signIn(sanitizedEmail, sanitizedPassword);
      console.log('Cognito authentication successful - creating new user in DynamoDB');
      
      // Get user info from Cognito token
      const userInfo = cognitoAuthService.getUserInfo(cognitoResult.idToken);
      
      if (!userInfo) {
        throw new Error('Failed to get user info from Cognito token');
      }
      
      // Generate new user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
      
      // Create user in DynamoDB
      const newUserData = {
        userId,
        email: sanitizedEmail,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        role: userInfo['custom:role'] || 'student',
        password: hashedPassword,
        emailVerified: userInfo.email_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Migration metadata
        migratedFromCognito: true,
        cognitoSub: userInfo.sub,
        migrationDate: new Date().toISOString(),
        migrationStrategy: 'lazy',
        passwordMigrated: true,
        passwordMigrationDate: new Date().toISOString(),
        
        // Role-specific fields
        ...(userInfo['custom:role'] === 'student' && userInfo['custom:studentId'] && {
          studentId: userInfo['custom:studentId']
        }),
        ...(userInfo['custom:role'] === 'instructor' && {
          department: userInfo['custom:department'] || '',
          instructorCode: userInfo['custom:instructorId'] || `INS-${Date.now()}`
        }),
      };
      
      // Save to DynamoDB
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET #email = :email, firstName = :firstName, lastName = :lastName, #role = :role, password = :password, emailVerified = :emailVerified, createdAt = :createdAt, updatedAt = :updatedAt, migratedFromCognito = :migrated, cognitoSub = :sub, migrationDate = :migrationDate, migrationStrategy = :strategy, passwordMigrated = :passwordMigrated, passwordMigrationDate = :passwordMigrationDate',
        ExpressionAttributeNames: {
          '#email': 'email',
          '#role': 'role'
        },
        ExpressionAttributeValues: {
          ':email': newUserData.email,
          ':firstName': newUserData.firstName,
          ':lastName': newUserData.lastName,
          ':role': newUserData.role,
          ':password': newUserData.password,
          ':emailVerified': newUserData.emailVerified,
          ':createdAt': newUserData.createdAt,
          ':updatedAt': newUserData.updatedAt,
          ':migrated': newUserData.migratedFromCognito,
          ':sub': newUserData.cognitoSub,
          ':migrationDate': newUserData.migrationDate,
          ':strategy': newUserData.migrationStrategy,
          ':passwordMigrated': newUserData.passwordMigrated,
          ':passwordMigrationDate': newUserData.passwordMigrationDate
        }
      }));
      
      console.log('User migrated successfully:', userId);
      
      // Create user object
      const user = {
        id: userId,
        email: newUserData.email,
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        role: newUserData.role,
        avatar: '/api/placeholder/40/40',
        emailVerified: newUserData.emailVerified,
        bio: '',
        careerGoals: '',
        classOf: '',
        funFact: '',
        favoriteSubject: '',
        hobbies: '',
        schoolName: '',
        studentId: newUserData.studentId,
        instructorId: newUserData.instructorCode,
        department: newUserData.department || '',
      };
      
      // Generate JWT tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return NextResponse.json({
        success: true,
        user,
        tokens,
        migrated: true, // Indicate that migration occurred
      });
      
    } catch (cognitoError) {
      console.error('Cognito authentication failed:', cognitoError);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Login request error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error. Please try again later'
      },
      { status: 500 }
    );
  }
}
