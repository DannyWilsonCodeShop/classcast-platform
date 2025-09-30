// Simple Users Lambda - Basic user profile handler
exports.handler = async (event) => {
  console.log('Users event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'User ID is required'
        })
      };
    }

    if (method === 'GET') {
      // Return mock user profile
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: userId,
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'student',
              avatar: '',
              emailVerified: true,
              bio: '',
              careerGoals: '',
              classOf: '2024',
              funFact: '',
              favoriteSubject: '',
              hobbies: '',
              schoolName: 'Test University'
            }
          }
        })
      };
    }

    if (method === 'PUT') {
      // Update user profile
      const body = JSON.parse(event.body || '{}');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: userId,
              email: 'test@example.com',
              firstName: body.firstName || 'Test',
              lastName: body.lastName || 'User',
              role: 'student',
              avatar: body.avatar || '',
              emailVerified: true,
              bio: body.bio || '',
              careerGoals: body.careerGoals || '',
              classOf: body.classOf || '2024',
              funFact: body.funFact || '',
              favoriteSubject: body.favoriteSubject || '',
              hobbies: body.hobbies || '',
              schoolName: body.schoolName || 'Test University'
            }
          },
          message: 'Profile updated successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };

  } catch (error) {
    console.error('Users error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
