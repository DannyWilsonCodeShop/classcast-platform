import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// For now, we'll store videos locally in the public directory
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'videos');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const userId = formData.get('userId') as string;
    const assignmentId = formData.get('assignmentId') as string;

    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = video.name.split('.').pop() || 'webm';
    const fileName = `video-submissions-${userId}-${assignmentId}-${timestamp}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // Ensure upload directory exists
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Convert file to buffer and save locally
    const buffer = Buffer.from(await video.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return public URL
    const videoUrl = `/uploads/videos/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: videoUrl,
        fileName: fileName,
        size: video.size,
        type: video.type,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
