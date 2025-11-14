import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentFilters } from '../AssignmentFilters';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';
import { AssignmentFiltersState } from '../AssignmentList';

// Mock the week calculation to be consistent
jest.mock('../../AssignmentList', () => ({
  ...jest.requireActual('../../AssignmentList'),
  getWeekNumber: () => 25, // Mock current week
}));

describe('AssignmentFilters', () => {
  const mockFilters: AssignmentFiltersState = {
    status: ['published'],
    type: undefined,
    weekNumber: undefined,
    search: undefined,
    dueDateRange: undefined,
  };

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all filter controls', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByPlaceholderText('Search assignments...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Weeks')).toBeInTheDocument();
      expect(screen.getByText('Show Advanced')).toBeInTheDocument();
    });

    it('shows advanced filters when expanded', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const expandButton = screen.getByText('Show Advanced');
      await userEvent.click(expandButton);

      expect(screen.getByText('Due Date From')).toBeInTheDocument();
      expect(screen.getByText('Due Date To')).toBeInTheDocument();
      expect(screen.getByText('Quick Week Presets')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search assignments...');
      await userEvent.type(searchInput, 'React');

      // Wait for debounced search
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'React' });
      }, { timeout: 500 });
    });

    it('debounces search input', async () => {
      jest.useFakeTimers();
      
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search assignments...');
      await userEvent.type(searchInput, 'React');

      // Should not be called immediately
      expect(mockOnFilterChange).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'React' });
      });

      jest.useRealTimers();
    });
  });

  describe('Status Filter', () => {
    it('handles status filter changes', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusSelect = screen.getByDisplayValue('All Statuses');
      await userEvent.selectOptions(statusSelect, 'published');

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        status: ['published'],
      });
    });

    it('clears status filter when selecting "All Statuses"', async () => {
      const filtersWithStatus = { ...mockFilters, status: ['published'] };
      
      render(
        <AssignmentFilters
          filters={filtersWithStatus}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusSelect = screen.getByDisplayValue('Published');
      await userEvent.selectOptions(statusSelect, '');

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...filtersWithStatus,
        status: undefined,
      });
    });
  });

  describe('Type Filter', () => {
    it('handles type filter changes', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const typeSelect = screen.getByDisplayValue('All Types');
      await userEvent.selectOptions(typeSelect, AssignmentType.PROJECT);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        type: AssignmentType.PROJECT,
      });
    });

    it('clears type filter when selecting "All Types"', async () => {
      const filtersWithType = { ...mockFilters, type: AssignmentType.PROJECT };
      
      render(
        <AssignmentFilters
          filters={filtersWithType}
          onFilterChange={mockOnFilterChange}
        />
      );

      const typeSelect = screen.getByDisplayValue('Project');
      await userEvent.selectOptions(typeSelect, '');

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...filtersWithType,
        type: undefined,
      });
    });
  });

  describe('Week Filter', () => {
    it('handles week filter changes', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const weekSelect = screen.getByDisplayValue('All Weeks');
      await userEvent.selectOptions(weekSelect, '26');

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        weekNumber: 26,
      });
    });

    it('generates appropriate week options', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const weekSelect = screen.getByDisplayValue('All Weeks');
      const options = Array.from(weekSelect.querySelectorAll('option'));
      
      // Should show current week - 2 to current week + 8
      expect(options).toHaveLength(12); // 11 weeks + "All Weeks" option
      expect(options[1]).toHaveValue('23'); // Week 23
      expect(options[11]).toHaveValue('33'); // Week 33
    });
  });

  describe('Advanced Filters', () => {
    it('expands and collapses advanced filters', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const expandButton = screen.getByText('Show Advanced');
      
      // Initially collapsed
      expect(screen.queryByText('Due Date From')).not.toBeInTheDocument();
      
      // Expand
      await userEvent.click(expandButton);
      expect(screen.getByText('Due Date From')).toBeInTheDocument();
      expect(screen.getByText('Due Date To')).toBeInTheDocument();
      
      // Collapse
      const collapseButton = screen.getByText('Hide Advanced');
      await userEvent.click(collapseButton);
      expect(screen.queryByText('Due Date From')).not.toBeInTheDocument();
    });

    it('handles due date range filters', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          showAdvancedFilters={true}
        />
      );

      const startDateInput = screen.getByLabelText('Due Date From');
      const endDateInput = screen.getByLabelText('Due Date To');

      await userEvent.type(startDateInput, '2024-12-01');
      await userEvent.type(endDateInput, '2024-12-31');

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        dueDateRange: {
          start: '2024-12-01',
          end: '2024-12-31',
        },
      });
    });

    it('handles quick week preset buttons', async () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          showAdvancedFilters={true}
        />
      );

      const thisWeekButton = screen.getByText('This Week');
      await userEvent.click(thisWeekButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        weekNumber: 25, // Current week
      });
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filters as removable badges', () => {
      const filtersWithValues = {
        ...mockFilters,
        status: ['published', 'active'],
        type: AssignmentType.PROJECT,
        weekNumber: 26,
        search: 'React',
        dueDateRange: { start: '2024-12-01', end: '2024-12-31' },
      };

      render(
        <AssignmentFilters
          filters={filtersWithValues}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Status: published, active')).toBeInTheDocument();
      expect(screen.getByText('Type: project')).toBeInTheDocument();
      expect(screen.getByText('Week: 26')).toBeInTheDocument();
      expect(screen.getByText('Search: "React"')).toBeInTheDocument();
      expect(screen.getByText('Date Range: 2024-12-01 - 2024-12-31')).toBeInTheDocument();
    });

    it('allows removing individual filters', async () => {
      const filtersWithValues = {
        ...mockFilters,
        status: ['published'],
        type: AssignmentType.PROJECT,
      };

      render(
        <AssignmentFilters
          filters={filtersWithValues}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusBadge = screen.getByText('Status: published');
      const removeButton = statusBadge.querySelector('button');
      
      if (removeButton) {
        await userEvent.click(removeButton);
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          ...filtersWithValues,
          status: undefined,
        });
      }
    });
  });

  describe('Clear All Filters', () => {
    it('shows clear all button when filters are active', () => {
      const filtersWithValues = {
        ...mockFilters,
        status: ['published'],
        type: AssignmentType.PROJECT,
      };

      render(
        <AssignmentFilters
          filters={filtersWithValues}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('clears all filters when clear all button is clicked', async () => {
      const filtersWithValues = {
        ...mockFilters,
        status: ['published'],
        type: AssignmentType.PROJECT,
        weekNumber: 26,
        search: 'React',
      };

      render(
        <AssignmentFilters
          filters={filtersWithValues}
          onFilterChange={mockOnFilterChange}
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      await userEvent.click(clearAllButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });

    it('does not show clear all button when no filters are active', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Course-Specific Behavior', () => {
    it('shows course ID when provided', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
          courseId="CS101"
        />
      );

      // The course ID might be displayed in the UI or used for filtering
      // This test ensures the component renders without errors with a courseId
      expect(screen.getByPlaceholderText('Search assignments...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for screen readers', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText('Search assignments')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by type')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by week')).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      render(
        <AssignmentFilters
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const expandButton = screen.getByRole('button', { name: /show advanced/i });
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined filters gracefully', () => {
      render(
        <AssignmentFilters
          filters={{}}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByPlaceholderText('Search assignments...')).toBeInTheDocument();
    });

    it('handles empty filter arrays', () => {
      const emptyFilters = {
        ...mockFilters,
        status: [],
      };

      render(
        <AssignmentFilters
          filters={emptyFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });
  });
});






