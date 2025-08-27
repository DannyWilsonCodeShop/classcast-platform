import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand,
  AdminListUsersCommand,
  AdminListUsersInGroupCommand,
  AdminGetGroupCommand,
  AdminListGroupsCommand,
  AdminCreateGroupCommand,
  AdminUpdateGroupCommand,
  AdminDeleteGroupCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
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
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || '';
const USER_POOL_DOMAIN = process.env.COGNITO_USER_POOL_DOMAIN || '';

// User roles
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  TA = 'ta',
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

// User interface
export interface CognitoUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentId?: string;
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

// Create user request
export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentId?: string;
  instructorId?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  temporaryPassword?: string;
}

// Update user request
export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  studentId?: string;
  instructorId?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  enabled?: boolean;
}

// Authentication service class
export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private userPoolClientId: string;

  constructor() {
    this.client = cognitoClient;
    this.userPoolId = USER_POOL_ID;
    this.userPoolClientId = USER_POOL_CLIENT_ID;
  }

  // Create a new user (admin only)
  async createUser(request: CreateUserRequest): Promise<CognitoUser> {
    try {
      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: request.email },
        { Name: 'given_name', Value: request.firstName },
        { Name: 'family_name', Value: request.lastName },
        { Name: 'custom:role', Value: request.role },
        { Name: 'email_verified', Value: 'true' },
      ];

      if (request.studentId) {
        userAttributes.push({ Name: 'custom:studentId', Value: request.studentId });
      }
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
        userAttributes.push({ Name: 'phone_number_verified', Value: 'false' });
      }

      // Create user
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: request.username,
        UserAttributes: userAttributes,
        TemporaryPassword: request.temporaryPassword || this.generateTemporaryPassword(),
        MessageAction: 'SUPPRESS', // Don't send welcome email
        DesiredDeliveryMediums: ['EMAIL'],
      });

      const createResponse = await this.client.send(createCommand);

      if (!createResponse.User) {
        throw new Error('Failed to create user');
      }

      // Add user to appropriate group
      await this.addUserToGroup(request.username, request.role);

      // Get the created user
      const user = await this.getUser(request.username);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user by username
  async getUser(username: string): Promise<CognitoUser> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);
      
      if (!response.User) {
        throw new Error('User not found');
      }

      return this.mapCognitoUserToUser(response.User);
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update user attributes
  async updateUser(username: string, updates: UpdateUserRequest): Promise<CognitoUser> {
    try {
      const userAttributes = [];

      if (updates.email !== undefined) {
        userAttributes.push({ Name: 'email', Value: updates.email });
      }
      if (updates.firstName !== undefined) {
        userAttributes.push({ Name: 'given_name', Value: updates.firstName });
      }
      if (updates.lastName !== undefined) {
        userAttributes.push({ Name: 'family_name', Value: updates.lastName });
      }
      if (updates.role !== undefined) {
        userAttributes.push({ Name: 'custom:role', Value: updates.role });
      }
      if (updates.studentId !== undefined) {
        userAttributes.push({ Name: 'custom:studentId', Value: updates.studentId });
      }
      if (updates.instructorId !== undefined) {
        userAttributes.push({ Name: 'custom:instructorId', Value: updates.instructorId });
      }
      if (updates.department !== undefined) {
        userAttributes.push({ Name: 'custom:department', Value: updates.department });
      }
      if (updates.bio !== undefined) {
        userAttributes.push({ Name: 'custom:bio', Value: updates.bio });
      }
      if (updates.avatar !== undefined) {
        userAttributes.push({ Name: 'custom:avatar', Value: updates.avatar });
      }
      if (updates.phoneNumber !== undefined) {
        userAttributes.push({ Name: 'phone_number', Value: updates.phoneNumber });
      }

      if (userAttributes.length > 0) {
        const updateCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: this.userPoolId,
          Username: username,
          UserAttributes: userAttributes,
        });

        await this.client.send(updateCommand);
      }

      // Update user status if needed
      if (updates.enabled !== undefined) {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: username,
          Password: 'temp', // This will be ignored
          Permanent: true,
        });

        await this.client.send(setPasswordCommand);
      }

      // Get updated user
      return await this.getUser(username);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete user
  async deleteUser(username: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List all users
  async listUsers(limit: number = 60, paginationToken?: string): Promise<{
    users: CognitoUser[];
    paginationToken?: string;
  }> {
    try {
      const command = new AdminListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit,
        PaginationToken: paginationToken,
      });

      const response = await this.client.send(command);
      
      const users = response.Users?.map(user => this.mapCognitoUserToUser(user)) || [];

      return {
        users,
        paginationToken: response.PaginationToken,
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw new Error(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List users by group
  async listUsersByGroup(groupName: string, limit: number = 60, paginationToken?: string): Promise<{
    users: CognitoUser[];
    paginationToken?: string;
  }> {
    try {
      const command = new AdminListUsersInGroupCommand({
        UserPoolId: this.userPoolId,
        GroupName: groupName,
        Limit: limit,
        NextToken: paginationToken,
      });

      const response = await this.client.send(command);
      
      const users = response.Users?.map(user => this.mapCognitoUserToUser(user)) || [];

      return {
        users,
        paginationToken: response.NextToken,
      };
    } catch (error) {
      console.error('Error listing users by group:', error);
      throw new Error(`Failed to list users by group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add user to group
  async addUserToGroup(username: string, groupName: string): Promise<void> {
    try {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: groupName,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw new Error(`Failed to add user to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Remove user from group
  async removeUserFromGroup(username: string, groupName: string): Promise<void> {
    try {
      const command = new AdminRemoveUserFromGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: groupName,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw new Error(`Failed to remove user from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user groups
  async getUserGroups(username: string): Promise<string[]> {
    try {
      const command = new AdminListGroupsForUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);
      
      return response.Groups?.map(group => group.GroupName || '') || [];
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw new Error(`Failed to get user groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // List all groups
  async listGroups(limit: number = 60, paginationToken?: string): Promise<{
    groups: Array<{ name: string; description?: string; precedence: number }>;
    paginationToken?: string;
  }> {
    try {
      const command = new AdminListGroupsCommand({
        UserPoolId: this.userPoolId,
        Limit: limit,
        NextToken: paginationToken,
      });

      const response = await this.client.send(command);
      
      const groups = response.Groups?.map(group => ({
        name: group.GroupName || '',
        description: group.Description,
        precedence: group.Precedence || 0,
      })) || [];

      return {
        groups,
        paginationToken: response.NextToken,
      };
    } catch (error) {
      console.error('Error listing groups:', error);
      throw new Error(`Failed to list groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Set user password
  async setUserPassword(username: string, password: string, permanent: boolean = true): Promise<void> {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: password,
        Permanent: permanent,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error setting user password:', error);
      throw new Error(`Failed to set user password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enable/disable user
  async setUserStatus(username: string, enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        // Enable user by setting a temporary password
        await this.setUserPassword(username, this.generateTemporaryPassword(), false);
      } else {
        // Disable user by setting an invalid password
        await this.setUserPassword(username, 'DISABLED_' + Date.now(), false);
      }
    } catch (error) {
      console.error('Error setting user status:', error);
      throw new Error(`Failed to set user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.listUsers(1);
      return true;
    } catch (error) {
      console.error('Cognito health check failed:', error);
      return false;
    }
  }

  // Helper methods
  private mapCognitoUserToUser(cognitoUser: any): CognitoUser {
    const attributes = cognitoUser.Attributes || [];
    const attributeMap = attributes.reduce((acc: any, attr: any) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {});

    return {
      username: cognitoUser.Username || '',
      email: attributeMap.email || '',
      firstName: attributeMap.given_name || '',
      lastName: attributeMap.family_name || '',
      role: (attributeMap['custom:role'] as UserRole) || UserRole.STUDENT,
      studentId: attributeMap['custom:studentId'],
      instructorId: attributeMap['custom:instructorId'],
      department: attributeMap['custom:department'],
      bio: attributeMap['custom:bio'],
      avatar: attributeMap['custom:avatar'],
      phoneNumber: attributeMap.phone_number,
      status: this.mapCognitoStatus(cognitoUser.UserStatus),
      enabled: cognitoUser.Enabled || false,
      createdAt: cognitoUser.UserCreateDate?.toISOString() || '',
      lastModifiedAt: cognitoUser.UserLastModifiedDate?.toISOString() || '',
      lastLoginAt: attributeMap['custom:lastLoginAt'],
    };
  }

  private mapCognitoStatus(cognitoStatus: string): UserStatus {
    switch (cognitoStatus) {
      case 'CONFIRMED':
        return UserStatus.ACTIVE;
      case 'UNCONFIRMED':
        return UserStatus.PENDING;
      case 'ARCHIVED':
        return UserStatus.DELETED;
      case 'COMPROMISED':
        return UserStatus.SUSPENDED;
      case 'UNKNOWN':
        return UserStatus.INACTIVE;
      default:
        return UserStatus.INACTIVE;
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Export singleton instance
export const cognitoAuthService = new CognitoAuthService();

// Export for use in other modules
export default cognitoAuthService;
