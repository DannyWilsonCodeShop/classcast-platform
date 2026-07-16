import { NextRequest, NextResponse } from 'next/server';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const transcribeClient = new TranscribeClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: 'videoUrl is required' }, { status: 400 });
    }

    // If the video is a blob URL (client-side recording), we can't transcribe it directly.
    // The client should upload it first. For now, return a helpful message.
    if (videoUrl.startsWith('blob:')) {
      return NextResponse.json({
        success: false,
        error: 'Auto-captions require the video to be uploaded first. Submit the video, then captions can be generated.'
      }, { status: 400 });
    }

    // Extract the S3 key from the video URL
    let s3Key = '';
    try {
      const url = new URL(videoUrl);
      s3Key = url.pathname.substring(1); // Remove leading slash
      if (s3Key.startsWith(`${BUCKET}/`)) s3Key = s3Key.substring(BUCKET.length + 1);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid video URL' }, { status: 400 });
    }

    const jobName = `classcast-transcribe-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const mediaUri = `s3://${BUCKET}/${s3Key}`;

    // Start transcription job
    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      Media: { MediaFileUri: mediaUri },
      OutputBucketName: BUCKET,
      OutputKey: `transcriptions/${jobName}.json`,
    }));

    // Poll for completion (max 60 seconds)
    let attempts = 0;
    let result: any = null;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      }));
      const job = status.TranscriptionJob;
      if (job?.TranscriptionJobStatus === 'COMPLETED') {
        // Fetch the transcript from S3
        const transcriptUrl = job.Transcript?.TranscriptFileUri;
        if (transcriptUrl) {
          const transcriptRes = await fetch(transcriptUrl);
          result = await transcriptRes.json();
        }
        break;
      } else if (job?.TranscriptionJobStatus === 'FAILED') {
        return NextResponse.json({
          success: false,
          error: 'Transcription failed: ' + (job.FailureReason || 'Unknown error')
        }, { status: 500 });
      }
      attempts++;
    }

    if (!result) {
      return NextResponse.json({ success: false, error: 'Transcription timed out. Try again later.' }, { status: 504 });
    }

    // Parse word-level timestamps
    const items = result.results?.items || [];
    const words: { text: string; startTime: number; endTime: number }[] = [];
    for (const item of items) {
      if (item.type === 'pronunciation' && item.start_time && item.end_time) {
        words.push({
          text: item.alternatives?.[0]?.content || '',
          startTime: parseFloat(item.start_time),
          endTime: parseFloat(item.end_time),
        });
      }
    }

    return NextResponse.json({ success: true, words, transcript: result.results?.transcripts?.[0]?.transcript || '' });
  } catch (error: any) {
    console.error('Transcription error:', error);

    if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
      return NextResponse.json({
        success: false,
        error: 'Transcription service not configured. Auto-captions are unavailable.'
      }, { status: 503 });
    }

    return NextResponse.json({ success: false, error: 'Failed to generate captions' }, { status: 500 });
  }
}
