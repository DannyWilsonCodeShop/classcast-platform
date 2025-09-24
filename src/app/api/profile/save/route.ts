import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '@/lib/dynamodb';
import { s3Service } from '@/lib/s3';

// POST /api/profile/save - Save user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

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
      certifications,
      careerGoals,
      classOf,
      funFact,
      favoriteSubject,
      hobbies,
      schoolName,
    } = body;

    // Get existing user profile
    const existingUser = await dynamoDBService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Handle avatar upload if it's a base64 data URL
    let avatarUrl = avatar;
    if (avatar && avatar.startsWith('data:image/')) {
      try {
        // Extract base64 data and file type
        const matches = avatar.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          const fileType = matches[1];
          const base64Data = matches[2];
          
          // Convert base64 to buffer
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate unique filename
          const fileName = `avatar_${userId}_${Date.now()}.${fileType}`;
          
          // Upload to S3
          avatarUrl = await s3Service.uploadUserAvatar(
            userId,
            buffer,
            `image/${fileType}`
          );
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        // Continue with original avatar if upload fails
      }
    }

    // Prepare updated profile data (exclude userId as it's the primary key)
    const updatedProfile = {
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      email: email || existingUser.email,
      avatar: avatarUrl || existingUser.avatar,
      bio: bio || existingUser.bio,
      department: department || existingUser.department,
      title: title || existingUser.title,
      officeLocation: officeLocation || existingUser.officeLocation,
      officeHours: officeHours || existingUser.officeHours,
      phoneNumber: phoneNumber || existingUser.phoneNumber,
      website: website || existingUser.website,
      researchInterests: researchInterests || existingUser.researchInterests,
      education: education || existingUser.education,
      experience: experience || existingUser.experience,
      certifications: certifications || existingUser.certifications,
      careerGoals: careerGoals || existingUser.careerGoals,
      classOf: classOf || existingUser.classOf,
      funFact: funFact || existingUser.funFact,
      favoriteSubject: favoriteSubject || existingUser.favoriteSubject,
      hobbies: hobbies || existingUser.hobbies,
      schoolName: schoolName || existingUser.schoolName,
      updatedAt: new Date().toISOString(),
    };

    // Update user in DynamoDB
    await dynamoDBService.updateUser(userId, existingUser.email, updatedProfile);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}