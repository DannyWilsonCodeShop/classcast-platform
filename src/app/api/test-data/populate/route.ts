import { NextRequest, NextResponse } from 'next/server';
import { testDataGenerator } from '@/lib/testDataGenerator';

export async function POST(request: NextRequest) {
  try {
    // Generate all test data
    testDataGenerator.generateAllData();

    // Get the generated data
    const users = testDataGenerator.getUsers();
    const courses = testDataGenerator.getCourses();
    const assignments = testDataGenerator.getAssignments();
    const videos = testDataGenerator.getVideos();
    const comments = testDataGenerator.getComments();
    const responses = testDataGenerator.getResponses();

    // In a real application, you would save this data to your database
    // For now, we'll return the data structure
    const testData = {
      users,
      courses,
      assignments,
      videos,
      comments,
      responses,
      summary: {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalAssignments: assignments.length,
        totalVideos: videos.length,
        totalComments: comments.length,
        totalResponses: responses.length
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Test data generated successfully',
      data: testData
    });

  } catch (error) {
    console.error('Error generating test data:', error);
    return NextResponse.json(
      { error: 'Failed to generate test data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return current test data without regenerating
    const users = testDataGenerator.getUsers();
    const courses = testDataGenerator.getCourses();
    const assignments = testDataGenerator.getAssignments();
    const videos = testDataGenerator.getVideos();
    const comments = testDataGenerator.getComments();
    const responses = testDataGenerator.getResponses();

    return NextResponse.json({
      success: true,
      data: {
        users,
        courses,
        assignments,
        videos,
        comments,
        responses,
        summary: {
          totalUsers: users.length,
          totalCourses: courses.length,
          totalAssignments: assignments.length,
          totalVideos: videos.length,
          totalComments: comments.length,
          totalResponses: responses.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test data' },
      { status: 500 }
    );
  }
}
