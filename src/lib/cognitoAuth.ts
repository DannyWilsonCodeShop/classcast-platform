import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, ResendConfirmationCodeCommand, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from '@aws-sdk/client-cognito-identity';
import { jwtVerify } from 'jose';

import { awsConfig } from './aws-config';

const cognitoClient = new CognitoIdentityProviderClient({ region: awsConfig.region });
const identityClient = new CognitoIdentityClient({ region: awsConfig.region });

// Use unified configuration
const USER_POOL_ID = awsConfig.cognito.userPoolId;
const CLIENT_ID = awsConfig.cognito.clientId;
const IDENTITY_POOL_ID = awsConfig.cognito.identityPoolId;

export interface AuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  'custom:role': string;
  'custom:studentId'?: string;
  'custom:instructorId'?: string;
  'custom:department'?: string;
  email_verified: boolean;
}

export class CognitoAuthService {
  private static instance: CognitoAuthService;

  private constructor() {}

  public static getInstance(): CognitoAuthService {
    if (!CognitoAuthService.instance) {
      CognitoAuthService.instance = new CognitoAuthService();
    }
    return CognitoAuthService.instance;
  }

  // Sign in
  public async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });

      const response = await cognitoClient.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      const authResult = response.AuthenticationResult;
      
      return {
        accessToken: authResult.AccessToken!,
        idToken: authResult.IdToken!,
        refreshToken: authResult.RefreshToken!,
        expiresIn: authResult.ExpiresIn || 3600,
        tokenType: authResult.TokenType || 'Bearer'
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign up
  public async signUp(email: string, password: string, firstName: string, lastName: string, role: string, additionalAttributes?: Record<string, string>): Promise<string> {
    try {
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:role', Value: role }
      ];

      // Add additional custom attributes
      if (additionalAttributes) {
        Object.entries(additionalAttributes).forEach(([key, value]) => {
          userAttributes.push({ Name: key, Value: value });
        });
      }

      const command = new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: userAttributes
      });

      const response = await cognitoClient.send(command);
      return response.UserSub!;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Confirm sign up
  public async confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode
      });

      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  }

  // Resend confirmation code
  public async resendConfirmationCode(email: string): Promise<boolean> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: CLIENT_ID,
        Username: email
      });

      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      throw error;
    }
  }

  // Forgot password
  public async forgotPassword(email: string): Promise<boolean> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email
      });

      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Confirm forgot password
  public async confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<boolean> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword
      });

      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw error;
    }
  }

  // Sign out
  public async signOut(accessToken: string): Promise<boolean> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken
      });

      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Decode JWT token
  public decodeToken(token: string): any {
    try {
      const decoded = jwtVerify(token, new TextEncoder().encode('secret'));
      return decoded;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // Get user info from ID token
  public getUserInfo(idToken: string): UserInfo | null {
    try {
      const decoded = this.decodeToken(idToken);
      if (!decoded) return null;

      return {
        sub: decoded.sub,
        email: decoded.email,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        'custom:role': decoded['custom:role'] || 'student',
        'custom:studentId': decoded['custom:studentId'],
        'custom:instructorId': decoded['custom:instructorId'],
        'custom:department': decoded['custom:department'],
        email_verified: decoded.email_verified === 'true'
      };
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  // Check if token is expired
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Token expiration check error:', error);
      return true;
    }
  }

  // Refresh token
  public async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken
        }
      });

      const response = await cognitoClient.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed');
      }

      const authResult = response.AuthenticationResult;
      
      return {
        accessToken: authResult.AccessToken!,
        idToken: authResult.IdToken!,
        refreshToken: refreshToken, // Refresh token doesn't change
        expiresIn: authResult.ExpiresIn || 3600,
        tokenType: authResult.TokenType || 'Bearer'
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // Get AWS credentials for authenticated user
  public async getAWSCredentials(idToken: string): Promise<any> {
    try {
      // Get identity ID
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: IDENTITY_POOL_ID,
        Logins: {
          [`cognito-idp.${process.env.REGION || 'us-east-1'}.amazonaws.com/${USER_POOL_ID}`]: idToken
        }
      });

      const identityResponse = await identityClient.send(getIdCommand);
      const identityId = identityResponse.IdentityId;

      if (!identityId) {
        throw new Error('Failed to get identity ID');
      }

      // Get credentials
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
        Logins: {
          [`cognito-idp.${process.env.REGION || 'us-east-1'}.amazonaws.com/${USER_POOL_ID}`]: idToken
        }
      });

      const credentialsResponse = await identityClient.send(getCredentialsCommand);
      return credentialsResponse.Credentials;
    } catch (error) {
      console.error('Get AWS credentials error:', error);
      throw error;
    }
  }
}

export const cognitoAuthService = CognitoAuthService.getInstance();
