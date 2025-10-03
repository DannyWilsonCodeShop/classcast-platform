import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SECTIONS_TABLE = 'classcast-sections';

// POST /api/courses/find-by-code - Find course by class code and return its sections
export async function POST(request: NextRequest) {
  try {
    const { classCode } = await request.json();
    
    console.log('Finding course with classCode:', classCode);

    if (!classCode || typeof classCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Class code is required' },
        { status: 400 }
      );
    }

    // Normalize the class code
    const normalizedClassCode = classCode.trim().toUpperCase();

    if (normalizedClassCode.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Class code must be at least 5 characters' },
        { status: 400 }
      );
    }

    // First, try to find by section code
    let course = null;
    let foundSection = null;
    
    try {
      // Check if this is a section code
      const sectionResult = await docClient.send(new ScanCommand({
        TableName: SECTIONS_TABLE,
        FilterExpression: 'sectionCode = :sectionCode',
        ExpressionAttributeValues: {
          ':sectionCode': normalizedClassCode
        }
      }));
      
      if (sectionResult.Items?.length > 0) {
        foundSection = sectionResult.Items[0];
        console.log('Found section with code:', foundSection);
        
        // Get the course for this section
        const courseResult = await docClient.send(new ScanCommand({
          TableName: COURSES_TABLE,
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': foundSection.courseId
          }
        }));
        
        course = courseResult.Items?.[0];
        console.log('Found course for section:', course);
      }
    } catch (sectionError) {
      console.log('No section found with this code, trying course search...');
    }
    
    // If no section found, try course search
    if (!course) {
      try {
        console.log('Searching for course with classCode:', normalizedClassCode);
        const coursesResult = await docClient.send(new ScanCommand({
          TableName: COURSES_TABLE,
          FilterExpression: 'classCode = :classCode OR courseCode = :courseCode',
          ExpressionAttributeValues: {
            ':classCode': normalizedClassCode,
            ':courseCode': normalizedClassCode
          }
        }));
        
        console.log('Course search result:', { 
          itemCount: coursesResult.Items?.length || 0,
          items: coursesResult.Items 
        });
        
        course = coursesResult.Items?.[0];
      } catch (dbError: any) {
        console.error('Database error searching for course:', dbError);
        return NextResponse.json(
          { success: false, error: 'Database error occurred' },
          { status: 500 }
        );
      }
    }

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found. Please check your class code.' },
        { status: 404 }
      );
    }

    // Check if course is published and available for enrollment
    if (course.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Find all sections for this course
    let sections: any[] = [];
    try {
      const sectionsResult = await docClient.send(new QueryCommand({
        TableName: SECTIONS_TABLE,
        IndexName: 'courseId-index',
        KeyConditionExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': course.courseId
        }
      }));
      
      sections = sectionsResult.Items || [];
      console.log(`Found ${sections.length} sections for course ${course.courseId}`);
      
      // If we found a section by code, move it to the front of the list
      if (foundSection) {
        sections = sections.sort((a, b) => {
          if (a.sectionId === foundSection.sectionId) return -1;
          if (b.sectionId === foundSection.sectionId) return 1;
          return 0;
        });
      }
    } catch (dbError: any) {
      console.error('Database error searching for sections:', dbError);
      // Don't fail the request if sections can't be found, just return empty array
      sections = [];
    }

    // Return course and sections
    return NextResponse.json({
      success: true,
      course: {
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        code: course.code,
        classCode: course.classCode,
        instructorId: course.instructorId,
        maxStudents: course.maxStudents,
        currentEnrollment: course.currentEnrollment,
        status: course.status
      },
      sections: sections.map(section => ({
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        sectionCode: section.sectionCode,
        description: section.description,
        maxEnrollment: section.maxEnrollment,
        currentEnrollment: section.currentEnrollment,
        schedule: section.schedule,
        location: section.location,
        instructorId: section.instructorId,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        isActive: section.isActive
      }))
    });

  } catch (error) {
    console.error('Error finding course by code:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
