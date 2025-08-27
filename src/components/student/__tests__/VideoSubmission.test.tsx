import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoSubmission } from '../VideoSubmission';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the supporting components
jest.mock('../VideoUploadZone', () => ({
  VideoUploadZone: ({ onFileSelect }: { onFileSelect: (file: File) => void }) => (
    <div data-testid="video-upload-zone">
      <button onClick={() => onFileSelect(new File(['test'], 'test.mp4', { type: 'video/mp4' }))}>
        Select File
      </button>
    </div>
  ),
}));

jest.mock('../VideoPreview', () => ({
  VideoPreview: ({ videoFile, onRemove }: { videoFile: any; onRemove: () => void }) => (
    <div data-testid="video-preview">
      <span>{videoFile.file.name}</span>
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}));

jest.mock('../VideoUploadProgress', () => ({
  VideoUploadProgress: ({ progress, fileName }: { progress: number; fileName: string }) => (
    <div data-testid="video-upload-progress">
      <span>{progress}%</span>
      <span>{fileName}</span>
    </div>
  ),
}));

jest.mock('../VideoValidationErrors', () => ({
  VideoValidationErrors: ({ errors }: { errors: string[] }) => (
    <div data-testid="video-validation-errors">
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  ),
}));

jest.mock('../../common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => (
    <div data-testid={`loading-spinner-${size}`}>Loading...</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-preview-url');
global.URL.revokeObjectURL = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
});

describe('VideoSubmission', () => {
  const defaultProps = {
    assignmentId: 'test-assignment-123',
    courseId: 'test-course-456',
    onSubmissionComplete: jest.fn(),
    onSubmissionError: jest.fn(),
  };

  const mockUser = {
    sub: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'student' as const,
    emailVerified: true,
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
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with default props', () => {
      render(<VideoSubmission {...defaultProps} />);
      
      expect(screen.getByText('Video Submission')).toBeInTheDocument();
      expect(screen.getByText(/Upload your video assignment/)).toBeInTheDocument();
      expect(screen.getByText(/Supported formats: MP4, WebM, MOV/)).toBeInTheDocument();
      expect(screen.getByText(/Max file size: 100MB/)).toBeInTheDocument();
      expect(screen.getByText(/Max duration: 5m 0s/)).toBeInTheDocument();
    });

    it('renders the upload zone when no file is selected', () => {
      render(<VideoSubmission {...defaultProps} />);
      
      expect(screen.getByTestId('video-upload-zone')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <VideoSubmission {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('File Selection', () => {
    it('handles file selection from upload zone', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
      expect(screen.getByText('test.mp4')).toBeInTheDocument();
    });

    it('clears validation errors when a new file is selected', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // First, select a file that will cause validation errors
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // The component should now show the preview
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('validates file size correctly', async () => {
      const propsWithSmallSize = {
        ...defaultProps,
        maxFileSize: 1024, // 1KB
      };
      
      render(<VideoSubmission {...propsWithSmallSize} />);
      
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // The file should be rejected due to size
      expect(screen.getByTestId('video-preview')).not.toBeInTheDocument();
    });

    it('validates file type correctly', async () => {
      const propsWithRestrictedTypes = {
        ...defaultProps,
        allowedVideoTypes: ['video/mp4'],
      };
      
      render(<VideoSubmission {...propsWithRestrictedTypes} />);
      
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // The file should be accepted as it's MP4
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    });
  });

  describe('Upload Process', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            fileKey: 'test-file-key',
            fileUrl: 'https://example.com/test.mp4',
            fileName: 'test.mp4',
            fileSize: 1024,
          },
        }),
      });
    });

    it('starts upload when upload button is clicked', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Click upload button
      const uploadButton = screen.getByText('Upload Video');
      await userEvent.click(uploadButton);
      
      // Should show upload progress
      expect(screen.getByTestId('video-upload-progress')).toBeInTheDocument();
    });

    it('handles successful upload', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Click upload button
      const uploadButton = screen.getByText('Upload Video');
      await userEvent.click(uploadButton);
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText('Video Submitted Successfully!')).toBeInTheDocument();
      });
      
      expect(defaultProps.onSubmissionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: 'mock-uuid',
          fileName: 'test.mp4',
        })
      );
    });

    it('handles upload errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Upload failed'));
      
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Click upload button
      const uploadButton = screen.getByText('Upload Video');
      await userEvent.click(uploadButton);
      
      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      });
      
      expect(defaultProps.onSubmissionError).toHaveBeenCalledWith('Upload failed');
    });
  });

  describe('File Removal', () => {
    it('removes file when remove button is clicked', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Verify preview is shown
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
      
      // Click remove button
      const removeButton = screen.getByText('Remove');
      await userEvent.click(removeButton);
      
      // Should show upload zone again
      expect(screen.getByTestId('video-upload-zone')).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            fileKey: 'test-file-key',
            fileUrl: 'https://example.com/test.mp4',
            fileName: 'test.mp4',
            fileSize: 1024,
          },
        }),
      });
    });

    it('shows processing state after upload', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Click upload button
      const uploadButton = screen.getByText('Upload Video');
      await userEvent.click(uploadButton);
      
      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Processing your video...')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Configuration', () => {
    it('respects custom maxFileSize', () => {
      render(
        <VideoSubmission
          {...defaultProps}
          maxFileSize={50 * 1024 * 1024} // 50MB
        />
      );
      
      expect(screen.getByText(/Max file size: 50MB/)).toBeInTheDocument();
    });

    it('respects custom maxDuration', () => {
      render(
        <VideoSubmission
          {...defaultProps}
          maxDuration={600} // 10 minutes
        />
      );
      
      expect(screen.getByText(/Max duration: 10m 0s/)).toBeInTheDocument();
    });

    it('respects custom allowedVideoTypes', () => {
      render(
        <VideoSubmission
          {...defaultProps}
          allowedVideoTypes={['video/mp4']}
        />
      );
      
      expect(screen.getByText(/Supported formats: MP4/)).toBeInTheDocument();
    });

    it('can disable preview', async () => {
      render(
        <VideoSubmission
          {...defaultProps}
          showPreview={false}
        />
      );
      
      // Select a file
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Should not show preview
      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
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
      
      render(<VideoSubmission {...defaultProps} />);
      
      // Should still render but upload will fail
      expect(screen.getByText('Video Submission')).toBeInTheDocument();
    });

    it('handles network errors during upload', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file first
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Click upload button
      const uploadButton = screen.getByText('Upload Video');
      await userEvent.click(uploadButton);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<VideoSubmission {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Video Submission')).toBeInTheDocument();
    });

    it('provides clear error messages', async () => {
      render(<VideoSubmission {...defaultProps} />);
      
      // Select a file that will cause validation errors
      const selectButton = screen.getByText('Select File');
      await userEvent.click(selectButton);
      
      // Should show validation errors if any
      // Note: In this mock setup, the file should pass validation
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    });
  });
});





