import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const body = await request.json();
    const { grade, feedback, status } = body;

    console.log('Grading submission:', { submissionId, grade, feedback, status });

    // Validate input
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { success: false, error: 'Grade is required' },
        { status: 400 }
      );
    }

    // Verify submission exists
    const getResult = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId }
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Update submission with grade
    const now = new Date().toISOString();
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId },
      UpdateExpression: 'SET grade = :grade, instructorFeedback = :feedback, #status = :status, gradedAt = :gradedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':grade': Number(grade),
        ':feedback': feedback || '',
        ':status': status || 'graded',
        ':gradedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    }));

    console.log('Submission graded successfully:', updateResult.Attributes);

    // Create notification for the student about their grade
    const submission = updateResult.Attributes;
    if (submission && submission.studentId) {
      try {
        const gradePercentage = submission.maxScore ? Math.round((Number(grade) / submission.maxScore) * 100) : null;
        const gradeDisplay = gradePercentage ? `${grade}/${submission.maxScore} (${gradePercentage}%)` : `${grade}`;
        
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: submission.studentId,
            senderId: body.instructorId || 'instructor',
            senderName: body.instructorName || 'Your instructor',
            type: 'grade_received',
            title: '📊 Your assignment has been graded!',
            message: `You received ${gradeDisplay} for "${submission.videoTitle || submission.assignmentTitle || 'your submission'}"${feedback ? '. Check your feedback!' : ''}`,
            relatedId: submissionId,
            relatedType: 'submission',
            priority: 'high',
            actionUrl: `/student/assignments/${submission.assignmentId || 'submissions'}`
          })
        });

        if (notificationResponse.ok) {
          console.log('✅ Grade notification created');
        } else {
          console.error('❌ Failed to create grade notification');
        }
      } catch (notifError) {
        console.error('❌ Error creating grade notification:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      submission: updateResult.Attributes
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to grade submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

