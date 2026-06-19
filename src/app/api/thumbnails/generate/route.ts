import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'classcast-uploads';

/**
 * POST /api/thumbnails/generate
 * 
 * Receives a base64 photo, processes it for use as a video thumbnail.
 * 
 * Full pipeline (when background removal service is available):
 * 1. Decode base64 image
 * 2. Send to background removal service (rembg / remove.bg)
 * 3. Composite the cutout person over branded background
 * 4. Add white outline around the person
 * 5. Upload result to S3
 * 6. Return the S3 URL
 * 
 * Current implementation (MVP):
 * - Stores the original photo as thumbnail in S3
 * - Returns the URL for use in the feed
 * - Background removal can be added later via Lambda or external API
 */
export async function POST(request: NextRequest) {
  try {
    const { image, userId } = await request.json();

    if (!image || !userId) {
      return NextResponse.json(
        { error: 'Image and userId are required' },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const thumbnailId = `thumb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const key = `thumbnails/${userId}/${thumbnailId}.png`;

    // Upload to S3
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        CacheControl: 'max-age=31536000',
      }));

      const thumbnailUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

      return NextResponse.json({
        success: true,
        thumbnailUrl,
        // When background removal is enabled, these will be populated:
        // originalUrl: thumbnailUrl,
        // processedUrl: composited version URL,
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      
      // Fallback: return the base64 data URI directly
      // (works but not ideal for production — larger payload)
      return NextResponse.json({
        success: true,
        thumbnailUrl: image, // Use the original base64 as fallback
      });
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
