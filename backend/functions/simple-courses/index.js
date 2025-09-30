// Simple Courses Lambda - Basic course handler
exports.handler = async (event) => {
  console.log('Courses event:', JSON.stringify(event, null, 2));
  
  try {
    const method = event.httpMethod;
    const courseId = event.pathParameters?.courseId;

    if (method === 'GET') {
      if (courseId) {
        // Return specific course
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
              course: {
                id: courseId,
                name: 'Sample Course',
                code: 'CS101',
                description: 'A sample course for testing',
                instructorId: 'instructor_123',
                instructorName: 'Dr. Smith',
                status: 'published',
                semester: 'Fall',
                year: 2024,
                credits: 3,
                maxEnrollment: 30,
                currentEnrollment: 0,
                schedule: {
                  days: ['Monday', 'Wednesday'],
                  time: '10:00 AM - 11:00 AM',
                  location: 'Room 101'
                },
                prerequisites: [],
                learningObjectives: ['Learn the basics'],
                gradingPolicy: {
                  assignments: 60,
                  exams: 30,
                  participation: 10,
                  projects: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          })
        };
      } else {
        // Return all courses
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
              courses: []
            }
          })
        };
      }
    }

    if (method === 'POST') {
      // Create new course
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
            course: {
              id: 'course_' + Date.now(),
              name: body.name || 'New Course',
              code: body.code || 'NEW101',
              description: body.description || 'A new course',
              instructorId: body.instructorId || 'instructor_123',
              instructorName: 'Dr. Smith',
              status: 'draft',
              semester: body.semester || 'Fall',
              year: body.year || 2024,
              credits: body.credits || 3,
              maxEnrollment: body.maxEnrollment || 30,
              currentEnrollment: 0,
              schedule: body.schedule || {
                days: ['Monday', 'Wednesday'],
                time: '10:00 AM - 11:00 AM',
                location: 'Room 101'
              },
              prerequisites: body.prerequisites || [],
              learningObjectives: body.learningObjectives || ['Learn something new'],
              gradingPolicy: body.gradingPolicy || {
                assignments: 60,
                exams: 30,
                participation: 10,
                projects: 0
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          message: 'Course created successfully'
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
    console.error('Courses error:', error);
    
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
