// Simple Auth Lambda - Basic authentication handler
exports.handler = async (event) => {
  console.log('Auth event:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body || '{}');
    
    if (!body.email || !body.password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Email and password are required'
        })
      };
    }

    // Determine user role based on email
    let userRole = 'student';
    let userId = 'user_' + Date.now();
    let firstName = 'Test';
    let lastName = 'User';
    
    // Instructor emails
    if (body.email === 'wilson.danny@me.com' || 
        body.email === 'instructor@example.com' ||
        body.email.includes('instructor') ||
        body.email.includes('teacher') ||
        body.email.includes('prof')) {
      userRole = 'instructor';
      userId = 'instructor_' + Date.now();
      firstName = body.email.split('@')[0].split('.')[0] || 'Instructor';
      lastName = body.email.split('@')[0].split('.')[1] || 'User';
      // Capitalize first letter
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
    }

    // Admin emails
    if (body.email === 'admin@class-cast.com' || 
        body.email.includes('admin@')) {
      userRole = 'admin';
      userId = 'admin_' + Date.now();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: userId,
            email: body.email,
            firstName: firstName,
            lastName: lastName,
            role: userRole,
            emailVerified: true,
            instructorId: userRole === 'instructor' ? userId : undefined
          },
          tokens: {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            idToken: 'mock_id_token'
          }
        }
      })
    };

  } catch (error) {
    console.error('Auth error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
