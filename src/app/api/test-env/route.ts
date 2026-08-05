import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      env: {
        region: process.env.REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `SET (${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...)` : 'NOT_SET',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
        CLASSCAST_ACCESS_KEY_ID: process.env.CLASSCAST_ACCESS_KEY_ID ? `SET (${process.env.CLASSCAST_ACCESS_KEY_ID.substring(0, 8)}...)` : 'NOT_SET',
        CLASSCAST_SECRET_ACCESS_KEY: process.env.CLASSCAST_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
        submissionsTable: process.env.SUBMISSIONS_TABLE_NAME,
        usersTable: process.env.USERS_TABLE_NAME,
        s3Bucket: process.env.S3_VIDEOS_BUCKET
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}