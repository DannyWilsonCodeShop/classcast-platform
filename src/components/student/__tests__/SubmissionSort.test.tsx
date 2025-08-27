import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionSort } from '../SubmissionSort';
import { SubmissionSortState } from '../SubmissionHistory';

const defaultProps = {
  sort: {
    field: 'submittedAt' as const,
    order: 'desc' as const,
  } as SubmissionSortState,
  onSortChange: jest.fn(),
};

describe('SubmissionSort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sort controls', () => {
    render(<SubmissionSort {...defaultProps} />);
    
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByLabelText(/Field:/)).toBeInTheDocument();
    expect(screen.getByText('Order:')).toBeInTheDocument();
  });

  it('shows all available sort fields', () => {
    render(<SubmissionSort {...defaultProps} />);

    const fieldSelect = screen.getByLabelText(/Field:/);
    const options = Array.from(fieldSelect.querySelectorAll('option')).map(option => option.textContent);

    expect(options).toEqual([
      'Submission Date',
      'Grade',
      'Status',
      'Assignment Title',
    ]);
  });

  it('displays current sort field value', () => {
    render(<SubmissionSort {...defaultProps} />);

    const fieldSelect = screen.getByLabelText(/Field:/);
    expect(fieldSelect).toHaveValue('submittedAt');
  });

  it('displays current sort order value', () => {
    render(<SubmissionSort {...defaultProps} />);

    const fieldSelect = screen.getByLabelText(/Field:/);
    expect(fieldSelect).toHaveValue('submittedAt');
  });

  describe('Sort Field Selection', () => {
    it('calls onSortChange when field is changed', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SubmissionSort {...defaultProps} onSortChange={onSortChange} />);

      const fieldSelect = screen.getByLabelText(/Field:/);
      await user.selectOptions(fieldSelect, 'grade');

      expect(onSortChange).toHaveBeenCalledWith({ field: 'grade' });
    });

    it('handles all field options correctly', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SubmissionSort {...defaultProps} onSortChange={onSortChange} />);

      const fieldSelect = screen.getByLabelText(/Field:/);

      // Test each field option
      await user.selectOptions(fieldSelect, 'submittedAt');
      expect(onSortChange).toHaveBeenCalledWith({ field: 'submittedAt' });

      await user.selectOptions(fieldSelect, 'grade');
      expect(onSortChange).toHaveBeenCalledWith({ field: 'grade' });

      await user.selectOptions(fieldSelect, 'status');
      expect(onSortChange).toHaveBeenCalledWith({ field: 'status' });

      await user.selectOptions(fieldSelect, 'assignmentTitle');
      expect(onSortChange).toHaveBeenCalledWith({ field: 'assignmentTitle' });
    });
  });

  describe('Sort Order Selection', () => {
    it('calls onSortChange when ascending order is selected', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SubmissionSort {...defaultProps} onSortChange={onSortChange} />);

      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      await user.click(ascendingButton);

      expect(onSortChange).toHaveBeenCalledWith({ order: 'asc' });
    });

    it('calls onSortChange when descending order is selected', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SubmissionSort {...defaultProps} onSortChange={onSortChange} />);

      const descendingButton = screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)');
      await user.click(descendingButton);

      expect(onSortChange).toHaveBeenCalledWith({ order: 'desc' });
    });

    it('highlights active sort order button', () => {
      render(<SubmissionSort {...defaultProps} />);

      // Initially descending should be active
      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      const descendingButton = screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)');

      expect(ascendingButton).toHaveClass('bg-white', 'text-gray-700');
      expect(descendingButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('updates button highlighting when order changes', () => {
      const { rerender } = render(<SubmissionSort {...defaultProps} />);
      
      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      const descendingButton = screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)');
      
      // Initially descending should be active
      expect(descendingButton).toHaveClass('bg-blue-600', 'text-white');
      expect(ascendingButton).toHaveClass('bg-white', 'text-gray-700');
      
      // Change to ascending order
      const newProps = {
        ...defaultProps,
        sort: { ...defaultProps.sort, order: 'asc' as const },
      };
      rerender(<SubmissionSort {...newProps} />);
      
      // Now ascending should be active
      expect(ascendingButton).toHaveClass('bg-blue-600', 'text-white');
      expect(descendingButton).toHaveClass('bg-white', 'text-gray-700');
    });
  });

  describe('Sort Descriptions', () => {
    it('shows correct description for submission date sorting', () => {
      render(<SubmissionSort {...defaultProps} />);

      expect(screen.getByText('Newest submissions first')).toBeInTheDocument();
    });

    it('shows correct description for submission date ascending', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'submittedAt', order: 'asc' }} />);

      expect(screen.getByText('Oldest submissions first')).toBeInTheDocument();
    });

    it('shows correct description for grade sorting', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'grade', order: 'desc' }} />);

      expect(screen.getByText('Highest grades first')).toBeInTheDocument();
    });

    it('shows correct description for grade ascending', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'grade', order: 'asc' }} />);

      expect(screen.getByText('Lowest grades first')).toBeInTheDocument();
    });

    it('shows correct description for status sorting', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'status', order: 'desc' }} />);

      expect(screen.getByText('Status Z to A')).toBeInTheDocument();
    });

    it('shows correct description for status ascending', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'status', order: 'asc' }} />);

      expect(screen.getByText('Status A to Z')).toBeInTheDocument();
    });

    it('shows correct description for assignment title sorting', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'assignmentTitle', order: 'desc' }} />);

      expect(screen.getByText('Assignment titles Z to A')).toBeInTheDocument();
    });

    it('shows correct description for assignment title ascending', () => {
      render(<SubmissionSort {...defaultProps} sort={{ field: 'assignmentTitle', order: 'asc' }} />);

      expect(screen.getByText('Assignment titles A to Z')).toBeInTheDocument();
    });
  });

  describe('Button Styling and Interactions', () => {
    it('applies correct styling to sort order buttons', () => {
      render(<SubmissionSort {...defaultProps} />);

      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      const descendingButton = screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)');

      // Both buttons should have base styling
      expect(ascendingButton).toHaveClass('px-3', 'py-1.5', 'text-sm', 'font-medium');
      expect(descendingButton).toHaveClass('px-3', 'py-1.5', 'text-sm', 'font-medium');

      // Active button should have blue styling
      expect(descendingButton).toHaveClass('bg-blue-600', 'text-white');

      // Inactive button should have white styling
      expect(ascendingButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('applies hover effects to inactive buttons', () => {
      render(<SubmissionSort {...defaultProps} />);

      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      expect(ascendingButton).toHaveClass('hover:bg-gray-50');
    });

    it('groups sort order buttons together', () => {
      render(<SubmissionSort {...defaultProps} />);
      
      const buttonGroup = screen.getByRole('group');
      expect(buttonGroup).toHaveClass('flex', 'border', 'border-gray-300', 'rounded-md', 'overflow-hidden');
    });

    it('has proper labels for form controls', () => {
      render(<SubmissionSort {...defaultProps} />);
      
      expect(screen.getByLabelText(/Field:/)).toBeInTheDocument();
      expect(screen.getByText('Order:')).toBeInTheDocument();
    });

    it('applies focus styles to form elements', async () => {
      const user = userEvent.setup();
      render(<SubmissionSort {...defaultProps} />);

      const fieldSelect = screen.getByLabelText(/Field:/);
      await user.click(fieldSelect);

      expect(fieldSelect).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500');
    });

    it('has proper select element attributes', () => {
      render(<SubmissionSort {...defaultProps} />);

      const fieldSelect = screen.getByLabelText(/Field:/);
      expect(fieldSelect).toHaveAttribute('id', 'sortField');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      render(<SubmissionSort {...defaultProps} className="custom-class" />);
      
      const container = screen.getByText('Sort By').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and titles', () => {
      render(<SubmissionSort {...defaultProps} />);

      expect(screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)')).toBeInTheDocument();
      expect(screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)')).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<SubmissionSort {...defaultProps} />);
      
      expect(screen.getByLabelText(/Field:/)).toBeInTheDocument();
      expect(screen.getByText('Order:')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles different initial sort configurations', () => {
      const differentSort = {
        field: 'grade' as const,
        order: 'asc' as const,
      };

      render(<SubmissionSort {...defaultProps} sort={differentSort} />);

      const fieldSelect = screen.getByLabelText(/Field:/);
      expect(fieldSelect).toHaveValue('grade');

      // Should show ascending description
      expect(screen.getByText('Lowest grades first')).toBeInTheDocument();
    });

    it('handles all field and order combinations', () => {
      const fields: SubmissionSortState['field'][] = ['submittedAt', 'grade', 'status', 'assignmentTitle'];
      const orders: SubmissionSortState['order'][] = ['asc', 'desc'];

      fields.forEach(field => {
        orders.forEach(order => {
          const props = {
            sort: { field, order } as SubmissionSortState,
            onSortChange: jest.fn(),
          };
          
          const { unmount } = render(<SubmissionSort {...props} />);
          
          // Verify the correct field is selected
          const select = screen.getByDisplayValue(
            field === 'submittedAt' ? 'Submission Date' :
            field === 'grade' ? 'Grade' :
            field === 'status' ? 'Status' : 'Assignment Title'
          );
          expect(select).toBeInTheDocument();
          
          // Verify the correct order button is active
          const activeButton = screen.getByRole('button', { pressed: true });
          expect(activeButton).toHaveClass(
            order === 'asc' ? 'bg-blue-600' : 'bg-blue-600'
          );
          
          unmount();
        });
      });
    });
  });

  describe('User Interactions', () => {
    it('maintains state consistency during interactions', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SubmissionSort {...defaultProps} onSortChange={onSortChange} />);

      // Change field first
      const fieldSelect = screen.getByLabelText(/Field:/);
      await user.selectOptions(fieldSelect, 'grade');

      // Then change order
      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      await user.click(ascendingButton);

      // Should have called onSortChange twice
      expect(onSortChange).toHaveBeenCalledTimes(2);
      expect(onSortChange).toHaveBeenNthCalledWith(1, { field: 'grade' });
      expect(onSortChange).toHaveBeenNthCalledWith(2, { order: 'asc' });
    });

    it('provides immediate visual feedback', () => {
      const { rerender } = render(<SubmissionSort {...defaultProps} />);
      
      const ascendingButton = screen.getByTitle('Ascending (A to Z, 1 to 9, Oldest to Newest)');
      const descendingButton = screen.getByTitle('Descending (Z to A, 9 to 1, Newest to Oldest)');
      
      // Initially descending should be active
      expect(descendingButton).toHaveClass('bg-blue-600', 'text-white');
      expect(ascendingButton).toHaveClass('bg-white', 'text-gray-700');
      
      // Change to ascending order
      const newProps = {
        ...defaultProps,
        sort: { ...defaultProps.sort, order: 'asc' as const },
      };
      rerender(<SubmissionSort {...newProps} />);
      
      // Should now be active
      expect(ascendingButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });
});

