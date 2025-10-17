import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '../../../lib/dynamodb';
import { sendGradedAssignmentNotification } from '@/lib/emailNotifications';

// GET /api/grading - Get submissions for grading
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status') || 'submitted';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter expression
    let filterExpression = '';
    const expressionAttributeValues: any = {};

    if (assignmentId) {
      filterExpression = 'assignmentId = :assignmentId';
      expressionAttributeValues[':assignmentId'] = assignmentId;
    } else if (courseId) {
      filterExpression = 'courseId = :courseId';
      expressionAttributeValues[':courseId'] = courseId;
    }

    if (status) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'status = :status';
      expressionAttributeValues[':status'] = status;
    }

    // Get submissions
    const scanParams: any = {
      TableName: 'classcast-submissions',
      Limit: limit,
    };

    if (filterExpression) {
      scanParams.FilterExpression = filterExpression;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const response = await dynamoDBService.scan(scanParams);
    const submissions = response.Items || [];

    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('Error fetching submissions for grading:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/grading - Grade a submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      grade,
      maxScore,
      feedback,
      rubricScores,
      gradedBy,
    } = body;

    // Validate required fields
    if (!submissionId || grade === undefined || !gradedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: submissionId, grade, gradedBy',
        },
        { status: 400 }
      );
    }

    // Calculate percentage
    const percentage = maxScore ? (grade / maxScore) * 100 : 0;
    
    // Determine letter grade
    let letterGrade = 'F';
    if (percentage >= 97) letterGrade = 'A+';
    else if (percentage >= 93) letterGrade = 'A';
    else if (percentage >= 90) letterGrade = 'A-';
    else if (percentage >= 87) letterGrade = 'B+';
    else if (percentage >= 83) letterGrade = 'B';
    else if (percentage >= 80) letterGrade = 'B-';
    else if (percentage >= 77) letterGrade = 'C+';
    else if (percentage >= 73) letterGrade = 'C';
    else if (percentage >= 70) letterGrade = 'C-';
    else if (percentage >= 67) letterGrade = 'D+';
    else if (percentage >= 63) letterGrade = 'D';
    else if (percentage >= 60) letterGrade = 'D-';

    // Update submission with grade
    const updateData = {
      grade: Number(grade),
      maxScore: maxScore ? Number(maxScore) : 100,
      percentage: Number(percentage.toFixed(2)),
      letterGrade,
      feedback: feedback || '',
      rubricScores: rubricScores || {},
      status: 'graded',
      gradedAt: new Date().toISOString(),
      gradedBy,
      updatedAt: new Date().toISOString(),
    };

    await dynamoDBService.update({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET ' + Object.keys(updateData)
        .map(key => `#${key} = :${key}`)
        .join(', '),
      ExpressionAttributeNames: Object.keys(updateData).reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      }, {} as any),
      ExpressionAttributeValues: Object.keys(updateData).reduce((acc, key) => {
        acc[`:${key}`] = updateData[key];
        return acc;
      }, {} as any),
    });

    // Send email notification to student (fire and forget)
    if (body.studentId && body.studentEmail && body.assignmentTitle) {
      sendGradedAssignmentNotification(
        body.studentId,
        body.studentEmail,
        body.studentName || body.studentEmail,
        {
          title: body.assignmentTitle,
          description: body.assignmentDescription,
          grade: Number(grade),
          maxScore: maxScore || 100,
          feedback: feedback,
          assignmentId: body.assignmentId,
        },
        body.courseName || 'Your Course'
      ).catch(error => {
        console.error('Failed to send grade notification email:', error);
        // Don't fail the grading if email fails
      });
    }

    return NextResponse.json({
      success: true,
      data: updateData,
      message: 'Submission graded successfully',
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to grade submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/grading - Update a grade
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, ...updateData } = body;

    if (!submissionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Submission ID is required',
        },
        { status: 400 }
      );
    }

    // Recalculate percentage and letter grade if grade is updated
    if (updateData.grade !== undefined && updateData.maxScore !== undefined) {
      const percentage = (updateData.grade / updateData.maxScore) * 100;
      updateData.percentage = Number(percentage.toFixed(2));
      
      // Determine letter grade
      let letterGrade = 'F';
      if (percentage >= 97) letterGrade = 'A+';
      else if (percentage >= 93) letterGrade = 'A';
      else if (percentage >= 90) letterGrade = 'A-';
      else if (percentage >= 87) letterGrade = 'B+';
      else if (percentage >= 83) letterGrade = 'B';
      else if (percentage >= 80) letterGrade = 'B-';
      else if (percentage >= 77) letterGrade = 'C+';
      else if (percentage >= 73) letterGrade = 'C';
      else if (percentage >= 70) letterGrade = 'C-';
      else if (percentage >= 67) letterGrade = 'D+';
      else if (percentage >= 63) letterGrade = 'D';
      else if (percentage >= 60) letterGrade = 'D-';
      
      updateData.letterGrade = letterGrade;
    }

    updateData.updatedAt = new Date().toISOString();

    // Update submission
    await dynamoDBService.update({
      TableName: 'classcast-submissions',
      Key: { submissionId },
      UpdateExpression: 'SET ' + Object.keys(updateData)
        .map(key => `#${key} = :${key}`)
        .join(', '),
      ExpressionAttributeNames: Object.keys(updateData).reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      }, {} as any),
      ExpressionAttributeValues: Object.keys(updateData).reduce((acc, key) => {
        acc[`:${key}`] = updateData[key];
        return acc;
      }, {} as any),
    });

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update grade',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
