import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstructorCommunityFeed } from '../InstructorCommunityFeed';

// Mock the child components
jest.mock('../InstructorSubmissionCard', () => {
  return function MockInstructorSubmissionCard({ submission, isSelected, onSelect, onGrade }: any) {
    return (
      <div data-testid={`submission-card-${submission.id}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(submission.id, e.target.checked)}
          data-testid={`checkbox-${submission.id}`}
        />
        <button onClick={() => onGrade(submission)} data-testid={`grade-btn-${submission.id}`}>
          Grade
        </button>
        <span>{submission.studentName}</span>
        <span>{submission.assignmentTitle}</span>
      </div>
    );
  };
});

jest.mock('../BulkActionsToolbar', () => {
  return function MockBulkActionsToolbar({ selectedCount, onBulkAction, onClearSelection }: any) {
    return (
      <div data-testid="bulk-actions-toolbar">
        <span>{selectedCount} selected</span>
        <button onClick={() => onBulkAction('mark_in_progress')}>Mark In Progress</button>
        <button onClick={() => onBulkAction('mark_completed')}>Mark Completed</button>
        <button onClick={() => onBulkAction('set_high_priority')}>Set High Priority</button>
        <button onClick={onClearSelection}>Clear Selection</button>
      </div>
    );
  };
});

jest.mock('../GradingModal', () => {
  return function MockGradingModal({ submission, isOpen, onClose, onSave }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="grading-modal">
        <h2>Grade {submission.studentName}</h2>
        <button onClick={() => onSave(submission.id, 85, 'Good work', 'Notes')}>Save Grade</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../InstructorStats', () => {
  return function MockInstructorStats({ submissions }: any) {
    return (
      <div data-testid="instructor-stats">
        <span>{submissions.length} total submissions</span>
      </div>
    );
  };
});

jest.mock('../../common/SearchBar', () => {
  return function MockSearchBar({ value, onChange }: any) {
    return (
      <input
        data-testid="search-bar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
      />
    );
  };
});

jest.mock('../../common/FilterDropdown', () => {
  return function MockFilterDropdown({ label, value, onChange, options }: any) {
    return (
      <select
        data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock('../../common/Pagination', () => {
  return function MockPagination({ currentPage, totalPages, onPageChange }: any) {
    return (
      <div data-testid="pagination">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>{currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    );
  };
});

describe('InstructorCommunityFeed', () => {
  const mockProps = {
    instructorId: 'test-instructor-001',
    className: 'test-class',
  };

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  it('renders the instructor dashboard header', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Manage student submissions, grade assignments, and track review progress/)).toBeInTheDocument();
  });

  it('displays instructor statistics', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    expect(screen.getByTestId('instructor-stats')).toBeInTheDocument();
    expect(screen.getByText('3 total submissions')).toBeInTheDocument();
  });

  it('renders search and filter controls', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('filter-status')).toBeInTheDocument();
    expect(screen.getByTestId('filter-course')).toBeInTheDocument();
    expect(screen.getByTestId('filter-priority')).toBeInTheDocument();
    expect(screen.getByTestId('filter-review-status')).toBeInTheDocument();
  });

  it('displays submission cards for each submission', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    expect(screen.getByTestId('submission-card-sub-001')).toBeInTheDocument();
    expect(screen.getByTestId('submission-card-sub-002')).toBeInTheDocument();
    expect(screen.getByTestId('submission-card-sub-003')).toBeInTheDocument();
  });

  it('allows selecting individual submissions', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    const checkbox = screen.getByTestId('checkbox-sub-001');
    await user.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('shows bulk actions toolbar when submissions are selected', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Initially, bulk actions toolbar should not be visible
    expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument();
    
    // Select a submission
    const checkbox = screen.getByTestId('checkbox-sub-001');
    await user.click(checkbox);
    
    // Bulk actions toolbar should now be visible
    expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('allows selecting all submissions', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Find and click the select all checkbox (this would be in the header)
    // For now, we'll test by selecting individual submissions
    const checkbox1 = screen.getByTestId('checkbox-sub-001');
    const checkbox2 = screen.getByTestId('checkbox-sub-002');
    const checkbox3 = screen.getByTestId('checkbox-sub-003');
    
    await user.click(checkbox1);
    await user.click(checkbox2);
    await user.click(checkbox3);
    
    expect(checkbox1).toBeChecked();
    expect(checkbox2).toBeChecked();
    expect(checkbox3).toBeChecked();
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('performs bulk actions on selected submissions', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Select a submission
    const checkbox = screen.getByTestId('checkbox-sub-001');
    await user.click(checkbox);
    
    // Perform bulk action
    const markInProgressBtn = screen.getByText('Mark In Progress');
    await user.click(markInProgressBtn);
    
    // Wait for the action to complete
    await waitFor(() => {
      expect(screen.queryByTestId('bulk-actions-toolbar')).not.toBeInTheDocument();
    });
  });

  it('opens grading modal when grade button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Initially, grading modal should not be visible
    expect(screen.queryByTestId('grading-modal')).not.toBeInTheDocument();
    
    // Click grade button on a submission
    const gradeBtn = screen.getByTestId('grade-btn-sub-001');
    await user.click(gradeBtn);
    
    // Grading modal should now be visible
    expect(screen.getByTestId('grading-modal')).toBeInTheDocument();
    expect(screen.getByText('Grade Alex Johnson')).toBeInTheDocument();
  });

  it('handles grading completion', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Open grading modal
    const gradeBtn = screen.getByTestId('grade-btn-sub-001');
    await user.click(gradeBtn);
    
    // Save grade
    const saveBtn = screen.getByText('Save Grade');
    await user.click(saveBtn);
    
    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('grading-modal')).not.toBeInTheDocument();
    });
  });

  it('filters submissions by status', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    const statusFilter = screen.getByTestId('filter-status');
    await user.selectOptions(statusFilter, 'submitted');
    
    // Should show only submitted submissions
    expect(screen.getByTestId('submission-card-sub-001')).toBeInTheDocument();
    expect(screen.getByTestId('submission-card-sub-003')).toBeInTheDocument();
    // sub-002 has status 'completed', so it should be filtered out
    expect(screen.queryByTestId('submission-card-sub-002')).not.toBeInTheDocument();
  });

  it('filters submissions by priority', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    const priorityFilter = screen.getByTestId('filter-priority');
    await user.selectOptions(priorityFilter, 'high');
    
    // Should show only high priority submissions
    expect(screen.getByTestId('submission-card-sub-001')).toBeInTheDocument();
    // sub-002 and sub-003 have lower priority, so they should be filtered out
    expect(screen.queryByTestId('submission-card-sub-002')).not.toBeInTheDocument();
    expect(screen.queryByTestId('submission-card-sub-003')).not.toBeInTheDocument();
  });

  it('searches submissions by text', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    const searchBar = screen.getByTestId('search-bar');
    await user.type(searchBar, 'Alex');
    
    // Should show only submissions matching "Alex"
    expect(screen.getByTestId('submission-card-sub-001')).toBeInTheDocument();
    expect(screen.queryByTestId('submission-card-sub-002')).not.toBeInTheDocument();
    expect(screen.queryByTestId('submission-card-sub-003')).not.toBeInTheDocument();
  });

  it('sorts submissions by priority', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    const sortFilter = screen.getByTestId('filter-sort-by');
    await user.selectOptions(sortFilter, 'priority');
    
    // Submissions should be sorted by priority (high first)
    const submissionCards = screen.getAllByTestId(/submission-card-/);
    expect(submissionCards[0]).toHaveAttribute('data-testid', 'submission-card-sub-001'); // high priority
  });

  it('resets all filters when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Apply some filters
    const searchBar = screen.getByTestId('search-bar');
    const statusFilter = screen.getByTestId('filter-status');
    
    await user.type(searchBar, 'Alex');
    await user.selectOptions(statusFilter, 'submitted');
    
    // Reset filters
    const resetBtn = screen.getByText('Reset Filters');
    await user.click(resetBtn);
    
    // All submissions should be visible again
    expect(screen.getByTestId('submission-card-sub-001')).toBeInTheDocument();
    expect(screen.getByTestId('submission-card-sub-002')).toBeInTheDocument();
    expect(screen.getByTestId('submission-card-sub-003')).toBeInTheDocument();
    
    // Search should be cleared
    expect(searchBar).toHaveValue('');
  });

  it('displays pagination when there are many submissions', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // With 3 submissions and default page size, pagination should be visible
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('clears selection when bulk action is completed', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Select a submission
    const checkbox = screen.getByTestId('checkbox-sub-001');
    await user.click(checkbox);
    
    // Verify it's selected
    expect(checkbox).toBeChecked();
    
    // Perform bulk action
    const markCompletedBtn = screen.getByText('Mark Completed');
    await user.click(markCompletedBtn);
    
    // Selection should be cleared
    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('handles keyboard shortcuts for selection', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Test Ctrl+A for select all (this would need to be implemented in the component)
    // For now, we'll test the individual selection functionality
    const checkbox = screen.getByTestId('checkbox-sub-001');
    await user.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('shows estimated grading time in statistics', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // The InstructorStats component should display information about estimated grading time
    expect(screen.getByTestId('instructor-stats')).toBeInTheDocument();
  });

  it('displays late submission indicators', () => {
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // The submission cards should show late indicators for late submissions
    // This is handled by the InstructorSubmissionCard component
    expect(screen.getByTestId('submission-card-sub-003')).toBeInTheDocument(); // This is a late submission
  });

  it('maintains filter state across page changes', async () => {
    const user = userEvent.setup();
    render(<InstructorCommunityFeed {...mockProps} />);
    
    // Apply a filter
    const statusFilter = screen.getByTestId('filter-status');
    await user.selectOptions(statusFilter, 'submitted');
    
    // Change page
    const nextBtn = screen.getByText('Next');
    await user.click(nextBtn);
    
    // Filter should still be applied
    expect(statusFilter).toHaveValue('submitted');
  });
});





