import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { withErrorReporting, ApiErrors } from '@/lib/apiErrorHandler';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';

export const POST = withErrorReporting(async (request: NextRequest) => {
  const body = await request.json();
    const { studentId, fromCourseId, toCourseId, studentName, studentEmail } = body;

    if (!studentId || !fromCourseId || !toCourseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (fromCourseId === toCourseId) {
      return NextResponse.json(
        { success: false, error: 'Cannot move student to the same course' },
        { status: 400 }
      );
    }

    console.log('🔄 Moving student between courses:', {
      studentId,
      fromCourseId,
      toCourseId,
      studentName
    });

    // Get source course
    const fromCourseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: fromCourseId }
    }));

    if (!fromCourseResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Source course not found' },
        { status: 404 }
      );
    }

    // Get target course
    const toCourseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: toCourseId }
    }));

    if (!toCourseResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Target course not found' },
        { status: 404 }
      );
    }

    const fromCourse = fromCourseResult.Item;
    const toCourse = toCourseResult.Item;

    // Remove student from source course
    const fromEnrollment = fromCourse.enrollment || { students: [] };
    const studentIndex = fromEnrollment.students.findIndex((student: any) => {
      if (typeof student === 'string') {
        return student === studentId;
      } else if (typeof student === 'object' && student.userId) {
        return student.userId === studentId;
      }
      return false;
    });

    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Student not found in source course enrollment' },
        { status: 404 }
      );
    }

    // Get student data before removing
    const studentData = fromEnrollment.students[studentIndex];
    
    // Remove from source course
    fromEnrollment.students.splice(studentIndex, 1);
    fromCourse.currentEnrollment = Math.max(0, (fromCourse.currentEnrollment || 0) - 1);

    // Add to target course
    const toEnrollment = toCourse.enrollment || { students: [] };
    const newStudentEntry = typeof studentData === 'string' 
      ? {
          userId: studentId,
          enrolledAt: new Date().toISOString(),
          movedFrom: fromCourseId,
          movedAt: new Date().toISOString()
        }
      : {
          ...studentData,
          enrolledAt: new Date().toISOString(),
          movedFrom: fromCourseId,
          movedAt: new Date().toISOString(),
          sectionId: null, // Reset section when moving to new course
          sectionName: null
        };

    toEnrollment.students.push(newStudentEntry);
    toCourse.currentEnrollment = (toCourse.currentEnrollment || 0) + 1;

    // Update both courses
    await Promise.all([
      docClient.send(new UpdateCommand({
        TableName: COURSES_TABLE,
        Key: { courseId: fromCourseId },
        UpdateExpression: 'SET enrollment = :enrollment, currentEnrollment = :currentEnrollment, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':enrollment': fromEnrollment,
          ':currentEnrollment': fromCourse.currentEnrollment,
          ':updatedAt': new Date().toISOString()
        }
      })),
      docClient.send(new UpdateCommand({
        TableName: COURSES_TABLE,
        Key: { courseId: toCourseId },
        UpdateExpression: 'SET enrollment = :enrollment, currentEnrollment = :currentEnrollment, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':enrollment': toEnrollment,
          ':currentEnrollment': toCourse.currentEnrollment,
          ':updatedAt': new Date().toISOString()
        }
      }))
    ]);

    // Update student's submissions to new course
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :studentId AND courseId = :fromCourseId',
        ExpressionAttributeValues: {
          ':studentId': studentId,
          ':fromCourseId': fromCourseId
        }
      }));

      const submissions = submissionsResult.Items || [];
      console.log(`📝 Found ${submissions.length} submissions to update`);

      // Update each submission's courseId
      const submissionUpdates = submissions.map(submission => 
        docClient.send(new UpdateCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { submissionId: submission.submissionId },
          UpdateExpression: 'SET courseId = :toCourseId, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':toCourseId': toCourseId,
            ':updatedAt': new Date().toISOString()
          }
        }))
      );

      await Promise.all(submissionUpdates);
    } catch (error) {
      console.warn('Error updating submissions:', error);
    }

    // Update peer responses
    try {
      const peerResponsesResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'reviewerId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      const peerResponses = peerResponsesResult.Items || [];
      console.log(`💬 Found ${peerResponses.length} peer responses to update`);

      // Note: We don't update courseId for peer responses as they should remain 
      // associated with the original assignment/course context
    } catch (error) {
      console.warn('Error checking peer responses:', error);
    }

    console.log('✅ Student moved to new course successfully');

    return NextResponse.json({
      success: true,
      message: `Student moved from ${fromCourse.courseName} to ${toCourse.courseName} successfully`,
      data: {
        studentId,
        fromCourse: {
          id: fromCourseId,
          name: fromCourse.courseName
        },
        toCourse: {
          id: toCourseId,
          name: toCourse.courseName
        },
        submissionsUpdated: 0 // Will be updated by the actual count
      }
    });

});