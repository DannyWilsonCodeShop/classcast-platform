import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  GradeBatchRequest,
  GradeBatchResponse,
  GradingResult,
  AIGradingPreferences,
} from '@/types/aiGrading';
import { RubricCategory } from '@/types/rubric';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

// Simulate processing delay (500ms between submissions)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate a random score weighted by strictness level
function generateStrictnessWeightedScore(maxScore: number, strictness: string): number {
  // Base random factor
  const random = Math.random();

  let score: number;
  switch (strictness) {
    case 'lenient':
      // Skew higher: 60-100% of max
      score = Math.round(maxScore * (0.6 + random * 0.4));
      break;
    case 'strict':
      // Skew lower: 30-75% of max
      score = Math.round(maxScore * (0.3 + random * 0.45));
      break;
    case 'moderate':
    default:
      // Normal distribution: 45-90% of max
      score = Math.round(maxScore * (0.45 + random * 0.45));
      break;
  }

  return Math.min(score, maxScore);
}

// Generate feedback text based on grading mode and preferences
function generateFeedback(
  gradingMode: string,
  totalGrade: number,
  maxTotal: number,
  tone: string
): string {
  if (gradingMode === 'rubric_only') {
    return '';
  }

  const percentage = maxTotal > 0 ? (totalGrade / maxTotal) * 100 : 0;

  const feedbackOptions: Record<string, Record<string, string>> = {
    encouraging: {
      high: 'Great work! Your submission demonstrates strong understanding of the material. Keep up the excellent effort.',
      mid: 'Good effort on this submission. You show understanding of the core concepts with room to deepen your analysis.',
      low: 'Thank you for your submission. There are opportunities to strengthen your work — consider reviewing the key concepts and expanding your analysis.',
    },
    constructive: {
      high: 'Well-executed submission with strong demonstration of key concepts. Minor areas for refinement noted in rubric scores.',
      mid: 'Adequate submission covering main points. Review rubric scores for specific areas where deeper engagement would improve your grade.',
      low: 'Submission needs improvement in several areas. Focus on the rubric categories with lower scores and consider office hours for additional guidance.',
    },
    critical: {
      high: 'Meets expectations. Scores reflect competent execution across rubric categories.',
      mid: 'Partially meets expectations. Several rubric categories show gaps in understanding or execution.',
      low: 'Does not meet expectations in key areas. Significant revision needed based on rubric feedback.',
    },
  };

  const level = percentage >= 75 ? 'high' : percentage >= 50 ? 'mid' : 'low';
  const toneKey = tone || 'constructive';
  return feedbackOptions[toneKey]?.[level] || feedbackOptions.constructive[level];
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeBatchRequest = await request.json();
    const { assignmentId, preferences, scope, submissionId } = body;

    // Validate request
    if (!assignmentId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'assignmentId and preferences are required' },
        { status: 400 }
      );
    }

    if (scope === 'single' && !submissionId) {
      return NextResponse.json(
        { success: false, error: 'submissionId is required when scope is single' },
        { status: 400 }
      );
    }

    // 1. Save AI preferences to the assignment record
    const now = new Date().toISOString();
    const prefsToSave: AIGradingPreferences = {
      ...preferences,
      updatedAt: now,
    };

    let preferenceSaved = false;
    try {
      await docClient.send(new UpdateCommand({
        TableName: ASSIGNMENTS_TABLE,
        Key: { assignmentId },
        UpdateExpression: 'SET aiGradingPreferences = :prefs, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':prefs': prefsToSave,
          ':updatedAt': now,
        },
      }));
      preferenceSaved = true;
    } catch (prefError) {
      console.error('Warning: Failed to save AI preferences:', prefError);
      // Continue with grading even if preference save fails
    }

    // 2. Get the assignment's rubric
    const assignmentResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId,
      },
    }));

    const assignment = assignmentResult.Items?.[0];
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const rubric: RubricCategory[] = assignment.rubric || [];

    // 3. Fetch submissions to grade
    let submissions: any[] = [];

    if (scope === 'single' && submissionId) {
      // Fetch single submission
      const subResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId },
      }));
      if (subResult.Item) {
        submissions = [subResult.Item];
      }
    } else {
      // Fetch all ungraded submissions for this assignment
      const subResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'assignmentId = :assignmentId AND (attribute_not_exists(grade) OR grade = :nullVal)',
        ExpressionAttributeValues: {
          ':assignmentId': assignmentId,
          ':nullVal': null,
        },
      }));
      submissions = subResult.Items || [];
    }

    // 4. Process each submission (simulate AI grading)
    const results: GradingResult[] = [];

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];

      // Simulate processing delay (500ms between submissions)
      if (i > 0) {
        await delay(500);
      }

      try {
        // Generate rubric scores
        const rubricScores: Record<string, number> = {};
        let totalGrade = 0;
        let maxTotal = 0;

        if (rubric.length > 0) {
          for (const category of rubric) {
            const maxCategoryScore = category.levels?.length > 0
              ? Math.max(...category.levels.map((l) => l.score))
              : 10;
            const score = generateStrictnessWeightedScore(maxCategoryScore, preferences.strictnessLevel);
            rubricScores[category.id] = score;
            totalGrade += score;
            maxTotal += maxCategoryScore;
          }
        } else {
          // No rubric — generate a simple score out of 100
          const maxScore = assignment.maxScore || 100;
          totalGrade = generateStrictnessWeightedScore(maxScore, preferences.strictnessLevel);
          maxTotal = maxScore;
        }

        // Generate feedback
        const tone = preferences.feedbackPreferences?.tone || 'constructive';
        const feedbackText = generateFeedback(
          preferences.gradingMode,
          totalGrade,
          maxTotal,
          tone
        );

        // Save grade to submission via UpdateCommand
        const updateParts: string[] = [
          'grade = :grade',
          'gradedAt = :gradedAt',
          '#status = :status',
          'updatedAt = :updatedAt',
          'gradingMethod = :gradingMethod',
        ];
        const expressionAttributeValues: Record<string, any> = {
          ':grade': totalGrade,
          ':gradedAt': now,
          ':status': 'graded',
          ':updatedAt': now,
          ':gradingMethod': 'ai',
        };
        const expressionAttributeNames: Record<string, string> = {
          '#status': 'status',
        };

        if (Object.keys(rubricScores).length > 0) {
          updateParts.push('rubricScores = :rubricScores');
          expressionAttributeValues[':rubricScores'] = rubricScores;
        }

        if (feedbackText) {
          updateParts.push('instructorFeedback = :feedback');
          expressionAttributeValues[':feedback'] = feedbackText;
        }

        await docClient.send(new UpdateCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { submissionId: submission.submissionId },
          UpdateExpression: `SET ${updateParts.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        }));

        results.push({
          submissionId: submission.submissionId,
          success: true,
          grade: totalGrade,
          rubricScores,
          feedback: feedbackText || undefined,
        });
      } catch (subError) {
        console.error(`Error grading submission ${submission.submissionId}:`, subError);
        results.push({
          submissionId: submission.submissionId,
          success: false,
          error: subError instanceof Error ? subError.message : 'Unknown error',
        });
      }
    }

    const response: GradeBatchResponse = {
      success: true,
      results,
      totalProcessed: results.filter((r) => r.success).length,
      totalErrors: results.filter((r) => !r.success).length,
      preferenceSaved,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in grade-batch:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch grading',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
