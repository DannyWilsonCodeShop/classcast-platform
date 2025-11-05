import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { s3Service } from '@/lib/s3';
import { awsConfig } from '@/lib/aws-config';

const client = new DynamoDBClient({ region: awsConfig.region });
const docClient = DynamoDBDocumentClient.from(client);

const COURSE_FILES_TABLE = 'classcast-course-files';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface CourseFile {
  fileId: string;
  courseId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  fileKey: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  category: 'syllabus' | 'lecture' | 'reading' | 'resource' | 'assignment_template' | 'other';
  isPublic: boolean;
  week?: number;
  module?: string;
}

// GET /api/courses/[courseId]/files - Get all files for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const week = searchParams.get('week');

    console.log('📁 Fetching files for course:', { courseId, category, week });

    let filterExpression = 'courseId = :courseId';
    const expressionValues: any = {
      ':courseId': courseId
    };

    if (category) {
      filterExpression += ' AND category = :category';
      expressionValues[':category'] = category;
    }

    if (week) {
      filterExpression += ' AND #week = :week';
      expressionValues[':week'] = parseInt(week);
    }

    const result = await docClient.send(new ScanCommand({
      TableName: COURSE_FILES_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ...(week && {
        ExpressionAttributeNames: {
          '#week': 'week'
        }
      })
    }));

    const files = (result.Items || []).map(item => ({
      fileId: item.fileId,
      courseId: item.courseId,
      fileName: item.fileName,
      originalName: item.originalName,
      fileSize: item.fileSize,
      fileType: item.fileType,
      fileUrl: item.fileUrl,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt,
      description: item.description,
      category: item.category,
      isPublic: item.isPublic,
      week: item.week,
      module: item.module
    }));

    console.log(`📁 Found ${files.length} files for course`);

    return NextResponse.json({
      success: true,
      data: { files }
    });

  } catch (error) {
    console.error('Error fetching course files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch course files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/files - Upload a file to a course
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'resource';
    const description = formData.get('description') as string || '';
    const uploadedBy = formData.get('uploadedBy') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const week = formData.get('week') as string;
    const module = formData.get('module') as string;

    console.log('📁 Uploading file to course:', {
      courseId,
      fileName: file?.name,
      fileSize: file?.size,
      category,
      uploadedBy,
      week,
      module
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

    // Validate file size (100MB max for course files)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 100MB' },
        { status: 400 }
      );
    }

    // Validate file type (more permissive for course materials)
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
      'text/markdown',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Audio/Video
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Code files
      'text/javascript',
      'text/html',
      'text/css',
      'application/json',
      'text/xml',
      // Other academic formats
      'application/epub+zip',
      'application/x-latex'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Generate file ID and key
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileKey = `courses/${courseId}/files/${category}/${fileId}_${file.name}`;

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(file, fileKey, {
      'course-id': courseId,
      'file-id': fileId,
      'uploaded-by': uploadedBy,
      'category': category,
      'original-name': file.name,
      ...(week && { 'week': week }),
      ...(module && { 'module': module })
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload file to S3');
    }

    // Create file record
    const courseFile: CourseFile = {
      fileId,
      courseId,
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: uploadResult.fileUrl,
      fileKey,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      description,
      category: category as CourseFile['category'],
      isPublic,
      ...(week && { week: parseInt(week) }),
      ...(module && { module })
    };

    // Save to database
    await docClient.send(new PutCommand({
      TableName: COURSE_FILES_TABLE,
      Item: courseFile
    }));

    console.log('✅ Course file uploaded successfully:', fileId);

    return NextResponse.json({
      success: true,
      data: courseFile,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading course file:', error);
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

// DELETE /api/courses/[courseId]/files - Delete a file from a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting course file:', { courseId, fileId });

    // Get file record to get S3 key
    const result = await docClient.send(new ScanCommand({
      TableName: COURSE_FILES_TABLE,
      FilterExpression: 'fileId = :fileId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':fileId': fileId,
        ':courseId': courseId
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
      TableName: COURSE_FILES_TABLE,
      Key: {
        fileId: fileId,
        courseId: courseId
      }
    }));

    console.log('✅ Course file deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course file:', error);
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