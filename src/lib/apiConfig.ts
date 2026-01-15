/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    assignments: `${API_BASE_URL}/assignments`,
    courses: `${API_BASE_URL}/courses`,
    users: `${API_BASE_URL}/users`,
    videos: `${API_BASE_URL}/videos`,
    submissions: `${API_BASE_URL}/video-submissions`,
    auth: `${API_BASE_URL}/auth`,
    upload: `${API_BASE_URL}/upload`,
  }
};

/**
 * Get full API URL for a given path
 * @param path - API path (with or without leading slash)
 * @returns Full API URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Get API URL for assignments
 * @param assignmentId - Optional assignment ID
 * @returns Assignment API URL
 */
export function getAssignmentApiUrl(assignmentId?: string): string {
  return assignmentId 
    ? `${apiConfig.endpoints.assignments}/${assignmentId}`
    : apiConfig.endpoints.assignments;
}

/**
 * Make API request with proper error handling
 * @param path - API path
 * @param options - Fetch options
 * @returns Promise with response
 */
export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // Log for debugging
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    console.log(`📡 Response Status: ${response.status}`);
    
    return response;
  } catch (error) {
    console.error(`❌ API Request Failed: ${url}`, error);
    throw error;
  }
}

/**
 * Check if we should use local API routes (development) or external API Gateway (production)
 */
export function shouldUseLocalApi(): boolean {
  return process.env.NODE_ENV === 'development' && 
         typeof window !== 'undefined' && 
         window.location.hostname === 'localhost';
}

/**
 * Get the appropriate API URL based on environment
 */
export function getEnvironmentApiUrl(path: string): string {
  if (shouldUseLocalApi()) {
    // Use local Next.js API routes in development
    return `/api/${path.startsWith('/') ? path.slice(1) : path}`;
  } else {
    // Use API Gateway in production
    return getApiUrl(path);
  }
}