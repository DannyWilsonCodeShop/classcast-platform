/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Determine the base URL based on environment
const getBaseURL = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.NODE_ENV === 'production' 
      ? 'https://belixlmhba.execute-api.us-east-1.amazonaws.com/prod'
      : 'http://localhost:3000';
  } else {
    // Client-side
    return process.env.NODE_ENV === 'production'
      ? 'https://belixlmhba.execute-api.us-east-1.amazonaws.com/prod'
      : 'http://localhost:3000';
  }
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  ENDPOINTS: {
    // Authentication endpoints (using Lambda functions)
    AUTH: {
      SIGNUP: '/auth/signup',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    // Other endpoints (using Amplify serverless functions)
    PROFILE: {
      GET: '/profile',
      UPDATE: '/profile/update',
      UPLOAD_AVATAR: '/profile/upload-avatar',
    },
    ASSIGNMENTS: {
      LIST: '/assignments',
      GET: '/assignments',
      CREATE: '/assignments/create',
      UPDATE: '/assignments/update',
      DELETE: '/assignments/delete',
    },
    SUBMISSIONS: {
      LIST: '/submissions',
      GET: '/submissions',
      CREATE: '/submissions/create',
      UPDATE: '/submissions/update',
      DELETE: '/submissions/delete',
    },
    UPLOAD: {
      VIDEO: '/upload',
      IMAGE: '/upload/image',
    },
    PEER_RESPONSES: {
      LIST: '/peer-responses',
      CREATE: '/peer-responses/create',
      UPDATE: '/peer-responses/update',
      DELETE: '/peer-responses/delete',
      VALIDATE: '/peer-responses/validate',
    },
    PEER_INTERACTIONS: {
      LIKE: '/peer-interactions',
      RATE: '/peer-interactions',
      GET_STATS: '/student/peer-profile',
    },
    AI: {
      RUBRIC_GENERATOR: '/ai/rubric-generator',
    },
    CONTENT_MODERATION: {
      CHECK: '/content-moderation',
    },
  },
} as const;

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if endpoint uses Lambda functions
export const isLambdaEndpoint = (endpoint: string): boolean => {
  const lambdaEndpoints = [
    API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
    API_CONFIG.ENDPOINTS.AUTH.LOGIN,
    API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
    API_CONFIG.ENDPOINTS.AUTH.REFRESH,
    API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
    API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION,
    API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
    API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
  ];
  
  return lambdaEndpoints.includes(endpoint);
};

export default API_CONFIG;
