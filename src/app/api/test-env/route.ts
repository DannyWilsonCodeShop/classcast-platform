import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      env: {
        region: process.env.REGION,
        accessKeyId: process.env.ACCESS_KEY_ID ? 'SET' : 'NOT_SET',
        secretAccessKey: process.env.SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
        submissionsTable: process.env.SUBMISSIONS_TABLE_NAME,
        usersTable: process.env.USERS_TABLE_NAME,
        assignmentsTable: process.env.ASSIGNMENTS_TABLE_NAME,
        coursesTable: process.env.COURSES_TABLE_NAME,
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