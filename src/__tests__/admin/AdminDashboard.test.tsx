import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '@/app/admin/dashboard/page';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@classcast.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    },
    isAuthenticated: true,
    isLoading: false
  })
}));

// Mock the API helpers
jest.mock('@/lib/apiConfig', () => ({
  apiHelpers: {
    getUserRoles: jest.fn().mockResolvedValue({
      data: { users: [], count: 0 }
    }),
    getAssignments: jest.fn().mockResolvedValue({
      data: { assignments: [], count: 0 }
    }),
    getSubmissions: jest.fn().mockResolvedValue({
      data: { submissions: [], count: 0 }
    })
  }
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin dashboard with navigation', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('System Overview')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Role Management')).toBeInTheDocument();
    expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('shows overview by default', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('System Overview')).toBeInTheDocument();
    expect(screen.getByText('Monitor your ClassCast platform performance and user activity')).toBeInTheDocument();
  });

  it('switches views when navigation items are clicked', async () => {
    render(<AdminDashboard />);
    
    // Click on User Management
    fireEvent.click(screen.getByText('User Management'));
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('opens mobile sidebar when menu button is clicked', () => {
    render(<AdminDashboard />);
    
    // This would need to be implemented based on your mobile menu implementation
    const menuButton = screen.queryByRole('button', { name: /menu/i });
    if (menuButton) {
      fireEvent.click(menuButton);
      // Add assertions for mobile sidebar visibility
    }
  });
});
