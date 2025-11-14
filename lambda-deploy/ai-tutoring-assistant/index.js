const AWS = require('aws-sdk');
const OpenAI = require('openai');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  const requestId = `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting AI tutoring session`);
    
    const { message, sessionId, userId, courseId, assignmentId, context } = JSON.parse(event.body);
    
    if (!message || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Message and userId are required'
        })
      };
    }

    // Get or create session
    let session = await getTutoringSession(sessionId, userId, requestId);
    
    // Get AI response
    const response = await chatWithTutor(message, session, { assignmentId, courseId }, requestId);
    
    // Update session
    await updateTutoringSession(session.sessionId, response.session, requestId);
    
    console.log(`[${requestId}] Tutoring session completed successfully`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        response: response.response,
        session: response.session
      })
    };
    
  } catch (error) {
    console.error(`[${requestId}] Tutoring session error:`, error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Tutoring session failed',
        details: error.message
      })
    };
  }
};

async function getTutoringSession(sessionId, userId, requestId) {
  if (sessionId) {
    try {
      const params = {
        TableName: process.env.TUTORING_SESSIONS_TABLE_NAME || 'classcast-tutoring-sessions',
        Key: { sessionId }
      };
      
      const result = await dynamodb.get(params).promise();
      if (result.Item) {
        console.log(`[${requestId}] Retrieved existing session: ${sessionId}`);
        return result.Item;
      }
    } catch (error) {
      console.warn(`[${requestId}] Error retrieving session: ${error.message}`);
    }
  }
  
  // Create new session
  const newSession = {
    sessionId: `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    messages: [],
    context: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log(`[${requestId}] Created new session: ${newSession.sessionId}`);
  return newSession;
}

async function chatWithTutor(message, session, context, requestId) {
  const systemPrompt = buildTutoringSystemPrompt(session, context);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

  // Update session
  const updatedSession = {
    ...session,
    messages: [
      ...session.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    ],
    updatedAt: new Date().toISOString()
  };

  return { response, session: updatedSession };
}

function buildTutoringSystemPrompt(session, context) {
  let prompt = `You are an AI tutoring assistant for ClassCast, an educational platform. You help students learn and understand concepts.

Your role:
- Provide clear, educational explanations
- Ask guiding questions to help students think through problems
- Offer examples and analogies when helpful
- Encourage learning and build confidence
- Stay focused on educational content

Student context:
- Subject: ${session.context.subject || 'General'}
- Difficulty level: ${session.context.difficulty || 'intermediate'}
- Learning goals: ${session.context.learningGoals?.join(', ') || 'General learning'}`;

  if (context?.assignmentId) {
    prompt += `\n- Current assignment: ${context.assignmentId}`;
  }
  if (context?.courseId) {
    prompt += `\n- Current course: ${context.courseId}`;
  }

  prompt += `\n\nAlways be encouraging, patient, and educational. If you don't know something, say so and suggest how the student might find the answer.`;

  return prompt;
}

async function updateTutoringSession(sessionId, session, requestId) {
  const params = {
    TableName: process.env.TUTORING_SESSIONS_TABLE_NAME || 'classcast-tutoring-sessions',
    Item: session
  };

  await dynamodb.put(params).promise();
  console.log(`[${requestId}] Updated tutoring session: ${sessionId}`);
}
