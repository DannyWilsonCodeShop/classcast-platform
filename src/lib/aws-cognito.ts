// AWS Cognito Authentication Service
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, GetUserCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
  emailVerified: boolean;
}

export interface AuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
}

export class AWSCognitoAuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      // Get user details
      const userDetails = await this.getUserDetails(response.AuthenticationResult.AccessToken!);
      
      return {
        user: userDetails,
        tokens: {
          accessToken: response.AuthenticationResult.AccessToken!,
          refreshToken: response.AuthenticationResult.RefreshToken!,
          idToken: response.AuthenticationResult.IdToken!,
        },
      };
    } catch (error) {
      console.error('AWS Cognito login error:', error);
      throw new Error('Invalid email or password');
    }
  }

  async signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'instructor' | 'admin';
    studentId?: string;
    instructorId?: string;
    department?: string;
  }): Promise<{ userId: string; email: string }> {
    try {
      const command = new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: userData.email,
        Password: userData.password,
        UserAttributes: [
          { Name: 'email', Value: userData.email },
          { Name: 'given_name', Value: userData.firstName },
          { Name: 'family_name', Value: userData.lastName },
          { Name: 'custom:role', Value: userData.role },
          ...(userData.studentId ? [{ Name: 'custom:student_id', Value: userData.studentId }] : []),
          ...(userData.instructorId ? [{ Name: 'custom:instructor_id', Value: userData.instructorId }] : []),
          ...(userData.department ? [{ Name: 'custom:department', Value: userData.department }] : []),
        ],
      });

      const response = await cognitoClient.send(command);
      
      return {
        userId: response.UserSub!,
        email: userData.email,
      };
    } catch (error) {
      console.error('AWS Cognito signup error:', error);
      throw new Error('Failed to create account. Please try again.');
    }
  }

  async confirmSignup(email: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await cognitoClient.send(command);
    } catch (error) {
      console.error('AWS Cognito confirm signup error:', error);
      throw new Error('Invalid confirmation code');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
      });

      await cognitoClient.send(command);
    } catch (error) {
      console.error('AWS Cognito forgot password error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(email: string, confirmationCode: string, newPassword: string): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await cognitoClient.send(command);
    } catch (error) {
      console.error('AWS Cognito reset password error:', error);
      throw new Error('Failed to reset password');
    }
  }

  async getUserDetails(accessToken: string): Promise<User> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await cognitoClient.send(command);
      
      const attributes = response.UserAttributes || [];
      const getAttribute = (name: string) => attributes.find(attr => attr.Name === name)?.Value || '';

      return {
        id: getAttribute('sub'),
        email: getAttribute('email'),
        firstName: getAttribute('given_name'),
        lastName: getAttribute('family_name'),
        role: (getAttribute('custom:role') as 'student' | 'instructor' | 'admin') || 'student',
        studentId: getAttribute('custom:student_id') || undefined,
        instructorId: getAttribute('custom:instructor_id') || undefined,
        department: getAttribute('custom:department') || undefined,
        emailVerified: getAttribute('email_verified') === 'true',
      };
    } catch (error) {
      console.error('AWS Cognito get user details error:', error);
      throw new Error('Failed to get user details');
    }
  }

  async changePassword(accessToken: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      });

      await cognitoClient.send(command);
    } catch (error) {
      console.error('AWS Cognito change password error:', error);
      throw new Error('Failed to change password');
    }
  }
}

export const awsCognitoAuthService = new AWSCognitoAuthService();
