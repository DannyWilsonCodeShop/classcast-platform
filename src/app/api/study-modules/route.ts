import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { StudyModule } from '@/types/study-modules';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const STUDY_MODULES_TABLE = 'classcast-study-modules';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    // Fetch study modules from DynamoDB
    let studyModules: StudyModule[] = [];
    
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: STUDY_MODULES_TABLE
      }));
      
      studyModules = result.Items as StudyModule[] || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        // Table doesn't exist yet, return empty array
        console.log('Study modules table not found, returning empty array');
        return NextResponse.json({
          success: true,
          modules: [],
          total: 0
        });
      }
      throw dbError;
    }

    // Filter by category
    if (category && category !== 'all') {
      studyModules = studyModules.filter(module => 
        module.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      studyModules = studyModules.filter(module => 
        module.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Add enrollment status for user
    if (userId) {
      // TODO: Check enrollment status from database
      studyModules = studyModules.map(module => ({
        ...module,
        isEnrolled: false // Will be implemented when enrollment system is added
      }));
    }

    return NextResponse.json({
      success: true,
      modules: studyModules,
      total: studyModules.length
    });
  } catch (error) {
    console.error('Error fetching study modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study modules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleId, action } = body;

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'enroll') {
      // TODO: Save enrollment to database when enrollment system is implemented
      console.log(`User ${userId} enrolled in module ${moduleId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully enrolled in module',
        enrolledAt: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing study module request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}