import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { s3Service } from '@/lib/s3';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENT_FILES_TABLE = 'classcast-assignment-files';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface AssignmentFile {
  fileId: string;
  assignmentId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  fileKey: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  category: 'resource' | 'rubric' | 'instruction' | 'template' | 'other';
  isPublic: boolean;
}

// GET /api/assignments/[assignmentId]/files - Get all files for an assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;

    console.log('📁 Fetching files for assignment:', assignmentId);

    const result = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENT_FILES_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));

    const files = (result.Items || []).map(item => ({
      fileId: item.fileId,
      assignmentId: item.assignmentId,
      fileName: item.fileName,
      originalName: item.originalName,
      fileSize: item.fileSize,
      fileType: item.fileType,
      fileUrl: item.fileUrl,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt,
      description: item.description,
      category: item.category,
      isPublic: item.isPublic
    }));

    console.log(`📁 Found ${files.length} files for assignment`);

    return NextResponse.json({
      success: true,
      data: { files }
    });

  } catch (error) {
    console.error('Error fetching assignment files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assignment files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/assignments/[assignmentId]/files - Upload a file to an assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'resource';
    const description = formData.get('description') as string || '';
    const uploadedBy = formData.get('uploadedBy') as string;
    const isPublic = formData.get('isPublic') === 'true';

    console.log('📁 Uploading file to assignment:', {
      assignmentId,
      fileName: file?.name,
      fileSize: file?.size,
      category,
      uploadedBy
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploadedBy) {
      return NextResponse.json(
        { success: false, error: 'Uploader ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max for assignment files)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      // Code files
      'text/javascript',
      'text/html',
      'text/css',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Generate file ID and key
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileKey = `assignments/${assignmentId}/files/${fileId}_${file.name}`;

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(file, fileKey, {
      'assignment-id': assignmentId,
      'file-id': fileId,
      'uploaded-by': uploadedBy,
      'category': category,
      'original-name': file.name
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload file to S3');
    }

    // Create file record
    const assignmentFile: AssignmentFile = {
      fileId,
      assignmentId,
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: uploadResult.fileUrl,
      fileKey,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      description,
      category: category as AssignmentFile['category'],
      isPublic
    };

    // Save to database
    await docClient.send(new PutCommand({
      TableName: ASSIGNMENT_FILES_TABLE,
      Item: assignmentFile
    }));

    console.log('✅ Assignment file uploaded successfully:', fileId);

    return NextResponse.json({
      success: true,
      data: assignmentFile,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading assignment file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[assignmentId]/files - Delete a file from an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting assignment file:', { assignmentId, fileId });

    // Get file record to get S3 key
    const result = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENT_FILES_TABLE,
      FilterExpression: 'fileId = :fileId AND assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':fileId': fileId,
        ':assignmentId': assignmentId
      }
    }));

    const fileRecord = result.Items?.[0];
    if (!fileRecord) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await s3Service.deleteFile(fileRecord.fileKey);
    } catch (s3Error) {
      console.warn('Failed to delete file from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await docClient.send(new DeleteCommand({
      TableName: ASSIGNMENT_FILES_TABLE,
      Key: {
        fileId: fileId,
        assignmentId: assignmentId
      }
    }));

    console.log('✅ Assignment file deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}