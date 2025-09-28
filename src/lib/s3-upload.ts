export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadAvatarToS3(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file'
      };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      };
    }

    // Use the existing upload API instead of direct S3 upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'profile-pictures');
    formData.append('userId', userId);
    formData.append('metadata', JSON.stringify({
      fileType: 'avatar',
      uploadedAt: new Date().toISOString()
    }));

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    
    return {
      success: true,
      url: result.data.fileUrl
    };

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function uploadBase64ToS3(
  base64Data: string,
  userId: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create a file from the blob
    const file = new File([blob], `avatar_${userId}.jpg`, { type: contentType });
    
    // Use the file upload function
    return await uploadAvatarToS3(file, userId);

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
