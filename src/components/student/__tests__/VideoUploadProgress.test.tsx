import React from 'react';
import { render, screen } from '@testing-library/react';
import { VideoUploadProgress } from '../VideoUploadProgress';

describe('VideoUploadProgress', () => {
  const defaultProps = {
    progress: 50,
    fileName: 'test-video.mp4',
  };

  describe('Rendering', () => {
    it('renders the progress component with file information', () => {
      render(<VideoUploadProgress {...defaultProps} />);
      
      expect(screen.getByText('Uploading Video')).toBeInTheDocument();
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <VideoUploadProgress {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('displays progress percentage correctly', () => {
      render(<VideoUploadProgress {...defaultProps} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Progress States', () => {
    it('shows correct progress text for different progress levels', () => {
      const { rerender } = render(<VideoUploadProgress {...defaultProps} progress={10} />);
      expect(screen.getByText('Starting upload...')).toBeInTheDocument();
      
      rerender(<VideoUploadProgress {...defaultProps} progress={30} />);
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      
      rerender(<VideoUploadProgress {...defaultProps} progress={70} />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      rerender(<VideoUploadProgress {...defaultProps} progress={100} />);
      expect(screen.getByText('Upload complete!')).toBeInTheDocument();
    });

    it('shows progress bar with correct width', () => {
      render(<VideoUploadProgress {...defaultProps} progress={75} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });
  });

  describe('Status Indicators', () => {
    it('shows correct status indicators based on progress', () => {
      render(<VideoUploadProgress {...defaultProps} progress={60} />);
      
      // Should show started and uploading as completed
      expect(screen.getByText('Started')).toBeInTheDocument();
      expect(screen.getByText('Uploading')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('File Information Display', () => {
    it('displays file name correctly', () => {
      render(<VideoUploadProgress {...defaultProps} fileName="sample-video.webm" />);
      
      expect(screen.getByText('sample-video.webm')).toBeInTheDocument();
    });

    it('shows file type information', () => {
      render(<VideoUploadProgress {...defaultProps} />);
      
      expect(screen.getByText('Video file')).toBeInTheDocument();
    });
  });

  describe('Progress Colors', () => {
    it('applies correct progress colors', () => {
      const { rerender } = render(<VideoUploadProgress {...defaultProps} progress={20} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
      
      rerender(<VideoUploadProgress {...defaultProps} progress={50} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500');
      
      rerender(<VideoUploadProgress {...defaultProps} progress={80} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-500');
      
      rerender(<VideoUploadProgress {...defaultProps} progress={100} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500');
    });
  });

  describe('Information Messages', () => {
    it('shows upload in progress message when not complete', () => {
      render(<VideoUploadProgress {...defaultProps} progress={45} />);
      
      expect(screen.getByText('Upload in Progress')).toBeInTheDocument();
      expect(screen.getByText(/Please don't close this page/)).toBeInTheDocument();
    });

    it('shows success message when complete', () => {
      render(<VideoUploadProgress {...defaultProps} progress={100} />);
      
      expect(screen.getByText('Upload Complete!')).toBeInTheDocument();
      expect(screen.getByText(/Your video has been successfully uploaded/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero progress', () => {
      render(<VideoUploadProgress {...defaultProps} progress={0} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Starting upload...')).toBeInTheDocument();
    });

    it('handles very small progress values', () => {
      render(<VideoUploadProgress {...defaultProps} progress={1} />);
      
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('Starting upload...')).toBeInTheDocument();
    });

    it('handles progress values over 100', () => {
      render(<VideoUploadProgress {...defaultProps} progress={150} />);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
      expect(screen.getByText('Upload complete!')).toBeInTheDocument();
    });
  });
});





