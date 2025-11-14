import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentSort } from '../AssignmentSort';
import { AssignmentSortState } from '../AssignmentList';

describe('AssignmentSort', () => {
  const mockSort: AssignmentSortState = {
    field: 'dueDate',
    order: 'asc',
  };

  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders sort controls correctly', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();
      expect(screen.getByText('A → Z')).toBeInTheDocument();
    });

    it('renders all sort field options', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      const options = Array.from(fieldSelect.querySelectorAll('option'));
      
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveValue('dueDate');
      expect(options[1]).toHaveValue('createdAt');
      expect(options[2]).toHaveValue('title');
      expect(options[3]).toHaveValue('maxScore');
      expect(options[4]).toHaveValue('status');
    });
  });

  describe('Field Selection', () => {
    it('handles field changes', async () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      await userEvent.selectOptions(fieldSelect, 'title');

      expect(mockOnSortChange).toHaveBeenCalledWith({ field: 'title' });
    });

    it('calls onSortChange with correct field value', async () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      await userEvent.selectOptions(fieldSelect, 'maxScore');

      expect(mockOnSortChange).toHaveBeenCalledWith({ field: 'maxScore' });
    });
  });

  describe('Order Selection', () => {
    it('shows ascending order button as active when order is asc', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const ascendingButton = screen.getByTitle('Sort ascending');
      const descendingButton = screen.getByTitle('Sort descending');

      expect(ascendingButton).toHaveClass('bg-blue-600', 'text-white');
      expect(descendingButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('shows descending order button as active when order is desc', () => {
      const descSort = { ...mockSort, order: 'desc' as const };

      render(
        <AssignmentSort
          sort={descSort}
          onSortChange={mockOnSortChange}
        />
      );

      const ascendingButton = screen.getByTitle('Sort ascending');
      const descendingButton = screen.getByTitle('Sort descending');

      expect(ascendingButton).toHaveClass('bg-white', 'text-gray-700');
      expect(descendingButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('handles ascending order button click', async () => {
      const descSort = { ...mockSort, order: 'desc' as const };

      render(
        <AssignmentSort
          sort={descSort}
          onSortChange={mockOnSortChange}
        />
      );

      const ascendingButton = screen.getByTitle('Sort ascending');
      await userEvent.click(ascendingButton);

      expect(mockOnSortChange).toHaveBeenCalledWith({ order: 'asc' });
    });

    it('handles descending order button click', async () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const descendingButton = screen.getByTitle('Sort descending');
      await userEvent.click(descendingButton);

      expect(mockOnSortChange).toHaveBeenCalledWith({ order: 'desc' });
    });
  });

  describe('Order Indicator', () => {
    it('shows A → Z for ascending order', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByText('A → Z')).toBeInTheDocument();
    });

    it('shows Z → A for descending order', () => {
      const descSort = { ...mockSort, order: 'desc' as const };

      render(
        <AssignmentSort
          sort={descSort}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByText('Z → A')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact version correctly', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
          compact={true}
        />
      );

      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();
    });

    it('has smaller select in compact mode', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
          compact={true}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      expect(fieldSelect).toHaveClass('text-xs');
    });

    it('has smaller order toggle button in compact mode', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
          compact={true}
        />
      );

      const orderButton = screen.getByTitle('Sort ascending');
      expect(orderButton).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Label Display', () => {
    it('shows label when showLabel is true', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
          showLabel={true}
        />
      );

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
          showLabel={false}
        />
      );

      expect(screen.queryByText('Sort by:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button titles', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByTitle('Sort ascending')).toBeInTheDocument();
      expect(screen.getByTitle('Sort descending')).toBeInTheDocument();
    });

    it('has proper select labeling', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      expect(fieldSelect).toBeInTheDocument();
    });
  });

  describe('Field Options', () => {
    it('has correct field labels', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      const options = Array.from(fieldSelect.querySelectorAll('option'));
      
      expect(options[0]).toHaveTextContent('Due Date');
      expect(options[1]).toHaveTextContent('Created Date');
      expect(options[2]).toHaveTextContent('Title');
      expect(options[3]).toHaveTextContent('Points');
      expect(options[4]).toHaveTextContent('Status');
    });

    it('has correct field values', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      const options = Array.from(fieldSelect.querySelectorAll('option'));
      
      expect(options[0]).toHaveValue('dueDate');
      expect(options[1]).toHaveValue('createdAt');
      expect(options[2]).toHaveValue('title');
      expect(options[3]).toHaveValue('maxScore');
      expect(options[4]).toHaveValue('status');
    });
  });

  describe('Order Toggle', () => {
    it('toggles between ascending and descending', async () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const orderButton = screen.getByTitle('Sort ascending');
      
      // Initially ascending
      expect(orderButton).toHaveClass('bg-blue-600', 'text-white');
      
      // Click to toggle to descending
      await userEvent.click(orderButton);
      expect(mockOnSortChange).toHaveBeenCalledWith({ order: 'desc' });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined sort gracefully', () => {
      render(
        <AssignmentSort
          sort={{} as AssignmentSortState}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();
    });

    it('handles missing field gracefully', () => {
      const incompleteSort = { order: 'asc' as const };

      render(
        <AssignmentSort
          sort={incompleteSort as AssignmentSortState}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();
    });

    it('handles missing order gracefully', () => {
      const incompleteSort = { field: 'dueDate' as const };

      render(
        <AssignmentSort
          sort={incompleteSort as AssignmentSortState}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('has proper spacing between elements', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const container = screen.getByDisplayValue('Due Date').closest('div')?.parentElement;
      expect(container).toHaveClass('space-x-3');
    });

    it('has proper button styling', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const ascendingButton = screen.getByTitle('Sort ascending');
      expect(ascendingButton).toHaveClass('px-3', 'py-2', 'text-sm', 'font-medium');
    });

    it('has proper select styling', () => {
      render(
        <AssignmentSort
          sort={mockSort}
          onSortChange={mockOnSortChange}
        />
      );

      const fieldSelect = screen.getByDisplayValue('Due Date');
      expect(fieldSelect).toHaveClass('px-3', 'py-2', 'border', 'rounded-md');
    });
  });
});






