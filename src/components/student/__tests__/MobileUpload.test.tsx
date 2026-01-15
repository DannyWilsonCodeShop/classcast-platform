import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { SimpleMobileUpload } from '../SimpleMobileUpload';
import { MobileAssignmentUpload } from '../MobileAssignmentUpload';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      email: 'test@example.com'
    }
  })
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SimpleMobileUpload', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload button correctly', () => {
    render(<SimpleMobileUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText('📱 Upload Video File')).toBeInTheDocument();
    expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    expect(screen.getByText('Max size: 2.0 GB')).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    render(<SimpleMobileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(testFile);
    });
  });

  test('validates file size', async () => {
    const maxSize = 1024 * 1024; // 1MB
    render(<SimpleMobileUpload onFileSelect={mockOnFileSelect} maxFileSize={maxSize} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File size.*exceeds limit/)).toBeInTheDocument();
    });
    
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  test('validates file type', async () => {
    render(<SimpleMobileUpload onFileSelect={mockOnFileSelect} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test content'], 'test.txt', {
      type: 'text/plain'
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Please select a video file/)).toBeInTheDocument();
    });
    
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });
});

describe('MobileAssignmentUpload', () => {
  const defaultProps = {
    assignmentId: 'test-assignment-123',
    courseId: 'test-course-456',
    assignmentTitle: 'Test Assignment'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          fileUrl: 'https://example.com/video.mp4',
          fileName: 'test-video.mp4',
          fileSize: 1024000
        }
      })
    });
  });

  test('renders assignment upload interface', () => {
    render(<MobileAssignmentUpload {...defaultProps} />);
    
    expect(screen.getByText('Submit Assignment')).toBeInTheDocument();
    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    expect(screen.getByText('📱 Mobile Upload Tips')).toBeInTheDocument();
  });

  test('shows upload progress during file upload', async () => {
    render(<MobileAssignmentUpload {...defaultProps} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText('Uploading Video')).toBeInTheDocument();
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });
  });

  test('calls onUploadComplete when upload succeeds', async () => {
    const mockOnComplete = jest.fn();
    
    // Mock successful submission creation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            fileUrl: 'https://example.com/video.mp4',
            fileName: 'test-video.mp4',
            fileSize: 1024000
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          submission: {
            submissionId: 'submission-123'
          }
        })
      });

    render(
      <MobileAssignmentUpload 
        {...defaultProps} 
        onUploadComplete={mockOnComplete}
      />
    );
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('submission-123');
    }, { timeout: 3000 });
  });

  test('handles upload errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<MobileAssignmentUpload {...defaultProps} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  test('allows retry after failed upload', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<MobileAssignmentUpload {...defaultProps} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    });
  });
});