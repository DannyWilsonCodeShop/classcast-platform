import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '@/lib/s3';
import { awsConfig } from '@/lib/aws-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      firstName, 
      lastName, 
      email, 
      avatar, 
      bio, 
      department, 
      title, 
      officeLocation, 
      officeHours, 
      phoneNumber, 
      website, 
      researchInterests, 
      education, 
      experience, 
      certifications 
    } = body;

    // Validate required fields
    if (!userId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userId, firstName, lastName, email' 
        },
        { status: 400 }
      );
    }

    // Handle avatar upload if it's a base64 data URL
    let avatarUrl = avatar;
    if (avatar && avatar.startsWith('data:image/')) {
      try {
        // Convert base64 to buffer
        const base64Data = avatar.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Determine content type from data URL
        const contentType = avatar.split(';')[0].split(':')[1] || 'image/jpeg';
        
        // Upload to S3
        avatarUrl = await s3Service.uploadUserAvatar(userId, buffer, contentType);
      } catch (error) {
        console.error('Avatar upload failed:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to upload avatar image' 
          },
          { status: 500 }
        );
      }
    }

    // Prepare profile data
    const profileData = {
      userId,
      firstName,
      lastName,
      email,
      avatar: avatarUrl,
      bio: bio || '',
      department: department || '',
      title: title || '',
      officeLocation: officeLocation || '',
      officeHours: officeHours || '',
      phoneNumber: phoneNumber || '',
      website: website || '',
      researchInterests: researchInterests || '',
      education: education || '',
      experience: experience || '',
      certifications: certifications || '',
      updatedAt: new Date().toISOString(),
    };

    // In a real application, you would save this to DynamoDB or your database
    // For now, we'll simulate a successful save
    console.log('Profile saved:', profileData);

    // TODO: Save to DynamoDB
    // await dynamoDBService.putItem('classcast-users', profileData);

    return NextResponse.json({
      success: true,
      data: profileData,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'userId is required' 
        },
        { status: 400 }
      );
    }

    // In a real application, you would fetch from DynamoDB
    // For now, return mock data
    const profileData = {
      userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@university.edu',
      avatar: '/api/placeholder/150/150',
      bio: 'Experienced instructor with a passion for teaching.',
      department: 'Computer Science',
      title: 'Associate Professor',
      officeLocation: 'Building A, Room 205',
      officeHours: 'Mon/Wed 2:00-4:00 PM',
      phoneNumber: '(555) 123-4567',
      website: 'https://johndoe.university.edu',
      researchInterests: 'Machine Learning, Data Structures',
      education: 'Ph.D. in Computer Science',
      experience: '10+ years teaching experience',
      certifications: 'AWS Certified, Google Cloud Professional',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
