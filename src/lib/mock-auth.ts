// Mock Authentication Service
// This provides a fallback authentication system when AWS Cognito is not available

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
  password: string; // In a real system, this would be hashed
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
}

// In-memory storage for demo purposes
// In production, this would be a database
const users: MockUser[] = [
  // Default test users
  {
    id: 'test-student-1',
    email: 'student@example.com',
    firstName: 'John',
    lastName: 'Student',
    role: 'student',
    studentId: 'STU001',
    emailVerified: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'test-instructor-1',
    email: 'instructor@example.com',
    firstName: 'Jane',
    lastName: 'Instructor',
    role: 'instructor',
    instructorId: 'INST001',
    department: 'Computer Science',
    emailVerified: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'test-admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    emailVerified: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const mockAuthService = {
  // Create a new user
  async createUser(userData: CreateUserData): Promise<MockUser> {
    // Check if user already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const newUser: MockUser = {
      id: userData.email, // Use email as ID for simplicity
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      studentId: userData.studentId,
      instructorId: userData.instructorId,
      department: userData.department,
      emailVerified: true, // Mock users are pre-verified
      password: userData.password, // In production, this would be hashed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    console.log('Mock user created:', { id: newUser.id, email: newUser.email, role: newUser.role });
    
    return newUser;
  },

  // Authenticate a user
  async authenticate(email: string, password: string): Promise<MockUser> {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    console.log('Mock user authenticated:', { id: user.id, email: user.email, role: user.role });
    return user;
  },

  // Get user by ID
  async getUserById(id: string): Promise<MockUser | null> {
    const user = users.find(u => u.id === id);
    return user || null;
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<MockUser | null> {
    const user = users.find(u => u.email === email);
    return user || null;
  },

  // Update user
  async updateUser(id: string, updateData: Partial<MockUser>): Promise<MockUser> {
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return users[userIndex];
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    return true;
  },

  // List all users
  async listUsers(): Promise<MockUser[]> {
    return [...users];
  },

  // Get users by role
  async getUsersByRole(role: 'student' | 'instructor' | 'admin'): Promise<MockUser[]> {
    return users.filter(u => u.role === role);
  },

  // Verify email (mock implementation)
  async verifyEmail(email: string): Promise<boolean> {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return false;
    }

    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
    
    return true;
  },

  // Reset password (mock implementation)
  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return false;
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();
    
    return true;
  },

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    students: number;
    instructors: number;
    admins: number;
    verifiedUsers: number;
  }> {
    const totalUsers = users.length;
    const students = users.filter(u => u.role === 'student').length;
    const instructors = users.filter(u => u.role === 'instructor').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const verifiedUsers = users.filter(u => u.emailVerified).length;

    return {
      totalUsers,
      students,
      instructors,
      admins,
      verifiedUsers,
    };
  }
};
