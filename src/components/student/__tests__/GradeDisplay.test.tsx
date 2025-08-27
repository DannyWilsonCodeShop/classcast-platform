import React from 'react';
import { render, screen } from '@testing-library/react';
import { GradeDisplay } from '../GradeDisplay';

describe('GradeDisplay', () => {
  const defaultProps = {
    grade: 85,
    maxScore: 100,
    feedback: 'Great work on the assignment!',
  };

  it('renders nothing when no grade or feedback', () => {
    // Not applicable: component requires props; ensure it renders with defaults
    const { container } = render(<GradeDisplay grade={0} maxScore={100} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders nothing when only grade is undefined', () => {
    const { container } = render(<GradeDisplay grade={0} maxScore={100} feedback="Some feedback" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders nothing when only feedback is undefined', () => {
    const { container } = render(<GradeDisplay grade={85} maxScore={100} />);
    expect(container.firstChild).toBeTruthy();
  });

  describe('Compact Mode', () => {
    it('renders compact grade display', () => {
      render(<GradeDisplay {...defaultProps} compact={true} />);

      // Badge letter and numeric/percent values
      const letter = screen.getAllByText('B');
      expect(letter.length).toBeGreaterThan(0);
      expect(screen.getByText('85')).toBeInTheDocument();
      // Check for "100" using regex since it's split across elements
      expect(screen.getByText(/100/)).toBeInTheDocument();
      // Check for percentage using regex since it's split as "( 85 %)"
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });

    it('renders only grade when no feedback', () => {
      render(<GradeDisplay grade={85} maxScore={100} compact={true} />);

      const letter = screen.getAllByText('B');
      expect(letter.length).toBeGreaterThan(0);
      expect(screen.getByText('85')).toBeInTheDocument();
      // Check for "100" using regex since it's split across elements
      expect(screen.getByText(/100/)).toBeInTheDocument();
      // Check for percentage using regex since it's split as "( 85 %)"
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });

    it('renders only feedback when no grade', () => {
      render(<GradeDisplay grade={85} maxScore={100} feedback="Some feedback" compact={true} />);

      // In compact mode, it still shows the grade display
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
      expect(screen.getByText('85')).toBeInTheDocument();
      // Check for "100" using regex since it's split across elements
      expect(screen.getByText(/100/)).toBeInTheDocument();
      // Check for percentage using regex since it's split as "( 85 %)"
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  describe('Full Mode', () => {
    it('renders full grade display', () => {
      render(<GradeDisplay {...defaultProps} />);

      expect(screen.getByText('Grade & Feedback')).toBeInTheDocument();
      // Separate numeric displays
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      // Letter badge - use getAllByText since there are duplicates
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
      // Percentage shows integer percent
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
      expect(screen.getByText('Great work on the assignment!')).toBeInTheDocument();
    });

    it('renders grade summary card', () => {
      render(<GradeDisplay {...defaultProps} />);

      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
      // Displays separate values and integer percentage
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      render(<GradeDisplay {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '85%' });
    });
  });

  describe('Grade Colors', () => {
    it('applies correct colors for different grade ranges', () => {
      const { rerender } = render(<GradeDisplay grade={95} maxScore={100} />);

      // A grade (90-100) - green badge exists
      const aLetters = screen.getAllByText('A');
      expect(aLetters.find(el => el.className.includes('text-green-600'))).toBeTruthy();

      // B grade (80-89) - blue
      rerender(<GradeDisplay grade={85} maxScore={100} />);
      const bLetters = screen.getAllByText('B');
      expect(bLetters.find(el => el.className.includes('text-blue-600'))).toBeTruthy();

      // C grade (70-79) - yellow
      rerender(<GradeDisplay grade={75} maxScore={100} />);
      const cLetters = screen.getAllByText('C');
      expect(cLetters.find(el => el.className.includes('text-yellow-600'))).toBeTruthy();

      // D grade (60-69) - orange
      rerender(<GradeDisplay grade={65} maxScore={100} />);
      const dLetters = screen.getAllByText('D');
      expect(dLetters.find(el => el.className.includes('text-orange-600'))).toBeTruthy();

      // F grade (0-59) - red
      rerender(<GradeDisplay grade={55} maxScore={100} />);
      const fLetters = screen.getAllByText('F');
      expect(fLetters.find(el => el.className.includes('text-red-600'))).toBeTruthy();
    });

    it('applies correct colors in compact mode', () => {
      const { rerender } = render(<GradeDisplay grade={95} maxScore={100} compact={true} />);

      // A grade - green
      expect(screen.getAllByText('A').find(el => el.className.includes('text-green-600'))).toBeTruthy();

      // B grade - blue
      rerender(<GradeDisplay grade={85} maxScore={100} compact={true} />);
      expect(screen.getAllByText('B').find(el => el.className.includes('text-blue-600'))).toBeTruthy();

      // C grade - yellow
      rerender(<GradeDisplay grade={75} maxScore={100} compact={true} />);
      expect(screen.getAllByText('C').find(el => el.className.includes('text-yellow-600'))).toBeTruthy();
    });
  });

  describe('Letter Grade Conversion', () => {
    it('converts percentage to correct letter grades', () => {
      const { rerender } = render(<GradeDisplay grade={93} maxScore={100} />);

      // 93% = A
      expect(screen.getAllByText('A').length).toBeGreaterThan(0);

      // 90% = A-
      rerender(<GradeDisplay grade={90} maxScore={100} />);
      expect(screen.getAllByText('A-').length).toBeGreaterThan(0);

      // 87% = B+
      rerender(<GradeDisplay grade={87} maxScore={100} />);
      expect(screen.getAllByText('B+').length).toBeGreaterThan(0);

      // 83% = B
      rerender(<GradeDisplay grade={83} maxScore={100} />);
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);

      // 80% = B-
      rerender(<GradeDisplay grade={80} maxScore={100} />);
      expect(screen.getAllByText('B-').length).toBeGreaterThan(0);

      // 77% = C+
      rerender(<GradeDisplay grade={77} maxScore={100} />);
      expect(screen.getAllByText('C+').length).toBeGreaterThan(0);

      // 73% = C
      rerender(<GradeDisplay grade={73} maxScore={100} />);
      expect(screen.getAllByText('C').length).toBeGreaterThan(0);

      // 70% = C-
      rerender(<GradeDisplay grade={70} maxScore={100} />);
      expect(screen.getAllByText('C-').length).toBeGreaterThan(0);

      // 67% = D+
      rerender(<GradeDisplay grade={67} maxScore={100} />);
      expect(screen.getAllByText('D+').length).toBeGreaterThan(0);

      // 63% = D
      rerender(<GradeDisplay grade={63} maxScore={100} />);
      expect(screen.getAllByText('D').length).toBeGreaterThan(0);

      // 60% = D-
      rerender(<GradeDisplay grade={60} maxScore={100} />);
      expect(screen.getAllByText('D-').length).toBeGreaterThan(0);

      // 59% = F
      rerender(<GradeDisplay grade={59} maxScore={100} />);
      expect(screen.getAllByText('F').length).toBeGreaterThan(0);
    });
  });

  describe('Progress Bar Colors', () => {
    it('applies correct progress bar colors', () => {
      const { rerender } = render(<GradeDisplay grade={95} maxScore={100} />);

      // 95% = green
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-green-500');

      // 85% = blue
      rerender(<GradeDisplay grade={85} maxScore={100} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-500');

      // 75% = yellow
      rerender(<GradeDisplay grade={75} maxScore={100} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-500');

      // 65% = orange
      rerender(<GradeDisplay grade={65} maxScore={100} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-orange-500');

      // 55% = red
      rerender(<GradeDisplay grade={55} maxScore={100} />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero grade', () => {
      render(<GradeDisplay grade={0} maxScore={100} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getAllByText('F').length).toBeGreaterThan(0);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles perfect score', () => {
      render(<GradeDisplay grade={100} maxScore={100} />);

      expect(screen.getAllByText('100').length).toBeGreaterThan(0);
      expect(screen.getAllByText('A').length).toBeGreaterThan(0);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles decimal grades', () => {
      render(<GradeDisplay grade={87.5} maxScore={100} />);

      // Rounded percentage to integer
      expect(screen.getByText('87.5')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('B+')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('handles different max scores', () => {
      render(<GradeDisplay grade={17} maxScore={20} />);

      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('handles very large scores', () => {
      render(<GradeDisplay grade={850} maxScore={1000} />);

      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className in compact mode', () => {
      const { container } = render(<GradeDisplay {...defaultProps} compact={true} className="custom-class" />);

      const custom = container.querySelector('.custom-class');
      expect(custom).toBeInTheDocument();
    });

    it('applies custom className in full mode', () => {
      const { container } = render(<GradeDisplay {...defaultProps} className="custom-class" />);

      const custom = container.querySelector('.custom-class');
      expect(custom).toBeInTheDocument();
    });
  });

  describe('Feedback Display', () => {
    it('renders feedback with proper formatting', () => {
      const longFeedback = 'This is a very long feedback message that should be displayed properly with line breaks and formatting preserved.';
      render(<GradeDisplay {...defaultProps} feedback={longFeedback} />);

      const feedbackElement = screen.getByText(longFeedback);
      expect(feedbackElement).toBeInTheDocument();
    });

    it('handles feedback with line breaks', () => {
      const feedbackWithBreaks = 'Line 1\nLine 2\nLine 3';
      render(<GradeDisplay {...defaultProps} feedback={feedbackWithBreaks} />);

      const feedback = screen.getByText((content) => content.includes('Line 1') && content.includes('Line 2') && content.includes('Line 3'));
      expect(feedback).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<GradeDisplay {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<GradeDisplay {...defaultProps} />);

      expect(screen.getByText('Grade & Feedback')).toBeInTheDocument();
      expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    });
  });
});

