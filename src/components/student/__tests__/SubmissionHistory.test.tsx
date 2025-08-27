import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionHistory } from '../SubmissionHistory';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the supporting components
jest.mock('../SubmissionCard', () => ({
  SubmissionCard: ({ submission }: any) => (
    <div data-testid={`submission-card-${submission.submissionId}`}>
      {submission.assignmentTitle}
    </div>
  ),
}));

jest.mock('../SubmissionFilters', () => ({
  SubmissionFilters: ({ onFilterChange }: any) => (
    <div data-testid="submission-filters">
      <button onClick={() => onFilterChange({ status: 'graded' })}>
        Set Status to Graded
      </button>
    </div>
  ),
}));

jest.mock('../SubmissionSort', () => ({
  SubmissionSort: ({ onSortChange }: any) => (
    <div data-testid="submission-sort">
      <button onClick={() => onSortChange({ field: 'grade' })}>
        Sort by Grade
      </button>
    </div>
  ),
}));

jest.mock('../../common/Pagination', () => ({
  Pagination: ({ onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(2)}>Page 2</button>
    </div>
  ),
}));

jest.mock('../../common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => (
    <div data-testid={`loading-spinner-${size}`}>Loading...</div>
  ),
}));

jest.mock('../../common/EmptyState', () => ({
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('SubmissionHistory', () => {
  const mockUser = {
    sub: 'user123',
    email: 'student@example.com',
    role: 'student',
    accessToken: 'mock-token',
  };

  const mockSubmissions = [
    {
      submissionId: 'sub1',
      assignmentId: 'assign1',
      assignmentTitle: 'Assignment 1',
      courseId: 'course1',
      courseName: 'Introduction to CS',
      studentId: 'user123',
      studentName: 'John Doe',
      status: 'graded',
      submittedAt: '2024-01-15T10:00:00Z',
      grade: 85,
      maxScore: 100,
      feedback: 'Great work!',
      files: [],
      metadata: {},
    },
    {
      submissionId: 'sub2',
      assignmentId: 'assign2',
      assignmentTitle: 'Assignment 2',
      courseId: 'course1',
      courseName: 'Introduction to CS',
      studentId: 'user123',
      studentName: 'John Doe',
      status: 'submitted',
      submittedAt: '2024-01-20T10:00:00Z',
      files: [],
      metadata: {},
    },
  ];

  const mockResponse = {
    submissions: mockSubmissions,
    pagination: {
      currentPage: 1,
      totalPages: 2,
      totalItems: 20,
      itemsPerPage: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it('renders with default title and shows loading initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves, keeps loading
    );

    render(<SubmissionHistory />);
    
    expect(screen.getByText('My Submissions')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner-lg')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('fetches and displays submissions successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory />);

    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Assignment 2')).toBeInTheDocument();
    });

    expect(screen.getByText('20 submissions found')).toBeInTheDocument();
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SubmissionHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Submissions')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles API error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    render(<SubmissionHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Submissions')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch submissions: Internal Server Error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no submissions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ submissions: [], pagination: { totalItems: 0 } }),
    });

    render(<SubmissionHistory />);

    await waitFor(() => {
      expect(screen.getByText('No Submissions Found')).toBeInTheDocument();
    });
  });

  it('applies filters and refetches data', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockResponse, submissions: [mockSubmissions[0]] }),
      });

    render(<SubmissionHistory />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Apply filter
    fireEvent.click(screen.getByText('Set Status to Graded'));

    // Should refetch with new filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('applies sorting and refetches data', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    render(<SubmissionHistory />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Apply sort
    fireEvent.click(screen.getByText('Sort by Grade'));

    // Should refetch with new sort
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles pagination changes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    render(<SubmissionHistory />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Change page
    fireEvent.click(screen.getByText('Page 2'));

    // Should refetch with new page
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Click clear filters
    fireEvent.click(screen.getByText('Clear Filters'));

    // Should refetch with cleared filters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('includes video URL parameters in fetch request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('includeVideoUrls=true'),
        expect.any(Object)
      );
    });
  });

  it('resets to page 1 when filters change', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

    render(<SubmissionHistory />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
    });

    // Apply filter
    fireEvent.click(screen.getByText('Set Status to Graded'));

    // Should refetch with page 1
    await waitFor(() => {
      const lastCall = (global.fetch as jest.Mock).mock.calls[1][0];
      expect(lastCall).toContain('page=1');
    });
  });

  it('handles missing user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    render(<SubmissionHistory />);
    
    // Should not make fetch call when no user
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('applies custom maxItems when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory maxItems={5} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5'),
        expect.any(Object)
      );
    });
  });

  it('conditionally shows filters and sort based on props', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { rerender } = render(<SubmissionHistory showFilters={false} showSort={false} />);

    expect(screen.queryByTestId('submission-filters')).not.toBeInTheDocument();
    expect(screen.queryByTestId('submission-sort')).not.toBeInTheDocument();

    rerender(<SubmissionHistory showFilters={true} showSort={true} />);

    expect(screen.getByTestId('submission-filters')).toBeInTheDocument();
    expect(screen.getByTestId('submission-sort')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<SubmissionHistory className="custom-class" />);

    const container = screen.getByText('My Submissions').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});





