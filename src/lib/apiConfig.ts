import { ApiClient } from './apiClient';
import { TokenManager } from './tokenManager';

// API Gateway configuration
const API_GATEWAY_URL = 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod';

// Create API client instance
export const apiClient = new ApiClient({
  baseUrl: API_GATEWAY_URL,
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000
});

// Initialize token manager with default implementations
export const tokenManager = new TokenManager(
  {
    get: () => {
      const tokens = localStorage.getItem('authTokens');
      return tokens ? JSON.parse(tokens) : null;
    },
    set: (tokens) => {
      localStorage.setItem('authTokens', JSON.stringify(tokens));
    },
    remove: () => {
      localStorage.removeItem('authTokens');
    }
  },
  async () => {
    // Default token refresher - would need to be implemented based on your auth system
    throw new Error('Token refresh not implemented');
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNIN: '/auth',
    SIGNUP: '/auth',
    SIGNOUT: '/auth',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CONFIRM_PASSWORD_RESET: '/auth/confirm-password-reset',
    REFRESH_TOKEN: '/auth/refresh-token',
    RESEND_CONFIRMATION: '/auth/resend-confirmation',
    CONFIRM_SIGNUP: '/auth/confirm-signup'
  },
  
  // Assignments
  ASSIGNMENTS: {
    LIST: '/assignments',
    CREATE: '/assignments',
    GET: (id: string) => `/assignments/${id}`,
    UPDATE: (id: string) => `/assignments/${id}`,
    DELETE: (id: string) => `/assignments/${id}`
  },
  
  // Submissions
  SUBMISSIONS: {
    LIST: '/submissions',
    GRADE: '/submissions',
    GET: (id: string) => `/submissions/${id}`,
    UPDATE: (id: string) => `/submissions/${id}`
  },
  
  // Grades
  GRADES: {
    LIST: '/grades',
    GET: (id: string) => `/grades/${id}`
  },
  
  // Video
  VIDEO: {
    UPLOAD_URL: '/video',
    PROCESS: '/video'
  },
  
  // Users
  USERS: {
    ROLES: '/users',
    ROLE_SIGNUP: '/users'
  },
  
  // Community
  COMMUNITY: {
    FEED: '/community',
    POST: '/community'
  },
  
  // Utils
  UTILS: {
    VERIFY_TOKEN: '/utils',
    SESSION: '/utils'
  }
};

// Helper functions for common API calls
export const apiHelpers = {
  // Authentication helpers
  async signIn(email: string, password: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNIN, { email, password });
  },
  
  async signUp(userData: any) {
    return apiClient.put(API_ENDPOINTS.AUTH.SIGNUP, userData);
  },
  
  async signOut() {
    return apiClient.delete(API_ENDPOINTS.AUTH.SIGNOUT);
  },
  
  async forgotPassword(email: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },
  
  async confirmPasswordReset(email: string, code: string, newPassword: string) {
    return apiClient.post(API_ENDPOINTS.AUTH.CONFIRM_PASSWORD_RESET, { email, code, newPassword });
  },
  
  // Assignment helpers
  async getAssignments(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.ASSIGNMENTS.LIST}${queryParams}`);
  },
  
  async createAssignment(assignmentData: any) {
    return apiClient.post(API_ENDPOINTS.ASSIGNMENTS.CREATE, assignmentData);
  },
  
  async getAssignment(id: string) {
    return apiClient.get(API_ENDPOINTS.ASSIGNMENTS.GET(id));
  },
  
  async updateAssignment(id: string, assignmentData: any) {
    return apiClient.put(API_ENDPOINTS.ASSIGNMENTS.UPDATE(id), assignmentData);
  },
  
  async deleteAssignment(id: string) {
    return apiClient.delete(API_ENDPOINTS.ASSIGNMENTS.DELETE(id));
  },
  
  // Submission helpers
  async getSubmissions(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.SUBMISSIONS.LIST}${queryParams}`);
  },
  
  async gradeSubmission(submissionId: string, gradeData: any) {
    return apiClient.post(API_ENDPOINTS.SUBMISSIONS.GRADE, { submissionId, ...gradeData });
  },
  
  // Grade helpers
  async getGrades(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return apiClient.get(`${API_ENDPOINTS.GRADES.LIST}${queryParams}`);
  },
  
  // Video helpers
  async generateVideoUploadUrl(videoData: any) {
    return apiClient.post(API_ENDPOINTS.VIDEO.UPLOAD_URL, videoData);
  },
  
  async processVideoSubmission(videoData: any) {
    return apiClient.put(API_ENDPOINTS.VIDEO.PROCESS, videoData);
  },
  
  // User management helpers
  async getUserRoles() {
    return apiClient.get(API_ENDPOINTS.USERS.ROLES);
  },
  
  async roleBasedSignup(userData: any) {
    return apiClient.post(API_ENDPOINTS.USERS.ROLE_SIGNUP, userData);
  },
  
  // Community helpers
  async getCommunityFeed() {
    return apiClient.get(API_ENDPOINTS.COMMUNITY.FEED);
  },
  
  async postToCommunity(postData: any) {
    return apiClient.post(API_ENDPOINTS.COMMUNITY.POST, postData);
  },
  
  // Utility helpers
  async verifyToken(token: string) {
    return apiClient.post(API_ENDPOINTS.UTILS.VERIFY_TOKEN, { token });
  },
  
  async getSessionInfo() {
    return apiClient.get(API_ENDPOINTS.UTILS.SESSION);
  },
  
  async updateSession(sessionData: any) {
    return apiClient.put(API_ENDPOINTS.UTILS.SESSION, sessionData);
  },
  
  async endSession() {
    return apiClient.delete(API_ENDPOINTS.UTILS.SESSION);
  }
};

export default apiClient;
