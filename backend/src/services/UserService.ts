// ============================================================================
// USER SERVICE - Handles all user-related business logic
// ============================================================================

import { BaseService } from './BaseService';
import { 
  User, 
  Student, 
  Instructor, 
  UserDBItem, 
  RegisterRequest,
  ApiResponse 
} from '../types';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

export class UserService extends BaseService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;

  constructor() {
    super(process.env['USERS_TABLE_NAME'] || 'Users');
    this.cognitoClient = new CognitoIdentityProviderClient({});
    this.userPoolId = process.env['COGNITO_USER_POOL_ID'] || '';
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userItem = await this.getItem<UserDBItem>(`USER#${userId}`, 'PROFILE');
      if (!userItem) return null;

      return this.mapDBItemToUser(userItem);
    } catch (error) {
      this.handleError(error, 'getUserById');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userItem = await this.getItem<UserDBItem>(`EMAIL#${email}`, 'USER');
      if (!userItem) return null;

      return this.mapDBItemToUser(userItem);
    } catch (error) {
      this.handleError(error, 'getUserByEmail');
    }
  }

  async createUser(userData: RegisterRequest): Promise<User> {
    try {
      this.validateRequired(userData, ['email', 'password', 'firstName', 'lastName', 'role']);
      this.validateEmail(userData.email);
      this.validatePassword(userData.password);

      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user in Cognito
      const cognitoUser = await this.createCognitoUser(userData);
      
      // Create user in DynamoDB
      const userId = this.generateId('user');
      const userDBItem: UserDBItem = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        GSI1PK: `EMAIL#${userData.email}`,
        GSI1SK: 'USER',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Student specific fields
        ...(userData.role === 'student' && {
          studentId: this.generateId('student'),
          instructorId: userData.instructorId,
          department: userData.department
        }),
        // Instructor specific fields
        ...(userData.role === 'instructor' && {
          instructorId: this.generateId('instructor'),
          department: userData.department || 'General'
        })
      };

      await this.putItem(userDBItem);

      return this.mapDBItemToUser(userDBItem);
    } catch (error) {
      this.handleError(error, 'createUser');
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userItem = await this.getItem<UserDBItem>(`USER#${userId}`, 'PROFILE');
      if (!userItem) {
        throw new Error('User not found');
      }

      // Update DynamoDB item
      const updatedItem = await this.updateItem<UserDBItem>(
        `USER#${userId}`,
        'PROFILE',
        updates
      );

      return this.mapDBItemToUser(updatedItem);
    } catch (error) {
      this.handleError(error, 'updateUser');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const userItem = await this.getItem<UserDBItem>(`USER#${userId}`, 'PROFILE');
      if (!userItem) {
        throw new Error('User not found');
      }

      // Delete from DynamoDB
      await this.deleteItem(`USER#${userId}`, 'PROFILE');

      // TODO: Delete from Cognito (requires admin privileges)
    } catch (error) {
      this.handleError(error, 'deleteUser');
    }
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  async updateProfile(userId: string, profileData: Partial<Student | Instructor>): Promise<User> {
    try {
      const allowedFields = [
        'bio', 'careerGoals', 'classOf', 'funFact', 'favoriteSubject', 
        'hobbies', 'schoolName', 'expertise', 'yearsExperience'
      ];

      const filteredUpdates = Object.keys(profileData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = profileData[key];
          return obj;
        }, {} as any);

      return await this.updateUser(userId, filteredUpdates);
    } catch (error) {
      this.handleError(error, 'updateProfile');
    }
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    try {
      // Validate that avatarUrl is an S3 URL
      if (!avatarUrl.startsWith('https://') || !avatarUrl.includes('s3')) {
        throw new Error('Avatar must be a valid S3 URL');
      }

      return await this.updateUser(userId, { avatar: avatarUrl });
    } catch (error) {
      this.handleError(error, 'updateAvatar');
    }
  }

  // ============================================================================
  // STUDENT MANAGEMENT
  // ============================================================================

  async getStudentsByInstructor(instructorId: string): Promise<Student[]> {
    try {
      // This would require a GSI on instructorId
      // For now, we'll implement a simple query
      const students = await this.queryItems<UserDBItem>(
        `INSTRUCTOR#${instructorId}`,
        'STUDENT#',
        'GSI2'
      );

      return students
        .filter(item => item.role === 'student')
        .map(item => this.mapDBItemToUser(item) as Student);
    } catch (error) {
      this.handleError(error, 'getStudentsByInstructor');
    }
  }

  // ============================================================================
  // COGNITO INTEGRATION
  // ============================================================================

  private async createCognitoUser(userData: RegisterRequest): Promise<any> {
    try {
      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: userData.email,
        UserAttributes: [
          { Name: 'email', Value: userData.email },
          { Name: 'given_name', Value: userData.firstName },
          { Name: 'family_name', Value: userData.lastName },
          { Name: 'custom:role', Value: userData.role },
          ...(userData.role === 'student' && userData.instructorId ? 
            [{ Name: 'custom:instructorId', Value: userData.instructorId }] : []),
          ...(userData.department ? 
            [{ Name: 'custom:department', Value: userData.department }] : [])
        ],
        TemporaryPassword: userData.password,
        MessageAction: 'SUPPRESS' // Don't send welcome email
      });

      const createResult = await this.cognitoClient.send(createUserCommand);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: userData.email,
        Password: userData.password,
        Permanent: true
      });

      await this.cognitoClient.send(setPasswordCommand);

      // Add user to appropriate group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: userData.email,
        GroupName: userData.role === 'instructor' ? 'Instructors' : 'Students'
      });

      await this.cognitoClient.send(addToGroupCommand);

      return createResult.User;
    } catch (error) {
      this.handleError(error, 'createCognitoUser');
    }
  }

  // ============================================================================
  // MAPPING METHODS
  // ============================================================================

  private mapDBItemToUser(item: UserDBItem): User {
    const baseUser: User = {
      id: item.PK.replace('USER#', ''),
      email: item.email,
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role,
      avatar: item.avatar,
      emailVerified: item.emailVerified,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    if (item.role === 'student') {
      return {
        ...baseUser,
        studentId: item.studentId!,
        instructorId: item.instructorId,
        department: item.department,
        bio: item.bio,
        careerGoals: item.careerGoals,
        classOf: item.classOf,
        funFact: item.funFact,
        favoriteSubject: item.favoriteSubject,
        hobbies: item.hobbies,
        schoolName: item.schoolName
      } as Student;
    }

    if (item.role === 'instructor') {
      return {
        ...baseUser,
        instructorId: item.instructorId!,
        department: item.department!,
        bio: item.bio,
        expertise: item.expertise,
        yearsExperience: item.yearsExperience
      } as Instructor;
    }

    return baseUser;
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateUserRole(role: string): void {
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }
  }
}
