import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionFilters } from '../SubmissionFilters';
import { SubmissionFiltersState } from '../SubmissionHistory';

describe('SubmissionFilters', () => {
  const defaultProps = {
    filters: {
      status: '',
      hasGrade: null,
      courseId: '',
      assignmentId: '',
      submittedAfter: '',
      submittedBefore: '',
      search: '',
    } as SubmissionFiltersState,
    onFilterChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a test component that updates filters
  const TestSubmissionFilters = ({ initialFilters, onFilterChange }: { 
    initialFilters: SubmissionFiltersState, 
    onFilterChange: jest.Mock 
  }) => {
    const [filters, setFilters] = React.useState(initialFilters);
    
    const handleFilterChange = (newFilters: Partial<SubmissionFiltersState>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      onFilterChange(newFilters);
    };
    
    return <SubmissionFilters filters={filters} onFilterChange={handleFilterChange} />;
  };

  it('renders filter form with all fields', () => {
    render(<SubmissionFilters {...defaultProps} />);

    expect(screen.getByText('Filter Submissions')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('shows advanced filters toggle button', () => {
    render(<SubmissionFilters {...defaultProps} />);

    const toggleButton = screen.getByText('Show Advanced');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles advanced filters visibility', async () => {
    const user = userEvent.setup();
    render(<SubmissionFilters {...defaultProps} />);

    // Initially advanced filters should be hidden
    expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();

    // Click to show advanced filters
    const toggleButton = screen.getByText('Show Advanced');
    await user.click(toggleButton);

    // Advanced filters should now be visible
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Course ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Assignment ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Submitted After')).toBeInTheDocument();
    expect(screen.getByLabelText('Submitted Before')).toBeInTheDocument();

    // Button text should change
    expect(screen.getByText('Hide Advanced')).toBeInTheDocument();

    // Click to hide advanced filters
    await user.click(screen.getByText('Hide Advanced'));

    // Advanced filters should be hidden again
    expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();
    expect(screen.getByText('Show Advanced')).toBeInTheDocument();
  });

  describe('Basic Filters', () => {
    it('handles status filter change', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'graded');

      expect(onFilterChange).toHaveBeenCalledWith({ status: 'graded' });
    });

    it('handles grade status filter change', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const gradeSelect = screen.getByLabelText('Grade Status');
      await user.selectOptions(gradeSelect, 'true');

      expect(onFilterChange).toHaveBeenCalledWith({ hasGrade: true });
    });

    it('handles search filter change', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<TestSubmissionFilters initialFilters={defaultProps.filters} onFilterChange={onFilterChange} />);

      const searchInput = screen.getByLabelText('Search');
      await user.type(searchInput, 'algorithm');

      // Wait for the final value to be set
      await waitFor(() => {
        expect(searchInput).toHaveValue('algorithm');
      });
      
      // Check that onFilterChange was called multiple times (once per keystroke)
      expect(onFilterChange).toHaveBeenCalledTimes(9);
      
      // Check the last call to onFilterChange
      const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({ search: 'algorithm' });
    });

    it('shows correct status options', () => {
      render(<SubmissionFilters {...defaultProps} />);

      const statusSelect = screen.getByLabelText('Status');
      const options = Array.from(statusSelect.querySelectorAll('option')).map(option => option.value);

      expect(options).toEqual(['', 'submitted', 'graded', 'late', 'returned', 'draft']);
    });

    it('shows correct grade status options', () => {
      render(<SubmissionFilters {...defaultProps} />);

      const gradeSelect = screen.getByLabelText('Grade Status');
      const options = Array.from(gradeSelect.querySelectorAll('option')).map(option => option.textContent);

      expect(options).toEqual(['All Submissions', 'Graded', 'Not Graded']);
    });
  });

  describe('Advanced Filters', () => {
    it('shows course ID filter', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const courseInput = screen.getByLabelText('Course ID');
      expect(courseInput).toBeInTheDocument();
      expect(courseInput).toHaveAttribute('placeholder', 'e.g., CS101');
    });

    it('shows assignment ID filter', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const assignmentInput = screen.getByLabelText('Assignment ID');
      expect(assignmentInput).toBeInTheDocument();
      expect(assignmentInput).toHaveAttribute('placeholder', 'e.g., HW1');
    });

    it('shows date range filters', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      expect(screen.getByLabelText('Submitted After')).toBeInTheDocument();
      expect(screen.getByLabelText('Submitted Before')).toBeInTheDocument();
    });

    it('handles course ID filter change', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<TestSubmissionFilters initialFilters={defaultProps.filters} onFilterChange={onFilterChange} />);

      // Show advanced filters first
      const toggleButton = screen.getByText('Show Advanced');
      await user.click(toggleButton);

      const courseInput = screen.getByLabelText('Course ID');
      await user.type(courseInput, 'CS101');

      // Wait for the final value to be set
      await waitFor(() => {
        expect(courseInput).toHaveValue('CS101');
      });
      
      // Check that onFilterChange was called multiple times (once per keystroke)
      expect(onFilterChange).toHaveBeenCalledTimes(5);
      
      // Check the last call to onFilterChange
      const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({ courseId: 'CS101' });
    });

    it('handles assignment ID filter change', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<TestSubmissionFilters initialFilters={defaultProps.filters} onFilterChange={onFilterChange} />);

      // Show advanced filters first
      const toggleButton = screen.getByText('Show Advanced');
      await user.click(toggleButton);

      const assignmentInput = screen.getByLabelText('Assignment ID');
      await user.type(assignmentInput, 'HW1');

      // Wait for the final value to be set
      await waitFor(() => {
        expect(assignmentInput).toHaveValue('HW1');
      });
      
      // Check that onFilterChange was called multiple times (once per keystroke)
      expect(onFilterChange).toHaveBeenCalledTimes(3);
      
      // Check the last call to onFilterChange
      const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({ assignmentId: 'HW1' });
    });

    it('handles date filter changes', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const afterInput = screen.getByLabelText('Submitted After');
      const beforeInput = screen.getByLabelText('Submitted Before');

      await user.type(afterInput, '2024-01-01');
      await user.type(beforeInput, '2024-01-31');

      expect(onFilterChange).toHaveBeenCalledWith({ submittedAfter: '2024-01-01' });
      expect(onFilterChange).toHaveBeenCalledWith({ submittedBefore: '2024-01-31' });
    });
  });

  describe('Quick Date Presets', () => {
    it('shows quick date preset buttons', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      expect(screen.getByText('Last Week')).toBeInTheDocument();
      expect(screen.getByText('Last Month')).toBeInTheDocument();
      expect(screen.getByText('Last Semester')).toBeInTheDocument();
    });

    it('applies last week preset', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const lastWeekButton = screen.getByText('Last Week');
      await user.click(lastWeekButton);

      // Should call onFilterChange twice (for after and before dates)
      expect(onFilterChange).toHaveBeenCalledTimes(2);
      
      // Verify the calls contain date values
      const calls = onFilterChange.mock.calls;
      expect(calls.some(call => call[0].submittedAfter)).toBe(true);
      expect(calls.some(call => call[0].submittedBefore)).toBe(true);
    });

    it('applies last month preset', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const lastMonthButton = screen.getByText('Last Month');
      await user.click(lastMonthButton);

      expect(onFilterChange).toHaveBeenCalledTimes(2);
    });

    it('applies last semester preset', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      render(<SubmissionFilters {...defaultProps} onFilterChange={onFilterChange} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      const lastSemesterButton = screen.getByText('Last Semester');
      await user.click(lastSemesterButton);

      expect(onFilterChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filters section when filters are applied', () => {
      const filtersWithValues = {
        status: 'graded',
        hasGrade: true,
        courseId: 'CS101',
        assignmentId: 'HW1',
        submittedAfter: '2024-01-01',
        submittedBefore: '2024-01-31',
        search: 'algorithm',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithValues} />);

      expect(screen.getByText('Active Filters')).toBeInTheDocument();
      expect(screen.getByText('Status: graded')).toBeInTheDocument();
      expect(screen.getByText('Grade: Graded')).toBeInTheDocument();
      expect(screen.getByText('Course: CS101')).toBeInTheDocument();
      expect(screen.getByText('Assignment: HW1')).toBeInTheDocument();
      expect(screen.getByText('After: 2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('Before: 2024-01-31')).toBeInTheDocument();
      expect(screen.getByText('Search: "algorithm"')).toBeInTheDocument();
    });

    it('does not show active filters section when no filters are applied', () => {
      render(<SubmissionFilters {...defaultProps} />);

      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
    });

    it('allows removing individual filters', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      const filtersWithValues = {
        status: 'graded',
        courseId: 'CS101',
        search: 'algorithm',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithValues} onFilterChange={onFilterChange} />);

      // Remove status filter
      const statusRemoveButton = screen.getByText('Status: graded').querySelector('button');
      if (statusRemoveButton) {
        await user.click(statusRemoveButton);
      }

      expect(onFilterChange).toHaveBeenCalledWith({ status: '' });
    });

    it('shows clear all button when filters are active', () => {
      const filtersWithValues = {
        status: 'graded',
        courseId: 'CS101',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithValues} />);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      const filtersWithValues = {
        status: 'graded',
        courseId: 'CS101',
        search: 'algorithm',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithValues} onFilterChange={onFilterChange} />);

      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      expect(onFilterChange).toHaveBeenCalledWith({
        status: '',
        hasGrade: null,
        courseId: '',
        assignmentId: '',
        submittedAfter: '',
        submittedBefore: '',
        search: '',
      });
    });
  });

  describe('Filter Colors and Styling', () => {
    it('applies correct colors to different filter types', () => {
      const filtersWithValues = {
        status: 'graded',
        hasGrade: true,
        courseId: 'CS101',
        assignmentId: 'HW1',
        submittedAfter: '2024-01-01',
        submittedBefore: '2024-01-31',
        search: 'algorithm',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithValues} />);

      // Status filter - blue
      expect(screen.getByText('Status: graded')).toHaveClass('bg-blue-100', 'text-blue-800');

      // Grade filter - green
      expect(screen.getByText('Grade: Graded')).toHaveClass('bg-green-100', 'text-green-800');

      // Course filter - purple
      expect(screen.getByText('Course: CS101')).toHaveClass('bg-purple-100', 'text-purple-800');

      // Assignment filter - yellow
      expect(screen.getByText('Assignment: HW1')).toHaveClass('bg-yellow-100', 'text-yellow-800');

      // Date filters - indigo
      expect(screen.getByText('After: 2024-01-01')).toHaveClass('bg-indigo-100', 'text-indigo-800');
      expect(screen.getByText('Before: 2024-01-31')).toHaveClass('bg-indigo-100', 'text-indigo-800');

      // Search filter - gray
      expect(screen.getByText('Search: "algorithm"')).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Form Validation and Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(<SubmissionFilters {...defaultProps} />);

      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Grade Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('has proper placeholders for text inputs', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      // Show advanced filters
      await user.click(screen.getByText('Show Advanced'));

      expect(screen.getByLabelText('Course ID')).toHaveAttribute('placeholder', 'e.g., CS101');
      expect(screen.getByLabelText('Assignment ID')).toHaveAttribute('placeholder', 'e.g., HW1');
    });

    it('applies focus styles to form elements', async () => {
      const user = userEvent.setup();
      render(<SubmissionFilters {...defaultProps} />);

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);

      expect(statusSelect).toHaveClass('focus:ring-blue-500', 'focus:border-blue-500');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      render(<SubmissionFilters {...defaultProps} className="custom-class" />);
      
      const container = screen.getByText('Filter Submissions').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles null hasGrade filter correctly', () => {
      const filtersWithNullGrade = {
        ...defaultProps.filters,
        hasGrade: null,
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithNullGrade} />);

      const gradeSelect = screen.getByLabelText('Grade Status');
      expect(gradeSelect).toHaveValue('');
    });

    it('handles boolean hasGrade filter correctly', () => {
      const filtersWithTrueGrade = {
        ...defaultProps.filters,
        hasGrade: true,
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithTrueGrade} />);

      const gradeSelect = screen.getByLabelText('Grade Status');
      expect(gradeSelect).toHaveValue('true');
    });

    it('handles empty string filters correctly', () => {
      const filtersWithEmptyStrings = {
        ...defaultProps.filters,
        status: '',
        courseId: '',
        assignmentId: '',
        search: '',
      };

      render(<SubmissionFilters {...defaultProps} filters={filtersWithEmptyStrings} />);

      // Should not show active filters section
      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
    });
  });
});

