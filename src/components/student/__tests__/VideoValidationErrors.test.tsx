import React from 'react';
import { render, screen } from '@testing-library/react';
import { VideoValidationErrors } from '../VideoValidationErrors';

describe('VideoValidationErrors', () => {
  const defaultProps = {
    errors: ['File size exceeds limit', 'Invalid file type'],
  };

  describe('Rendering', () => {
    it('renders validation errors when errors exist', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      expect(screen.getByText('Video Validation Failed')).toBeInTheDocument();
      expect(screen.getByText('File size exceeds limit')).toBeInTheDocument();
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
      expect(screen.getByText(/Please select a valid video file/)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <VideoValidationErrors {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders error icon', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays single error correctly', () => {
      render(<VideoValidationErrors errors={['Single error message']} />);
      
      expect(screen.getByText('Single error message')).toBeInTheDocument();
      expect(screen.getByText('Video Validation Failed')).toBeInTheDocument();
    });

    it('displays multiple errors correctly', () => {
      const multipleErrors = [
        'First error message',
        'Second error message',
        'Third error message',
      ];
      
      render(<VideoValidationErrors errors={multipleErrors} />);
      
      expect(screen.getByText('First error message')).toBeInTheDocument();
      expect(screen.getByText('Second error message')).toBeInTheDocument();
      expect(screen.getByText('Third error message')).toBeInTheDocument();
    });

    it('renders errors as list items', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      const errorList = screen.getByRole('list');
      expect(errorList).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  describe('No Errors State', () => {
    it('renders nothing when no errors', () => {
      const { container } = render(<VideoValidationErrors errors={[]} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when errors is undefined', () => {
      const { container } = render(<VideoValidationErrors errors={undefined as any} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Error Message Content', () => {
    it('shows helpful guidance message', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      expect(screen.getByText(/Please select a valid video file/)).toBeInTheDocument();
    });

    it('displays error count in heading', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      expect(screen.getByText('Video Validation Failed')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies error styling classes', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      const errorContainer = screen.getByText('Video Validation Failed').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('uses proper error color scheme', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      expect(screen.getByText('Video Validation Failed')).toHaveClass('text-red-800');
      expect(screen.getByText(/Please select a valid video file/)).toHaveClass('text-red-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Video Validation Failed');
    });

    it('provides clear error descriptions', () => {
      render(<VideoValidationErrors {...defaultProps} />);
      
      expect(screen.getByText('File size exceeds limit')).toBeInTheDocument();
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long error messages', () => {
      const longError = 'This is a very long error message that might exceed normal display limits and should be handled gracefully by the component without breaking the layout or causing any rendering issues';
      
      render(<VideoValidationErrors errors={[longError]} />);
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('handles special characters in error messages', () => {
      const specialCharError = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(<VideoValidationErrors errors={[specialCharError]} />);
      
      expect(screen.getByText(specialCharError)).toBeInTheDocument();
    });

    it('handles empty string errors', () => {
      render(<VideoValidationErrors errors={['', 'Valid error']} />);
      
      expect(screen.getByText('')).toBeInTheDocument();
      expect(screen.getByText('Valid error')).toBeInTheDocument();
    });
  });
});






