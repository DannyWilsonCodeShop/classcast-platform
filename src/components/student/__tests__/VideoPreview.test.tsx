import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPreview } from '../VideoPreview';
import { VideoFile } from '../VideoSubmission';

describe('VideoPreview', () => {
  const mockVideoFile: VideoFile = {
    file: new File(['test'], 'test-video.mp4', { type: 'video/mp4' }),
    id: 'test-video-123',
    status: 'pending',
    progress: 0,
    previewUrl: 'blob:mock-preview-url',
    duration: 120,
    metadata: {
      width: 1920,
      height: 1080,
      format: 'video/mp4',
    },
  };

  const defaultProps = {
    videoFile: mockVideoFile,
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the video preview with file information', () => {
      render(<VideoPreview {...defaultProps} />);
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('File Size:')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Duration:')).toBeInTheDocument();
      expect(screen.getByText('Resolution:')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <VideoPreview {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('User Interactions', () => {
    it('calls onRemove when remove button is clicked', async () => {
      render(<VideoPreview {...defaultProps} />);
      
      const removeButton = screen.getByRole('button', { name: /remove video/i });
      await userEvent.click(removeButton);
      
      expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
    });

    it('toggles play/pause state when play button is clicked', async () => {
      render(<VideoPreview {...defaultProps} />);
      
      const playButton = screen.getByRole('button', { name: /play/i });
      await userEvent.click(playButton);
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('Video Controls', () => {
    it('renders video player with controls', () => {
      render(<VideoPreview {...defaultProps} />);
      
      // Video element doesn't have role="video", use querySelector instead
      const videoElement = document.querySelector('video');
      expect(videoElement).toBeInTheDocument();
      expect(videoElement).toHaveAttribute('src', 'blob:mock-preview-url');
    });

    it('shows progress bar and volume control', () => {
      render(<VideoPreview {...defaultProps} />);
      
      // There are multiple sliders (progress bar and volume), use getAllByRole
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
      
      // First slider is progress bar (full width)
      const progressBar = sliders[0];
      expect(progressBar).toHaveAttribute('type', 'range');
      expect(progressBar).toHaveAttribute('min', '0');
      
      // Second slider is volume control (narrow width)
      const volumeSlider = sliders[1];
      expect(volumeSlider).toHaveAttribute('type', 'range');
      expect(volumeSlider).toHaveAttribute('min', '0');
      expect(volumeSlider).toHaveAttribute('max', '1');
      expect(volumeSlider).toHaveAttribute('step', '0.1');
    });
  });

  describe('File Information', () => {
    it('displays video metadata correctly', () => {
      render(<VideoPreview {...defaultProps} />);
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('video/mp4')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });

    it('handles missing metadata gracefully', () => {
      const videoFileWithoutMetadata: VideoFile = {
        ...mockVideoFile,
        duration: undefined,
        metadata: undefined,
      };
      
      render(<VideoPreview {...defaultProps} videoFile={videoFileWithoutMetadata} />);
      
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.queryByText('Duration:')).not.toBeInTheDocument();
      expect(screen.queryByText('Resolution:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for controls', () => {
      render(<VideoPreview {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove video/i })).toBeInTheDocument();
    });
  });
});
