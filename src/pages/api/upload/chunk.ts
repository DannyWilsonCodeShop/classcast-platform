import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ChunkUploadData {
  chunk: formidable.File;
  chunkIndex: string;
  totalChunks: string;
  uploadId: string;
  fileName: string;
  assignmentId: string;
  courseId: string;
}

// Store upload progress in memory (in production, use Redis or database)
const uploadProgress = new Map<string, {
  chunks: Set<number>;
  totalChunks: number;
  fileName: string;
  assignmentId: string;
  courseId: string;
  createdAt: number;
}>();

// Clean up old upload progress (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [uploadId, data] of uploadProgress.entries()) {
    if (data.createdAt < oneHourAgo) {
      uploadProgress.delete(uploadId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB per chunk
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    // Extract chunk data
    const chunkFile = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;
    const chunkIndex = parseInt(Array.isArray(fields.chunkIndex) ? fields.chunkIndex[0] : fields.chunkIndex || '0');
    const totalChunks = parseInt(Array.isArray(fields.totalChunks) ? fields.totalChunks[0] : fields.totalChunks || '1');
    const uploadId = Array.isArray(fields.uploadId) ? fields.uploadId[0] : fields.uploadId || '';
    const fileName = Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName || '';
    const assignmentId = Array.isArray(fields.assignmentId) ? fields.assignmentId[0] : fields.assignmentId || '';
    const courseId = Array.isArray(fields.courseId) ? fields.courseId[0] : fields.courseId || '';

    if (!chunkFile || !uploadId || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`📦 Received chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);

    // Initialize or get upload progress
    if (!uploadProgress.has(uploadId)) {
      uploadProgress.set(uploadId, {
        chunks: new Set(),
        totalChunks,
        fileName,
        assignmentId,
        courseId,
        createdAt: Date.now(),
      });
    }

    const progress = uploadProgress.get(uploadId)!;
    
    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'temp', 'chunks', uploadId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save chunk to temporary file
    const chunkPath = path.join(uploadDir, `chunk_${chunkIndex}`);
    const chunkData = fs.readFileSync(chunkFile.filepath);
    fs.writeFileSync(chunkPath, chunkData);
    
    // Mark chunk as received
    progress.chunks.add(chunkIndex);

    console.log(`✅ Saved chunk ${chunkIndex + 1}/${totalChunks} (${progress.chunks.size}/${totalChunks} received)`);

    // Check if all chunks are received
    if (progress.chunks.size === totalChunks) {
      console.log(`🎯 All chunks received for ${uploadId}, assembling file...`);
      
      try {
        // Assemble the complete file
        const finalFilePath = await assembleChunks(uploadId, progress);
        
        // Upload to S3 or your storage service
        const uploadResult = await uploadAssembledFile(finalFilePath, progress);
        
        // Clean up temporary files
        cleanupChunks(uploadId);
        uploadProgress.delete(uploadId);
        
        return res.status(200).json({
          success: true,
          message: 'Upload completed',
          data: uploadResult,
        });
        
      } catch (error) {
        console.error('Error assembling file:', error);
        cleanupChunks(uploadId);
        uploadProgress.delete(uploadId);
        
        return res.status(500).json({
          error: 'Failed to assemble uploaded file',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return progress for partial upload
    return res.status(200).json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
      progress: {
        chunksReceived: progress.chunks.size,
        totalChunks: totalChunks,
        percentage: Math.round((progress.chunks.size / totalChunks) * 100),
      },
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    return res.status(500).json({
      error: 'Failed to process chunk upload',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function assembleChunks(uploadId: string, progress: any): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'temp', 'chunks', uploadId);
  const finalDir = path.join(process.cwd(), 'temp', 'assembled');
  
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }
  
  const finalFilePath = path.join(finalDir, `${uploadId}_${progress.fileName}`);
  const writeStream = fs.createWriteStream(finalFilePath);
  
  // Assemble chunks in order
  for (let i = 0; i < progress.totalChunks; i++) {
    const chunkPath = path.join(uploadDir, `chunk_${i}`);
    
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`Missing chunk ${i}`);
    }
    
    const chunkData = fs.readFileSync(chunkPath);
    writeStream.write(chunkData);
  }
  
  writeStream.end();
  
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(finalFilePath));
    writeStream.on('error', reject);
  });
}

async function uploadAssembledFile(filePath: string, progress: any) {
  // This is where you'd upload to S3, CloudFront, or your storage service
  // For now, we'll simulate the upload
  
  const fileStats = fs.statSync(filePath);
  const fileKey = `video-submissions/${progress.assignmentId}/${uuidv4()}_${progress.fileName}`;
  
  console.log(`📤 Uploading assembled file: ${progress.fileName} (${fileStats.size} bytes)`);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, you'd upload to S3 here
  // const uploadResult = await s3.upload({
  //   Bucket: 'your-bucket',
  //   Key: fileKey,
  //   Body: fs.createReadStream(filePath),
  //   ContentType: 'video/mp4', // or detect from file
  // }).promise();
  
  // Clean up assembled file
  fs.unlinkSync(filePath);
  
  return {
    fileKey,
    fileUrl: `https://your-cdn.com/${fileKey}`,
    fileName: progress.fileName,
    fileSize: fileStats.size,
    uploadMethod: 'chunked',
  };
}

function cleanupChunks(uploadId: string) {
  const uploadDir = path.join(process.cwd(), 'temp', 'chunks', uploadId);
  
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(uploadDir, file));
    });
    fs.rmdirSync(uploadDir);
  }
}