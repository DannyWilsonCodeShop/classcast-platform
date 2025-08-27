// Mock authentication service for development
// This bypasses AWS Cognito for local development

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
  emailVerified: boolean;
  password: string;
}

// Interface for user objects without passwords (for security)
export interface MockUserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
  emailVerified: boolean;
}

// Simple in-memory storage
const mockUsers = new Map<string, MockUser>();
const mockSessions = new Map<string, string>();

// Create default test users
const createDefaultUsers = () => {
  console.log('Creating default users...');
  
  // Clear existing users first
  mockUsers.clear();
  
  // Create test instructor
  mockUsers.set('instructor@classcast.com', {
    id: 'instructor_001',
    email: 'instructor@classcast.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'password123',
    role: 'instructor',
    instructorId: 'INS001',
    department: 'Computer Science',
    emailVerified: true
  });

  // Create test student
  mockUsers.set('student@classcast.com', {
    id: 'student_001',
    email: 'student@classcast.com',
    firstName: 'Jane',
    lastName: 'Smith',
    password: 'password123',
    role: 'student',
    studentId: 'STU001',
    emailVerified: true
  });

  // Create test admin
  mockUsers.set('admin@classcast.com', {
    id: 'admin_001',
    email: 'admin@classcast.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'password123',
    role: 'admin',
    emailVerified: true
  });

  console.log('✅ Default users created successfully:', Array.from(mockUsers.keys()));
  console.log('📊 Total users in system:', mockUsers.size);
};

export class MockAuthService {
  private initialized = false;

  constructor() {
    console.log('🔧 MockAuthService constructor called');
    this.initialize();
  }

  private initialize() {
    if (this.initialized) {
      console.log('🔄 MockAuthService already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing MockAuthService...');
    createDefaultUsers();
    this.initialized = true;
    console.log('✅ MockAuthService initialization complete');
  }

  // Ensure service is initialized before any operation
  private ensureInitialized() {
    if (!this.initialized) {
      console.log('⚠️ MockAuthService not initialized, initializing now...');
      this.initialize();
    }
  }

  async login(email: string, password: string): Promise<{ user: MockUserPublic; token: string }> {
    this.ensureInitialized();
    
    console.log('🔐 MockAuthService.login called with:', { email, password });
    console.log('👥 Available users:', Array.from(mockUsers.keys()));
    console.log('📊 Total users in system:', mockUsers.size);
    
    const user = mockUsers.get(email);
    if (!user) {
      console.log('❌ User not found:', email);
      console.log('🔍 All users in system:', Array.from(mockUsers.entries()));
      throw new Error('Invalid email or password');
    }
    
    if (user.password !== password) {
      console.log('❌ Password mismatch for user:', email);
      console.log('🔑 Expected password:', user.password);
      console.log('🔑 Provided password:', password);
      throw new Error('Invalid email or password');
    }
    
    const token = `mock-token-${user.id}-${Date.now()}`;
    mockSessions.set(token, user.id);
    console.log('✅ Mock user logged in successfully:', user.email);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserFromToken(token: string): Promise<MockUserPublic | null> {
    const userId = mockSessions.get(token);
    if (!userId) return null;
    
    for (const user of mockUsers.values()) {
      if (user.id === userId) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  async logout(token: string): Promise<void> {
    mockSessions.delete(token);
    console.log('Mock user logged out.');
  }

  async getUser(email: string): Promise<MockUserPublic | null> {
    const user = mockUsers.get(email);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: 'student' | 'instructor' | 'admin';
    studentId?: string;
    instructorId?: string;
    department?: string;
  }): Promise<MockUserPublic> {
    console.log('MockAuthService.createUser called with:', userData);
    
    if (mockUsers.has(userData.email)) {
      throw new Error('A user with this email already exists');
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const user: MockUser = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      studentId: userData.studentId,
      instructorId: userData.instructorId,
      department: userData.department,
      emailVerified: true,
      password: userData.password,
    };
    
    mockUsers.set(userData.email, user);
    console.log('User created successfully:', user.email);
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Debug methods
  debugState() {
    this.ensureInitialized();
    console.log('=== MockAuthService Debug State ===');
    console.log('Initialized:', this.initialized);
    console.log('Users count:', mockUsers.size);
    console.log('Users:', Array.from(mockUsers.keys()));
    console.log('Sessions count:', mockSessions.size);
    console.log('==================================');
  }

  reinitialize() {
    console.log('🔄 Reinitializing MockAuthService');
    this.initialized = false;
    mockSessions.clear();
    this.initialize();
    console.log('✅ MockAuthService reinitialized');
  }

  // Manual initialization method
  forceInitialize() {
    console.log('🚀 Force initializing MockAuthService...');
    this.initialized = false;
    this.initialize();
    console.log('✅ MockAuthService force initialization complete');
  }

  // Get all users (for debugging)
  getAllUsers() {
    this.ensureInitialized();
    return Array.from(mockUsers.entries());
  }
}

// Create the mock service instance
export const mockAuthService = new MockAuthService();

// Make mock service accessible from browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).mockAuthService = mockAuthService;
  console.log('🌐 MockAuthService made available on window.mockAuthService for debugging');
}

// Also make it available globally for API routes
if (typeof global !== 'undefined') {
  (global as any).mockAuthService = mockAuthService;
  console.log('🌍 MockAuthService made available globally for API routes');
}

// Export a function to ensure the service is initialized
export const ensureMockServiceInitialized = () => {
  console.log('🔧 Ensuring MockAuthService is initialized...');
  mockAuthService.forceInitialize();
  return mockAuthService;
};
