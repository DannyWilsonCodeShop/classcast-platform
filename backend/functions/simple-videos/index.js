// Simple Videos Lambda - Basic video handler
exports.handler = async (event) => {
  console.log('Videos event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const videoId = event.pathParameters?.videoId;

    if (method === 'GET') {
      if (videoId) {
        // Return specific video
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            success: true,
            data: {
              video: {
                id: videoId,
                title: 'Sample Video',
                description: 'A sample video for testing',
                thumbnail: 'https://via.placeholder.com/400x225/4A90E2/FFFFFF?text=Video+Thumbnail',
                videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                duration: 120,
                author: {
                  id: 'user_123',
                  name: 'Test User',
                  avatar: '😊',
                  course: 'CS 101 - Introduction to Programming'
                },
                likes: 0,
                comments: 0,
                isLiked: false,
                createdAt: new Date().toISOString(),
                courseId: 'cs-101'
              }
            }
          })
        };
      } else {
        // Return all videos (empty for now)
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({
            success: true,
            data: {
              videos: []
            }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new video
      const body = JSON.parse(event.body || '{}');
      
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: {
            video: {
              id: 'video_' + Date.now(),
              title: body.title || 'New Video',
              description: body.description || 'A new video',
              thumbnail: body.thumbnail || 'https://via.placeholder.com/400x225/4A90E2/FFFFFF?text=New+Video',
              videoUrl: body.videoUrl || '',
              duration: body.duration || 0,
              author: {
                id: 'user_123',
                name: 'Test User',
                avatar: '😊',
                course: body.course || 'CS 101'
              },
              likes: 0,
              comments: 0,
              isLiked: false,
              createdAt: new Date().toISOString(),
              courseId: body.courseId || 'cs-101'
            }
          },
          message: 'Video created successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Videos error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
