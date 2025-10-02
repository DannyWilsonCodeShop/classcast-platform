import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const userId = formData.get('userId') as string;
    const assignmentId = formData.get('assignmentId') as string;

    console.log('Mock video upload request:', { 
      hasVideo: !!video, 
      videoSize: video?.size, 
      videoType: video?.type,
      userId, 
      assignmentId 
    });

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

    // Generate mock response
    const timestamp = Date.now();
    const fileName = `mock-video-${userId}-${assignmentId}-${timestamp}.webm`;
    const videoUrl = `/api/placeholder/640/480`; // Placeholder video URL

    console.log('Mock video upload successful:', { fileName, videoUrl });

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: videoUrl,
        fileName: fileName,
        size: video.size,
        type: video.type,
        uploadedAt: new Date().toISOString(),
        mock: true, // Indicate this is a mock response
      },
    });

  } catch (error) {
    console.error('Error in mock video upload:', error);
    return NextResponse.json(
      { error: 'Failed to process video upload' },
      { status: 500 }
    );
  }
}
