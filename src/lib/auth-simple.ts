import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Cognito client configuration
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Configuration from environment variables
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export enum UserStatus {
  UNCONFIRMED = 'UNCONFIRMED',
  CONFIRMED = 'CONFIRMED',
  ARCHIVED = 'ARCHIVED',
  COMPROMISED = 'COMPROMISED',
  UNKNOWN = 'UNKNOWN',
  RESET_REQUIRED = 'RESET_REQUIRED',
  FORCE_CHANGE_PASSWORD = 'FORCE_CHANGE_PASSWORD',
}

export interface CognitoUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  instructorId?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  status: UserStatus;
  enabled: boolean;
  createdAt: string;
  lastModifiedAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  instructorId?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  instructorId?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  enabled?: boolean;
}

class SimpleCognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private userPoolClientId: string;

  constructor() {
    this.client = cognitoClient;
    this.userPoolId = USER_POOL_ID;
    this.userPoolClientId = USER_POOL_CLIENT_ID;

    console.log('CognitoAuthService initialized with:', {
      userPoolId: this.userPoolId,
      userPoolClientId: this.userPoolClientId,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    if (!this.userPoolId || !this.userPoolClientId) {
      console.error('Cognito User Pool ID or Client ID is not configured.');
      console.error('Available env vars:', {
        COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        COGNITO_USER_POOL_CLIENT_ID: process.env.COGNITO_USER_POOL_CLIENT_ID,
        NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      });
      throw new Error('Cognito configuration missing.');
    }
  }

  async createUser(request: CreateUserRequest): Promise<CognitoUser> {
    try {
      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: request.email },
        { Name: 'given_name', Value: request.firstName },
        { Name: 'family_name', Value: request.lastName },
        { Name: 'custom:role', Value: request.role },
      ];

      if (request.instructorId) {
        userAttributes.push({ Name: 'custom:instructorId', Value: request.instructorId });
      }
      if (request.department) {
        userAttributes.push({ Name: 'custom:department', Value: request.department });
      }
      if (request.bio) {
        userAttributes.push({ Name: 'custom:bio', Value: request.bio });
      }
      if (request.avatar) {
        userAttributes.push({ Name: 'custom:avatar', Value: request.avatar });
      }
      if (request.phoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: request.phoneNumber });
      }

      // Create user using SignUpCommand for self-registration
      const createCommand = new SignUpCommand({
        ClientId: this.userPoolClientId,
        Username: request.username,
        Password: request.password,
        UserAttributes: userAttributes,
      });

      const createResponse = await this.client.send(createCommand);

      if (!createResponse.UserSub) {
        throw new Error('Failed to create user');
      }

      // Check if user needs email verification
      const needsConfirmation = createResponse.CodeDeliveryDetails && 
        createResponse.CodeDeliveryDetails.Destination && 
        createResponse.CodeDeliveryDetails.DeliveryMedium === 'EMAIL';

      if (needsConfirmation) {
        console.log('User created but needs email verification:', createResponse.UserSub);
        console.log('Verification code sent to:', createResponse.CodeDeliveryDetails.Destination);
      }

      // Return a basic user object
      return {
        username: request.username,
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        role: request.role as UserRole,
        instructorId: request.instructorId,
        department: request.department,
        bio: request.bio,
        avatar: request.avatar,
        phoneNumber: request.phoneNumber,
        status: needsConfirmation ? UserStatus.UNCONFIRMED : UserStatus.CONFIRMED,
        enabled: true,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async confirmUser(username: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.userPoolClientId,
        Username: username,
        ConfirmationCode: confirmationCode,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error confirming user:', error);
      throw new Error(`Failed to confirm user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resendConfirmationCode(username: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.userPoolClientId,
        Username: username,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error resending confirmation code:', error);
      throw new Error(`Failed to resend confirmation code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: CognitoUser }> {
    try {
      const authCommand = new InitiateAuthCommand({
        ClientId: this.userPoolClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const authResponse = await this.client.send(authCommand);

      if (!authResponse.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      // Get user details
      const getUserCommand = new GetUserCommand({
        AccessToken: authResponse.AuthenticationResult.AccessToken!,
      });

      const userResponse = await this.client.send(getUserCommand);

      // Map Cognito user to our user format
      const user = this.mapCognitoUserToAppUser(userResponse);

      return {
        accessToken: authResponse.AuthenticationResult.AccessToken!,
        refreshToken: authResponse.AuthenticationResult.RefreshToken!,
        user,
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapCognitoUserToAppUser(cognitoUser: any): CognitoUser {
    const attributes = cognitoUser.UserAttributes || [];
    const attributeMap: { [key: string]: string } = {};
    
    attributes.forEach((attr: any) => {
      attributeMap[attr.Name] = attr.Value;
    });

    return {
      username: cognitoUser.Username || '',
      email: attributeMap.email || '',
      firstName: attributeMap.given_name || '',
      lastName: attributeMap.family_name || '',
      role: (attributeMap['custom:role'] as UserRole) || UserRole.STUDENT,
      instructorId: attributeMap['custom:instructorId'],
      department: attributeMap['custom:department'],
      bio: attributeMap['custom:bio'],
      avatar: attributeMap['custom:avatar'],
      phoneNumber: attributeMap.phone_number,
      status: UserStatus.CONFIRMED, // Assume confirmed if we can get user details
      enabled: true,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const simpleCognitoAuthService = new SimpleCognitoAuthService();

// Export for use in other modules
export const createUser = (userData: Parameters<SimpleCognitoAuthService['createUser']>[0]) => 
  simpleCognitoAuthService.createUser(userData);

export const confirmUser = (username: string, confirmationCode: string) => 
  simpleCognitoAuthService.confirmUser(username, confirmationCode);

export const resendConfirmationCode = (username: string) => 
  simpleCognitoAuthService.resendConfirmationCode(username);

export const login = (username: string, password: string) => 
  simpleCognitoAuthService.login(username, password);
