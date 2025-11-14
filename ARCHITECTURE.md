# ClassCast Platform - Clean Architecture

## 🏗️ **Architecture Overview**

```
Frontend (Next.js 14)
├── app/                    # App Router pages
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── services/               # API and business logic
├── types/                  # TypeScript definitions
├── utils/                  # Helper functions
└── config/                 # Environment configuration

Backend (AWS Lambda + DynamoDB)
├── lambda/                 # Lambda functions
├── api/                    # API Gateway routes
├── database/               # DynamoDB schemas
└── services/               # Business logic services
```

## 📁 **Frontend Structure**

### **1. Components (UI Only)**
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, size, onClick, children }) => {
  // Pure UI component - no business logic
};
```

### **2. Hooks (State Management)**
```typescript
// hooks/useProfile.ts
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await ProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, fetchProfile };
};
```

### **3. Services (API Layer)**
```typescript
// services/ProfileService.ts
class ProfileService {
  static async getProfile(): Promise<Profile> {
    const response = await fetch('/api/profile');
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  static async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }
}
```

### **4. Types (TypeScript Definitions)**
```typescript
// types/index.ts
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string; // Always S3 URL, never base64
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructorId: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

### **5. Configuration (Environment Management)**
```typescript
// config/index.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  api: {
    baseUrl: isProduction ? process.env.API_URL : 'http://localhost:3000/api',
    timeout: 10000
  },
  features: {
    enableMockData: isDevelopment && process.env.ENABLE_MOCK_DATA === 'true',
    enableDebugLogs: isDevelopment,
    enableAnalytics: isProduction
  },
  storage: {
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION
  }
};
```

## 🔄 **Data Flow Pattern**

```
User Action → Hook → Service → API → Database
     ↓
UI Update ← State ← Response ← Lambda ← DynamoDB
```

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
// __tests__/services/ProfileService.test.ts
describe('ProfileService', () => {
  it('should fetch profile successfully', async () => {
    const mockProfile = { id: '1', name: 'John Doe' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfile)
    });

    const result = await ProfileService.getProfile();
    expect(result).toEqual(mockProfile);
  });
});
```

### **Integration Tests**
```typescript
// __tests__/hooks/useProfile.test.tsx
describe('useProfile', () => {
  it('should fetch and update profile state', async () => {
    renderHook(() => useProfile());
    // Test hook behavior
  });
});
```

## 🚀 **Development Workflow**

### **1. Feature Development**
1. Define types in `types/`
2. Create service in `services/`
3. Create hook in `hooks/`
4. Create component in `components/`
5. Add to page in `app/`
6. Write tests

### **2. Environment Management**
- Development: Mock data enabled, debug logs on
- Staging: Real data, limited debug logs
- Production: Real data, no debug logs, analytics on

## 📋 **Best Practices**

### **1. Data Management**
- ✅ Always use services for API calls
- ✅ Use hooks for state management
- ✅ Never mix mock and real data
- ✅ Always validate data with TypeScript

### **2. Component Design**
- ✅ Keep components pure (no business logic)
- ✅ Use composition over inheritance
- ✅ Make components reusable and testable

### **3. Error Handling**
- ✅ Use error boundaries for component errors
- ✅ Handle API errors in services
- ✅ Provide user-friendly error messages

### **4. Performance**
- ✅ Use React.memo for expensive components
- ✅ Implement proper loading states
- ✅ Use pagination for large datasets

## 🔧 **Migration Strategy**

### **Phase 1: Core Infrastructure**
1. Set up clean folder structure
2. Create base types and services
3. Set up testing framework
4. Configure environment management

### **Phase 2: Authentication**
1. Clean auth context
2. Proper user management
3. Role-based access control

### **Phase 3: Core Features**
1. Profile management
2. Course management
3. Assignment system
4. Grading system

### **Phase 4: Advanced Features**
1. Analytics
2. Notifications
3. File uploads
4. Real-time features

## 🎯 **Success Metrics**

- ✅ Zero mock data in production
- ✅ Clear separation of concerns
- ✅ 90%+ test coverage
- ✅ Type-safe throughout
- ✅ Easy to debug and maintain
- ✅ Scalable architecture
