// ============================================================================
// BASE SERVICE - Foundation for all business logic services
// ============================================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiResponse } from '../types';

export abstract class BaseService {
  protected dynamoClient: DynamoDBDocumentClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  protected async getItem<T>(pk: string, sk: string): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk }
      });

      const result = await this.dynamoClient.send(command);
      return result.Item as T || null;
    } catch (error) {
      console.error('Error getting item:', error);
      throw new Error('Failed to get item');
    }
  }

  protected async putItem<T>(item: T): Promise<T> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...item,
          updatedAt: new Date().toISOString()
        }
      });

      await this.dynamoClient.send(command);
      return item;
    } catch (error) {
      console.error('Error putting item:', error);
      throw new Error('Failed to save item');
    }
  }

  protected async updateItem<T>(
    pk: string, 
    sk: string, 
    updates: Partial<T>
  ): Promise<T> {
    try {
      const updateExpression = this.buildUpdateExpression(updates);
      const expressionAttributeNames = this.buildExpressionAttributeNames(updates);
      const expressionAttributeValues = this.buildExpressionAttributeValues(updates);

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.dynamoClient.send(command);
      return result.Attributes as T;
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error('Failed to update item');
    }
  }

  protected async deleteItem(pk: string, sk: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk }
      });

      await this.dynamoClient.send(command);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

  protected async queryItems<T>(
    pk: string,
    skBeginsWith?: string,
    indexName?: string
  ): Promise<T[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: skBeginsWith 
          ? 'PK = :pk AND begins_with(SK, :sk)'
          : 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': pk,
          ...(skBeginsWith && { ':sk': skBeginsWith })
        },
        IndexName: indexName
      });

      const result = await this.dynamoClient.send(command);
      return result.Items as T[] || [];
    } catch (error) {
      console.error('Error querying items:', error);
      throw new Error('Failed to query items');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private buildUpdateExpression(updates: Record<string, any>): string {
    const setExpressions = Object.keys(updates)
      .filter(key => key !== 'PK' && key !== 'SK')
      .map(key => `#${key} = :${key}`);

    return `SET ${setExpressions.join(', ')}`;
  }

  private buildExpressionAttributeNames(updates: Record<string, any>): Record<string, string> {
    const names: Record<string, string> = {};
    Object.keys(updates).forEach(key => {
      if (key !== 'PK' && key !== 'SK') {
        names[`#${key}`] = key;
      }
    });
    return names;
  }

  private buildExpressionAttributeValues(updates: Record<string, any>): Record<string, any> {
    const values: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (key !== 'PK' && key !== 'SK') {
        values[`:${key}`] = updates[key];
      }
    });
    return values;
  }

  // ============================================================================
  // RESPONSE HELPERS
  // ============================================================================

  protected successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message
    };
  }

  protected errorResponse(error: string, statusCode: number = 400): ApiResponse {
    return {
      success: false,
      error,
      message: error
    };
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  protected validateRequired(fields: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !fields[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // ============================================================================
  // ID GENERATION
  // ============================================================================

  protected generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      throw new Error(`${context}: ${error.message}`);
    }
    
    throw new Error(`${context}: Unknown error occurred`);
  }
}
