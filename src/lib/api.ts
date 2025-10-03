// ============================================================================
// CLEAN API CLIENT - Frontend API integration with new backend
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  emailVerified: boolean;
  bio?: string;
  careerGoals?: string;
  classOf?: string;
  funFact?: string;
  favoriteSubject?: string;
  hobbies?: string;
  schoolName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  instructorId: string;
  instructorName: string;
  status: 'draft' | 'published' | 'archived';
  semester: string;
  year: number;
  credits: number;
  maxEnrollment?: number;
  currentEnrollment: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VideoReel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  author?: {
    id: string;
    name: string;
    avatar: string;
    course: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  courseId: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokenFromStorage();
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  clearToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
    }
  }

  isTokenValid(): boolean {
    if (!this.accessToken) return false;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  async ensureValidToken(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true;
    }

    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearToken();
      return false;
    }
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Ensure we have a valid token before making the request
    if (this.accessToken && !this.isTokenValid()) {
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as any).Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // If we get a 401, try to refresh the token and retry once
      if (response.status === 401 && this.accessToken) {
        try {
          const tokenValid = await this.ensureValidToken();
          if (tokenValid) {
            // Retry the request with the new token
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${this.accessToken}`,
            };
            
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            
            const retryData = await retryResponse.json();
            
            if (!retryResponse.ok) {
              throw new Error(retryData.error || `HTTP ${retryResponse.status}`);
            }
            
            return retryData;
          }
        } catch (refreshError) {
          console.error('Token refresh failed during request retry:', refreshError);
          // Fall through to original error
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const url = `${this.baseUrl}/auth/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Login response data:', data);

    // Handle JWT-based login response format
    if (data.success && data.user && data.tokens) {
      this.setAccessToken(data.tokens.accessToken);
      
      // Store all tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('idToken', data.tokens.idToken);
      }

      return {
        user: data.user,
        tokens: data.tokens
      };
    }

    // Handle Lambda response format (data in body field as JSON string)
    if (data.body) {
      try {
        const bodyData = JSON.parse(data.body);
        console.log('Parsed body data:', bodyData);
        
        if (bodyData.user && bodyData.tokens) {
          this.setAccessToken(bodyData.tokens.accessToken);
          
          // Store all tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', bodyData.tokens.refreshToken);
            localStorage.setItem('idToken', bodyData.tokens.idToken);
          }

          return {
            user: bodyData.user,
            tokens: bodyData.tokens
          };
        }
      } catch (parseError) {
        console.error('Error parsing body data:', parseError);
      }
    }

    // Handle direct user/tokens format
    if (data.user && data.tokens) {
      this.setAccessToken(data.tokens.accessToken);
      
      // Store all tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('idToken', data.tokens.idToken);
      }

      return {
        user: data.user,
        tokens: data.tokens
      };
    }

    // Handle API response format (if success/data structure)
    if (data.success && data.data) {
      this.setAccessToken(data.data.tokens.accessToken);
      
      // Store all tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('idToken', data.data.tokens.idToken);
      }

      return data.data;
    }

    throw new Error('Invalid login response format');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearToken();
    }
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      this.setAccessToken(response.data.tokens.accessToken);
      
      // Update stored tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('idToken', response.data.tokens.idToken);
      }

      return response.data;
    }

    throw new Error('Token refresh failed');
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.request<{ success: boolean; data: User }>(`/profile?userId=${userId}`);
    return response.data!.data;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.request<{ success: boolean; user: User; message: string }>('/profile/save', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...updates
      }),
    });
    return response.user;
  }

  // ============================================================================
  // COURSE ENDPOINTS
  // ============================================================================

  async getCourses(): Promise<Course[]> {
    const response = await this.request<{ courses: Course[] }>('/courses');
    return response.data!.courses;
  }

  async getCourse(courseId: string): Promise<Course> {
    const response = await this.request<{ course: Course }>(`/courses/${courseId}`);
    return response.data!.course;
  }

  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const response = await this.request<{ course: Course }>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    return response.data!.course;
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    const response = await this.request<{ course: Course }>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!.course;
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // VIDEO ENDPOINTS
  // ============================================================================

  async getVideos(): Promise<VideoReel[]> {
    const response = await this.request<{ videos: VideoReel[] }>('/videos');
    return response.videos || [];
  }

  async getVideo(videoId: string): Promise<VideoReel> {
    const response = await this.request<{ video: VideoReel }>(`/videos/${videoId}`);
    return response.video;
  }

  async createVideo(videoData: Partial<VideoReel>): Promise<VideoReel> {
    const response = await this.request<{ video: VideoReel }>('/videos', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
    return response.video;
  }

  async updateVideo(videoId: string, updates: Partial<VideoReel>): Promise<VideoReel> {
    const response = await this.request<{ video: VideoReel }>(`/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!.video;
  }

  async deleteVideo(videoId: string): Promise<void> {
    await this.request(`/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  async likeVideo(videoId: string): Promise<VideoReel> {
    const response = await this.request<{ video: VideoReel }>(`/videos/${videoId}/like`, {
      method: 'POST',
    });
    return response.data!.video;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  setCurrentUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const api = {
  // Auth
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  logout: () => apiClient.logout(),
  refreshToken: () => apiClient.refreshToken(),
  
  // User
  getUserProfile: (userId: string) => apiClient.getUserProfile(userId),
  updateUserProfile: (userId: string, updates: Partial<User>) => 
    apiClient.updateUserProfile(userId, updates),
  
  // Courses
  getCourses: () => apiClient.getCourses(),
  getCourse: (courseId: string) => apiClient.getCourse(courseId),
  createCourse: (courseData: Partial<Course>) => apiClient.createCourse(courseData),
  updateCourse: (courseId: string, updates: Partial<Course>) => 
    apiClient.updateCourse(courseId, updates),
  deleteCourse: (courseId: string) => apiClient.deleteCourse(courseId),
  
  // Videos
  getVideos: () => apiClient.getVideos(),
  getVideo: (videoId: string) => apiClient.getVideo(videoId),
  createVideo: (videoData: Partial<VideoReel>) => apiClient.createVideo(videoData),
  updateVideo: (videoId: string, updates: Partial<VideoReel>) => 
    apiClient.updateVideo(videoId, updates),
  deleteVideo: (videoId: string) => apiClient.deleteVideo(videoId),
  likeVideo: (videoId: string) => apiClient.likeVideo(videoId),
  
  // Utils
  isAuthenticated: () => apiClient.isAuthenticated(),
  getCurrentUser: () => apiClient.getCurrentUser(),
  setCurrentUser: (user: User) => apiClient.setCurrentUser(user),
  clearCurrentUser: () => apiClient.clearCurrentUser(),
  ensureValidToken: () => apiClient.ensureValidToken(),
};

export default apiClient;
