import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  User, 
  Assignment, 
  Submission, 
  DynamoDBQueryParams, 
  DynamoDBScanParams,
  DynamoDBResponse 
} from '../types/dynamodb';

import { awsConfig } from './aws-config';

// DynamoDB client configuration
const client = new DynamoDBClient({
  region: awsConfig.region,
  // In production (Amplify), use IAM role; in development, use explicit credentials
  ...(process.env.NODE_ENV !== 'production' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  } : {}),
  // For local development, you can use:
  // endpoint: 'http://localhost:8000',
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names from unified configuration
export const TABLE_NAMES = {
  USERS: awsConfig.dynamodb.tables.users,
  ASSIGNMENTS: awsConfig.dynamodb.tables.assignments,
  SUBMISSIONS: awsConfig.dynamodb.tables.submissions,
  COURSES: awsConfig.dynamodb.tables.courses,
  CONTENT_MODERATION: awsConfig.dynamodb.tables.contentModeration,
} as const;

// DynamoDB Service Class
export class DynamoDBService {
  private docClient: DynamoDBDocumentClient;

  constructor() {
    this.docClient = docClient;
  }

  // Generic CRUD Operations
  async getItem<T>(tableName: string, key: Record<string, any>): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
      });

      const response = await this.docClient.send(command);
      return response.Item as T || null;
    } catch (error) {
      console.error(`Error getting item from ${tableName}:`, error);
      throw error;
    }
  }

  async putItem<T extends Record<string, any>>(tableName: string, item: T): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error(`Error putting item to ${tableName}:`, error);
      throw error;
    }
  }

  async updateItem(
    tableName: string, 
    key: Record<string, any>, 
    updateExpression: string, 
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW',
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error(`Error updating item in ${tableName}:`, error);
      throw error;
    }
  }

  async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error(`Error deleting item from ${tableName}:`, error);
      throw error;
    }
  }

  async query<T>(params: DynamoDBQueryParams): Promise<DynamoDBResponse<T>> {
    try {
      const command = new QueryCommand(params);
      const response = await this.docClient.send(command);
      
      return {
        Items: response.Items as T[] || [],
        Count: response.Count || 0,
        ScannedCount: response.ScannedCount || 0,
        LastEvaluatedKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error querying DynamoDB:', error);
      throw error;
    }
  }

  async scan<T>(params: DynamoDBScanParams): Promise<DynamoDBResponse<T>> {
    try {
      const command = new ScanCommand(params);
      const response = await this.docClient.send(command);
      
      return {
        Items: response.Items as T[] || [],
        Count: response.Count || 0,
        ScannedCount: response.ScannedCount || 0,
        LastEvaluatedKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error scanning DynamoDB:', error);
      throw error;
    }
  }

  // Batch Operations
  async batchGet<T>(tableName: string, keys: Record<string, any>[]): Promise<T[]> {
    try {
      const command = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: keys,
          },
        },
      });

      const response = await this.docClient.send(command);
      return response.Responses?.[tableName] as T[] || [];
    } catch (error) {
      console.error(`Error batch getting from ${tableName}:`, error);
      throw error;
    }
  }

  async batchWrite(
    tableName: string, 
    putItems?: any[], 
    deleteItems?: Record<string, any>[]
  ): Promise<void> {
    try {
      const requestItems: any[] = [];

      // Add put requests
      if (putItems && putItems.length > 0) {
        putItems.forEach(item => {
          requestItems.push({
            PutRequest: {
              Item: item,
            },
          });
        });
      }

      // Add delete requests
      if (deleteItems && deleteItems.length > 0) {
        deleteItems.forEach(key => {
          requestItems.push({
            DeleteRequest: {
              Key: key,
            },
          });
        });
      }

      // DynamoDB batch write can only handle 25 items at a time
      const chunks = this.chunkArray(requestItems, 25);
      
      for (const chunk of chunks) {
        const command = new BatchWriteCommand({
          RequestItems: {
            [tableName]: chunk,
          },
        });

        await this.docClient.send(command);
      }
    } catch (error) {
      console.error(`Error batch writing to ${tableName}:`, error);
      throw error;
    }
  }

  // Transaction Operations
  async transactWrite(transactItems: any[]): Promise<void> {
    try {
      // DynamoDB transactions can only handle 25 items at a time
      const chunks = this.chunkArray(transactItems, 25);
      
      for (const chunk of chunks) {
        const command = new TransactWriteCommand({
          TransactItems: chunk,
        });

        await this.docClient.send(command);
      }
    } catch (error) {
      console.error('Error in transaction write:', error);
      throw error;
    }
  }

  // User-specific Operations
  async getUserById(userId: string, email: string): Promise<User | null> {
    return this.getItem<User>(TABLE_NAMES.USERS, { userId, email });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const response = await this.query<User>({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    });

    return response.Items[0] || null;
  }

  async getUsersByRole(role: string, limit = 100): Promise<User[]> {
    const response = await this.query<User>({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'RoleIndex',
      KeyConditionExpression: 'role = :role',
      ExpressionAttributeValues: { ':role': role },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return response.Items;
  }

  async createUser(user: User): Promise<void> {
    await this.putItem(TABLE_NAMES.USERS, user);
  }

  async updateUser(userId: string, email: string, updates: Partial<User>): Promise<void> {
    const updateExpression = this.buildUpdateExpression(updates);
    const expressionAttributeValues = this.buildExpressionAttributeValues(updates);
    
    await this.updateItem(
      TABLE_NAMES.USERS,
      { userId, email },
      updateExpression,
      expressionAttributeValues
    );
  }

  // Assignment-specific Operations
  async getAssignmentById(assignmentId: string, courseId: string): Promise<Assignment | null> {
    return this.getItem<Assignment>(TABLE_NAMES.ASSIGNMENTS, { assignmentId, courseId });
  }

  async getAssignmentsByCourse(courseId: string, limit = 100): Promise<Assignment[]> {
    const response = await this.query<Assignment>({
      TableName: TABLE_NAMES.ASSIGNMENTS,
      IndexName: 'CourseIndex',
      KeyConditionExpression: 'courseId = :courseId',
      ExpressionAttributeValues: { ':courseId': courseId },
      Limit: limit,
      ScanIndexForward: true, // Due date ascending
    });

    return response.Items;
  }

  async getAssignmentsByInstructor(instructorId: string, limit = 100): Promise<Assignment[]> {
    const response = await this.query<Assignment>({
      TableName: TABLE_NAMES.ASSIGNMENTS,
      IndexName: 'InstructorIndex',
      KeyConditionExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: { ':instructorId': instructorId },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return response.Items;
  }

  async createAssignment(assignment: Assignment): Promise<void> {
    await this.putItem(TABLE_NAMES.ASSIGNMENTS, assignment);
  }

  async updateAssignment(assignmentId: string, courseId: string, updates: Partial<Assignment>): Promise<void> {
    const updateExpression = this.buildUpdateExpression(updates);
    const expressionAttributeValues = this.buildExpressionAttributeValues(updates);
    
    await this.updateItem(
      TABLE_NAMES.ASSIGNMENTS,
      { assignmentId, courseId },
      updateExpression,
      expressionAttributeValues
    );
  }

  // Submission-specific Operations
  async getSubmissionById(submissionId: string, assignmentId: string): Promise<Submission | null> {
    return this.getItem<Submission>(TABLE_NAMES.SUBMISSIONS, { submissionId, assignmentId });
  }

  async getSubmissionsByAssignment(assignmentId: string, limit = 100): Promise<Submission[]> {
    const response = await this.query<Submission>({
      TableName: TABLE_NAMES.SUBMISSIONS,
      IndexName: 'AssignmentIndex',
      KeyConditionExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: { ':assignmentId': assignmentId },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return response.Items;
  }

  async getSubmissionsByStudent(studentId: string, limit = 100): Promise<Submission[]> {
    const response = await this.query<Submission>({
      TableName: TABLE_NAMES.SUBMISSIONS,
      IndexName: 'StudentIndex',
      KeyConditionExpression: 'studentId = :studentId',
      ExpressionAttributeValues: { ':studentId': studentId },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    return response.Items;
  }

  async createSubmission(submission: Submission): Promise<void> {
    await this.putItem(TABLE_NAMES.SUBMISSIONS, submission);
  }

  async updateSubmission(submissionId: string, assignmentId: string, updates: Partial<Submission>): Promise<void> {
    const updateExpression = this.buildUpdateExpression(updates);
    const expressionAttributeValues = this.buildExpressionAttributeValues(updates);
    
    await this.updateItem(
      TABLE_NAMES.SUBMISSIONS,
      { submissionId, assignmentId },
      updateExpression,
      expressionAttributeValues
    );
  }

  // Utility Methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private buildUpdateExpression(updates: Record<string, any>): string {
    const updateExpressions: string[] = [];
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
      }
    });

    return `SET ${updateExpressions.join(', ')}`;
  }

  private buildExpressionAttributeValues(updates: Record<string, any>): Record<string, any> {
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        expressionAttributeValues[`:${key}`] = updates[key];
      }
    });

    return expressionAttributeValues;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.scan({
        TableName: TABLE_NAMES.USERS,
        Limit: 1,
      });
      return true;
    } catch (error) {
      console.error('DynamoDB health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();

// Export for use in other modules
export default dynamoDBService;
