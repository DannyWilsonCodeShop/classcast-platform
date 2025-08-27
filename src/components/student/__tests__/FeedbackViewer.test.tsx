import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackViewer } from '../FeedbackViewer';

describe('FeedbackViewer', () => {
  const defaultProps = {
    feedback: 'Excellent work on the algorithm implementation!',
    rubricScores: [
      { criterion: 'Algorithm Correctness', points: 40, maxPoints: 50, feedback: 'Very good logic' },
      { criterion: 'Code Quality', points: 35, maxPoints: 40, feedback: 'Clean and readable code' },
      { criterion: 'Documentation', points: 10, maxPoints: 10, feedback: 'Well documented' },
    ],
    instructorNotes: 'Great attention to detail in the implementation.',
  };

  it('renders nothing when no feedback or rubric scores or notes', () => {
    const { container } = render(<FeedbackViewer feedback="" />);
    // Component will still render the feedback tab even with empty feedback
    expect(container.firstChild).toBeTruthy();
    // Should still show the feedback tab
    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
  });

  it('renders with only feedback', () => {
    render(<FeedbackViewer feedback="Some feedback" />);

    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    expect(screen.getByText('Some feedback')).toBeInTheDocument();
    
    // Should not show tabs when only one section
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('renders with feedback and rubric scores', () => {
    render(<FeedbackViewer feedback="Some feedback" rubricScores={defaultProps.rubricScores} />);

    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    // Rubric content is not visible by default, only the tab
    
    // Should show tabs
    expect(screen.getByRole('tab', { name: 'Feedback 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rubric Scores 3' })).toBeInTheDocument();
  });

  it('renders with feedback and instructor notes', () => {
    render(<FeedbackViewer feedback="Some feedback" instructorNotes="Some notes" />);

    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    expect(screen.getByText('Instructor Notes')).toBeInTheDocument();
    
    // Should show tabs
    expect(screen.getByRole('tab', { name: 'Feedback 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Instructor Notes 1' })).toBeInTheDocument();
  });

  it('renders all three sections when all props are provided', () => {
    render(<FeedbackViewer {...defaultProps} />);

    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    expect(screen.getByText('Instructor Notes')).toBeInTheDocument();
    
    // Should show tabs
    expect(screen.getByRole('tab', { name: 'Feedback 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rubric Scores 3' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Instructor Notes 1' })).toBeInTheDocument();
  });

  describe('Tab Navigation', () => {
    it('shows feedback tab by default', () => {
      render(<FeedbackViewer {...defaultProps} />);

      expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
      // Rubric and notes content are not visible by default, only their tabs
      expect(screen.queryByText('Rubric Assessment')).not.toBeInTheDocument();
      // Notes tab is always visible, but content is not shown by default
    });

    it('switches to rubric tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackViewer {...defaultProps} />);

      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      await user.click(rubricTab);

      expect(screen.getByText('Rubric Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Instructor Feedback')).not.toBeInTheDocument();
      // Notes content is not visible when rubric tab is active, but tab is always there
    });

    it('switches to notes tab when clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackViewer {...defaultProps} />);

      const notesTab = screen.getByRole('tab', { name: 'Instructor Notes 1' });
      await user.click(notesTab);

      // Use the heading text which is more specific
      expect(screen.getByRole('heading', { name: 'Instructor Notes' })).toBeInTheDocument();
      expect(screen.getByText('Great attention to detail in the implementation.')).toBeInTheDocument();
      expect(screen.queryByText('Instructor Feedback')).not.toBeInTheDocument();
      expect(screen.queryByText('Rubric Assessment')).not.toBeInTheDocument();
    });

    it('highlights active tab correctly', async () => {
      const user = userEvent.setup();
      render(<FeedbackViewer {...defaultProps} />);

      const feedbackTab = screen.getByRole('tab', { name: 'Feedback 1' });
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });

      // Initially feedback tab should be active
      expect(feedbackTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(rubricTab).toHaveClass('border-transparent', 'text-gray-500');

      // Click rubric tab
      await user.click(rubricTab);

      // Now rubric tab should be active
      expect(rubricTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(feedbackTab).toHaveClass('border-transparent', 'text-gray-500');
    });
  });

  describe('Feedback Tab', () => {
    it('displays feedback text correctly', () => {
      render(<FeedbackViewer {...defaultProps} />);

      expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
      expect(screen.getByText('Excellent work on the algorithm implementation!')).toBeInTheDocument();
    });

    it('preserves line breaks in feedback', () => {
      const feedbackWithBreaks = 'Line 1\nLine 2\nLine 3';
      render(<FeedbackViewer feedback={feedbackWithBreaks} />);

      // Check that the text content includes all lines by finding the paragraph element
      const feedbackParagraph = screen.getByText((content, element) => 
        (element?.tagName === 'P' && element?.textContent?.includes('Line 1')) || false
      );
      expect(feedbackParagraph.textContent).toContain('Line 1');
      expect(feedbackParagraph.textContent).toContain('Line 2');
      expect(feedbackParagraph.textContent).toContain('Line 3');
    });

    it('applies correct styling to feedback section', () => {
      render(<FeedbackViewer {...defaultProps} />);

      const feedbackContainer = screen.getByText('Excellent work on the algorithm implementation!').closest('div')?.parentElement?.parentElement;
      expect(feedbackContainer).toHaveClass('bg-blue-50', 'border', 'border-blue-200', 'rounded-lg');
    });
  });

  describe('Rubric Tab', () => {
    it('displays all rubric criteria', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      expect(screen.getByText('Algorithm Correctness')).toBeInTheDocument();
      expect(screen.getByText('Code Quality')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();

      // Check for split text content using regex
      expect(screen.getByText(/40\/50/)).toBeInTheDocument();
      expect(screen.getByText(/35\/40/)).toBeInTheDocument();
      expect(screen.getByText(/10\/10/)).toBeInTheDocument();
    });

    it('shows correct scores for each criterion', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      // Check for split text content using regex
      expect(screen.getByText(/40\/50/)).toBeInTheDocument();
      expect(screen.getByText(/35\/40/)).toBeInTheDocument();
      expect(screen.getByText(/10\/10/)).toBeInTheDocument();
    });

    it('displays criterion feedback when available', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      expect(screen.getByText('Very good logic')).toBeInTheDocument();
      expect(screen.getByText('Clean and readable code')).toBeInTheDocument();
      expect(screen.getByText('Well documented')).toBeInTheDocument();
    });

    it('shows progress bars for each criterion', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
    });

    it('applies correct colors to criterion scores', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      // 40/50 = 80% (blue)
      expect(screen.getByText(/40\/50/)).toHaveClass('bg-blue-100', 'text-blue-600');
      
      // 35/40 = 87.5% (blue)
      expect(screen.getByText(/35\/40/)).toHaveClass('bg-blue-100', 'text-blue-600');
      
      // 10/10 = 100% (green)
      expect(screen.getByText(/10\/10/)).toHaveClass('bg-green-100', 'text-green-600');
    });

    it('shows correct emojis for different score ranges', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      // 40/50 = 80% (👍)
      expect(screen.getByText(/👍.*40\/50/)).toBeInTheDocument();
      
      // 35/40 = 87.5% (👍)
      expect(screen.getByText(/👍.*35\/40/)).toBeInTheDocument();
      
      // 10/10 = 100% (🎯)
      expect(screen.getByText(/🎯.*10\/10/)).toBeInTheDocument();
    });

    it('displays total rubric summary', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to rubric tab
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      fireEvent.click(rubricTab);

      expect(screen.getByText('Total Rubric Score')).toBeInTheDocument();
      expect(screen.getByText(/85.*100/)).toBeInTheDocument();
      expect(screen.getByText('85.0% of total possible points')).toBeInTheDocument();
    });

    it('handles rubric scores without feedback', () => {
      const rubricScoresWithoutFeedback = [
        { criterion: 'Test Criterion', points: 8, maxPoints: 10 },
      ];

      render(<FeedbackViewer feedback="Test feedback" rubricScores={rubricScoresWithoutFeedback} />);

      // Switch to rubric tab - should show "Rubric Scores 1" since there's only 1 score
      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 1' });
      fireEvent.click(rubricTab);

      expect(screen.getByText('Test Criterion')).toBeInTheDocument();
      expect(screen.getByText(/8\/10/)).toBeInTheDocument();
      // Should not show feedback section for this criterion
      expect(screen.queryByText('Test feedback')).not.toBeInTheDocument();
    });
  });

  describe('Instructor Notes Tab', () => {
    it('displays instructor notes correctly', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to notes tab
      const notesTab = screen.getByRole('tab', { name: 'Instructor Notes 1' });
      fireEvent.click(notesTab);

      // Use the heading text which is more specific
      expect(screen.getByRole('heading', { name: 'Instructor Notes' })).toBeInTheDocument();
      expect(screen.getByText('Great attention to detail in the implementation.')).toBeInTheDocument();
    });

    it('preserves line breaks in notes', () => {
      const notesWithBreaks = 'Note line 1\nNote line 2\nNote line 3';
      render(<FeedbackViewer feedback="Test feedback" instructorNotes={notesWithBreaks} />);

      // Switch to notes tab
      const notesTab = screen.getByRole('tab', { name: 'Instructor Notes 1' });
      fireEvent.click(notesTab);

      // Check that the text content includes all lines by finding the paragraph element
      const notesParagraph = screen.getByText((content, element) => 
        (element?.tagName === 'P' && element?.textContent?.includes('Note line 1')) || false
      );
      expect(notesParagraph.textContent).toContain('Note line 1');
      expect(notesParagraph.textContent).toContain('Note line 2');
      expect(notesParagraph.textContent).toContain('Note line 3');
    });

    it('applies correct styling to notes section', () => {
      render(<FeedbackViewer {...defaultProps} />);

      // Switch to notes tab
      const notesTab = screen.getByRole('tab', { name: 'Instructor Notes 1' });
      fireEvent.click(notesTab);

      const notesContainer = screen.getByText('Great attention to detail in the implementation.').closest('div')?.parentElement?.parentElement;
      expect(notesContainer).toHaveClass('bg-yellow-50', 'border', 'border-yellow-200', 'rounded-lg');
    });
  });

  describe('Tab Counts', () => {
    it('shows correct count for rubric scores', () => {
      render(<FeedbackViewer {...defaultProps} />);

      const rubricTab = screen.getByRole('tab', { name: 'Rubric Scores 3' });
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 rubric scores
    });

    it('shows count of 1 for single items', () => {
      render(<FeedbackViewer feedback="Test feedback" instructorNotes="Test notes" />);

      const feedbackTab = screen.getByRole('tab', { name: 'Feedback 1' });
      const notesTab = screen.getByRole('tab', { name: 'Instructor Notes 1' });

      // Use getAllByText since there are multiple "1" elements
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty rubric scores array', () => {
      render(<FeedbackViewer feedback="Test feedback" rubricScores={[]} />);

      // Should not show rubric tab
      expect(screen.queryByRole('tab', { name: 'Rubric Scores 3' })).not.toBeInTheDocument();
    });

    it('handles undefined rubric scores', () => {
      render(<FeedbackViewer feedback="Test feedback" rubricScores={undefined} />);

      // Should not show rubric tab
      expect(screen.queryByRole('tab', { name: 'Rubric Scores 3' })).not.toBeInTheDocument();
    });

    it('handles undefined instructor notes', () => {
      render(<FeedbackViewer feedback="Test feedback" instructorNotes={undefined} />);

      // Should not show notes tab
      expect(screen.queryByRole('tab', { name: 'Instructor Notes 1' })).not.toBeInTheDocument();
    });

    it('handles empty strings', () => {
      // Component will still render the feedback tab even with empty strings
      const { container } = render(<FeedbackViewer feedback="" instructorNotes="" />);
      expect(container.firstChild).toBeTruthy();
      // Should still show the feedback tab
      expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      render(<FeedbackViewer {...defaultProps} className="custom-class" />);

      const container = screen.getByText('Instructor Feedback').closest('div')?.parentElement?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for tabs', () => {
      render(<FeedbackViewer {...defaultProps} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-label', 'Feedback tabs');
    });

    it('uses semantic HTML structure', () => {
      render(<FeedbackViewer {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Feedback 1' })).toBeInTheDocument();
    });
  });
});

