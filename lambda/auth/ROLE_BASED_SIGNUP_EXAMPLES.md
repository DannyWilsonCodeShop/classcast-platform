# Role-Based User Creation Examples

This document provides comprehensive examples of how to use the role-based signup system for creating students and instructors with different attributes and preferences.

## 🎓 Student Signup Examples

### Basic Student Signup

```typescript
const studentSignupData = {
  username: 'john_doe',
  email: 'john.doe@university.edu',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student',
  department: 'Computer Science',
  studentId: 'STU123456',
  enrollmentYear: 2024,
  major: 'Computer Science',
  academicLevel: 'sophomore',
  bio: 'Passionate about software engineering and AI',
  phoneNumber: '+1234567890',
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: false,
      assignmentReminders: true,
      gradeNotifications: true,
      courseUpdates: true
    },
    theme: 'dark',
    language: 'en',
    academic: {
      showGPA: true,
      showProgress: true,
      enableTutoring: false
    }
  }
};

const response = await fetch('/auth/role-based-signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(studentSignupData)
});

const result = await response.json();
if (result.success) {
  console.log('Student created:', result.data);
} else {
  console.error('Student creation failed:', result.error);
}
```

### Graduate Student Signup

```typescript
const graduateStudentData = {
  username: 'sarah_smith',
  email: 'sarah.smith@university.edu',
  password: 'SecurePass123!',
  firstName: 'Sarah',
  lastName: 'Smith',
  role: 'student',
  department: 'Mathematics',
  studentId: 'STU789012',
  enrollmentYear: 2023,
  major: 'Applied Mathematics',
  academicLevel: 'graduate',
  gpa: 3.8,
  advisorId: 'INS456789',
  bio: 'Researching mathematical modeling in climate science',
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
      assignmentReminders: true,
      gradeNotifications: true,
      courseUpdates: true
    },
    theme: 'light',
    language: 'en',
    academic: {
      showGPA: true,
      showProgress: true,
      enableTutoring: true
    }
  }
};
```

### International Student Signup

```typescript
const internationalStudentData = {
  username: 'carlos_rodriguez',
  email: 'carlos.rodriguez@university.edu',
  password: 'SecurePass123!',
  firstName: 'Carlos',
  lastName: 'Rodriguez',
  role: 'student',
  department: 'International Business',
  studentId: 'STU345678',
  enrollmentYear: 2024,
  major: 'International Business',
  academicLevel: 'freshman',
  bio: 'International student from Spain, interested in global trade',
  phoneNumber: '+34612345678',
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: false,
      assignmentReminders: true,
      gradeNotifications: true,
      courseUpdates: true
    },
    theme: 'auto',
    language: 'es',
    academic: {
      showGPA: true,
      showProgress: true,
      enableTutoring: true
    }
  }
};
```

## 👨‍🏫 Instructor Signup Examples

### Professor Signup

```typescript
const professorSignupData = {
  username: 'dr_johnson',
  email: 'dr.johnson@university.edu',
  password: 'SecurePass123!',
  firstName: 'Dr. Michael',
  lastName: 'Johnson',
  role: 'instructor',
  department: 'Physics',
  instructorId: 'INS123456',
  title: 'professor',
  hireDate: '2010-08-15',
  qualifications: [
    'Ph.D. in Theoretical Physics',
    'M.S. in Applied Mathematics',
    'B.S. in Physics'
  ],
  researchAreas: [
    'Quantum Mechanics',
    'Particle Physics',
    'Mathematical Physics'
  ],
  officeLocation: 'Science Building, Room 301',
  officeHours: [
    {
      day: 'monday',
      startTime: '10:00',
      endTime: '12:00'
    },
    {
      day: 'wednesday',
      startTime: '14:00',
      endTime: '16:00'
    }
  ],
  maxStudents: 50,
  bio: 'Distinguished professor with 20+ years of research experience',
  phoneNumber: '+1234567890',
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: false,
      studentSubmissions: true,
      gradeReminders: true,
      courseEnrollments: true
    },
    theme: 'light',
    language: 'en',
    teaching: {
      autoGrade: false,
      plagiarismDetection: true,
      studentFeedback: true
    }
  }
};
```

### Adjunct Instructor Signup

```typescript
const adjunctInstructorData = {
  username: 'ms_williams',
  email: 'ms.williams@university.edu',
  password: 'SecurePass123!',
  firstName: 'Jennifer',
  lastName: 'Williams',
  role: 'instructor',
  department: 'Computer Science',
  instructorId: 'INS789012',
  title: 'adjunct',
  hireDate: '2023-01-15',
  qualifications: [
    'M.S. in Computer Science',
    'B.S. in Software Engineering',
    'Industry Experience: 8 years'
  ],
  researchAreas: [
    'Software Engineering',
    'Web Development',
    'Database Systems'
  ],
  officeLocation: 'Engineering Building, Room 205',
  officeHours: [
    {
      day: 'tuesday',
      startTime: '16:00',
      endTime: '18:00'
    },
    {
      day: 'thursday',
      startTime: '16:00',
      endTime: '18:00'
    }
  ],
  maxStudents: 30,
  bio: 'Industry professional teaching software engineering courses',
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
      studentSubmissions: true,
      gradeReminders: true,
      courseEnrollments: true
    },
    theme: 'dark',
    language: 'en',
    teaching: {
      autoGrade: true,
      plagiarismDetection: true,
      studentFeedback: true
    }
  }
};
```

### Lecturer Signup

```typescript
const lecturerData = {
  username: 'mr_davis',
  email: 'mr.davis@university.edu',
  password: 'SecurePass123!',
  firstName: 'Robert',
  lastName: 'Davis',
  role: 'instructor',
  department: 'English',
  instructorId: 'INS345678',
  title: 'lecturer',
  hireDate: '2022-09-01',
  qualifications: [
    'M.A. in English Literature',
    'B.A. in English',
    'Teaching Certificate'
  ],
  researchAreas: [
    'American Literature',
    'Creative Writing',
    'Rhetoric and Composition'
  ],
  officeLocation: 'Humanities Building, Room 102',
  officeHours: [
    {
      day: 'monday',
      startTime: '13:00',
      endTime: '15:00'
    },
    {
      day: 'friday',
      startTime: '10:00',
      endTime: '12:00'
    }
  ],
  maxStudents: 25,
  bio: 'Passionate about literature and helping students develop writing skills',
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: false,
      studentSubmissions: true,
      gradeReminders: true,
      courseEnrollments: true
    },
    theme: 'light',
    language: 'en',
    teaching: {
      autoGrade: false,
      plagiarismDetection: true,
      studentFeedback: true
    }
  }
};
```

## 🔄 Role Management Examples

### Changing Student to Instructor

```typescript
const roleChangeData = {
  targetUserId: 'user123',
  newRole: 'instructor',
  instructorId: 'INS999999',
  title: 'assistant_professor',
  qualifications: [
    'Ph.D. in Computer Science',
    'M.S. in Software Engineering',
    'Industry Experience: 5 years'
  ],
  reason: 'Student completed Ph.D. and is being promoted to faculty position',
  effectiveDate: '2024-09-01'
};

const response = await fetch('/auth/role-management', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify(roleChangeData)
});

const result = await response.json();
if (result.success) {
  console.log('Role changed successfully:', result.data);
} else {
  console.error('Role change failed:', result.error);
}
```

### Changing Instructor to Student

```typescript
const instructorToStudentData = {
  targetUserId: 'user456',
  newRole: 'student',
  studentId: 'STU999999',
  major: 'Data Science',
  academicLevel: 'graduate',
  reason: 'Instructor returning to pursue additional degree',
  effectiveDate: '2024-09-01'
};
```

## 📋 Validation Examples

### Student Validation Errors

```typescript
// Missing required student ID
const invalidStudentData = {
  username: 'test_user',
  email: 'test@university.edu',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'student', // ❌ Missing studentId
  department: 'Computer Science',
  enrollmentYear: 2024,
  major: 'Computer Science',
  academicLevel: 'freshman'
};

// Invalid enrollment year
const invalidEnrollmentData = {
  // ... other fields
  enrollmentYear: 2030, // ❌ Too far in the future
  // ... other fields
};

// Invalid GPA
const invalidGPAData = {
  // ... other fields
  gpa: 4.5, // ❌ GPA cannot exceed 4.0
  // ... other fields
};
```

### Instructor Validation Errors

```typescript
// Missing required instructor ID
const invalidInstructorData = {
  username: 'test_instructor',
  email: 'instructor@university.edu',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'Instructor',
  role: 'instructor', // ❌ Missing instructorId
  department: 'Physics',
  title: 'professor',
  hireDate: '2020-01-01',
  qualifications: ['Ph.D. in Physics']
};

// Invalid hire date
const invalidHireDateData = {
  // ... other fields
  hireDate: '2025-01-01', // ❌ Hire date in the future
  // ... other fields
};

// Invalid office hours
const invalidOfficeHoursData = {
  // ... other fields
  officeHours: [
    {
      day: 'monday',
      startTime: '14:00',
      endTime: '12:00' // ❌ End time before start time
    }
  ]
  // ... other fields
};
```

## 🚀 Frontend Integration

### React Component Example

```typescript
import React, { useState } from 'react';

const RoleBasedSignupForm: React.FC = () => {
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/auth/role-based-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        alert('Account created successfully! Please check your email.');
      } else {
        alert(`Creation failed: ${result.error}`);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Role:</label>
        <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'instructor')}>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
      </div>

      {/* Common fields */}
      <input type="text" placeholder="Username" required />
      <input type="email" placeholder="Email" required />
      <input type="password" placeholder="Password" required />
      <input type="text" placeholder="First Name" required />
      <input type="text" placeholder="Last Name" required />
      <input type="text" placeholder="Department" required />

      {/* Role-specific fields */}
      {role === 'student' && (
        <>
          <input type="text" placeholder="Student ID" required />
          <input type="number" placeholder="Enrollment Year" required />
          <input type="text" placeholder="Major" required />
          <select>
            <option value="freshman">Freshman</option>
            <option value="sophomore">Sophomore</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
            <option value="graduate">Graduate</option>
            <option value="phd">Ph.D.</option>
          </select>
        </>
      )}

      {role === 'instructor' && (
        <>
          <input type="text" placeholder="Instructor ID" required />
          <select>
            <option value="professor">Professor</option>
            <option value="associate_professor">Associate Professor</option>
            <option value="assistant_professor">Assistant Professor</option>
            <option value="lecturer">Lecturer</option>
            <option value="adjunct">Adjunct</option>
            <option value="emeritus">Emeritus</option>
          </select>
          <input type="date" placeholder="Hire Date" required />
          <textarea placeholder="Qualifications (one per line)" required />
        </>
      )}

      <button type="submit">Create Account</button>
    </form>
  );
};

export default RoleBasedSignupForm;
```

## 🔒 Security Considerations

### Admin Role Management

```typescript
// Only admins can manage roles
const updateUserRole = async (targetUserId: string, newRole: string) => {
  const adminToken = await getAdminToken(); // Get admin JWT token
  
  const response = await fetch('/auth/role-management', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      targetUserId,
      newRole,
      reason: 'Administrative role change',
      effectiveDate: new Date().toISOString().split('T')[0]
    })
  });

  return response.json();
};
```

### Audit Logging

```typescript
// All role changes are logged for audit purposes
const auditLog = {
  timestamp: new Date().toISOString(),
  adminUserId: 'admin123',
  adminEmail: 'admin@university.edu',
  targetUserId: 'user789',
  targetEmail: 'user@university.edu',
  previousRole: 'student',
  newRole: 'instructor',
  reason: 'Promotion to faculty position',
  effectiveDate: '2024-09-01',
  action: 'role_change'
};
```

## 📊 Response Examples

### Successful Student Creation

```json
{
  "success": true,
  "data": {
    "message": "Student created successfully",
    "userId": "user123",
    "email": "john.doe@university.edu",
    "role": "student",
    "requiresConfirmation": true,
    "profileCreated": true,
    "groupAssigned": true
  },
  "message": "Your student account has been created. Please check your email to confirm your account.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Successful Instructor Creation

```json
{
  "success": true,
  "data": {
    "message": "Instructor created successfully",
    "userId": "user456",
    "email": "dr.johnson@university.edu",
    "role": "instructor",
    "requiresConfirmation": true,
    "profileCreated": true,
    "groupAssigned": true
  },
  "message": "Your instructor account has been created. Please check your email to confirm your account.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "errors": [
      {
        "field": "studentId",
        "message": "Student ID is required when assigning student role"
      },
      {
        "field": "enrollmentYear",
        "message": "Enrollment year cannot be more than one year in the future"
      }
    ],
    "message": "Please check your input and try again"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

This comprehensive role-based signup system provides a robust foundation for managing different user types with appropriate validation, business rules, and security measures.
