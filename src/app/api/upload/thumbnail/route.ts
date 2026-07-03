import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

/**
 * POST /api/upload/thumbnail
 * Accepts a base64-encoded image and uploads it to S3.
 * Returns the public URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, userId } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Parse base64 data URL
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const ext = matches[1]; // e.g., 'jpeg', 'png'
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate file key
    const fileKey = `thumbnails/${userId || 'anonymous'}/${uuidv4()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: `image/${ext}`,
    }));

    const url = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${fileKey}`;

    return NextResponse.json({ success: true, url, thumbnailUrl: url });
  } catch (error: any) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail', details: error.message },
      { status: 500 }
    );
  }
}
