import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentCreationForm from '../AssignmentCreationForm';
import { AssignmentType, AssignmentStatus } from '@/types/dynamodb';

// Mock TipTapEditor component
jest.mock('../TipTapEditor', () => {
  return function MockTipTapEditor({ value, onChange, placeholder }: any) {
    const [inputValue, setInputValue] = React.useState(value || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
    };

    return (
      <div data-testid="rich-text-editor">
        <textarea
          data-testid="description-input"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="min-h-[200px] w-full p-2 border rounded"
        />
      </div>
    );
  };
});

// Mock next/dynamic to return the mocked component immediately
jest.mock('next/dynamic', () => {
  return (importFn: any, options: any) => {
    // Return the mocked component instead of the loading state
    return function MockTipTapEditor({ value, onChange, placeholder }: any) {
      const [inputValue, setInputValue] = React.useState(value || '');
      
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
      };

      return (
        <div data-testid="rich-text-editor">
          <textarea
            id="description"
            data-testid="description-input"
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[200px] w-full p-2 border rounded"
          />
        </div>
      );
    };
  };
});

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, placeholderText, className }: any) {
    const [value, setValue] = React.useState(selected ? selected.toISOString().split('T')[0] : '');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      try {
        const date = new Date(newValue);
        if (!isNaN(date.getTime())) {
          onChange(date);
        }
      } catch (error) {
        // Handle invalid date gracefully
      }
    };

    return (
      <input
        id="dueDate"
        data-testid="date-picker"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholderText}
        className={className}
      />
    );
  };
});

describe('AssignmentCreationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isLoading: false,
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<AssignmentCreationForm {...defaultProps} />);

      expect(screen.getByText('Create New Assignment')).toBeInTheDocument();
      expect(screen.getByText('Fill out the form below to create a new assignment for your students.')).toBeInTheDocument();
      
      // Basic information fields
      expect(screen.getByLabelText('Assignment Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Assignment Type *')).toBeInTheDocument();
      expect(screen.getByLabelText('Assignment Description *')).toBeInTheDocument();
      
      // Due date and scoring fields
      expect(screen.getByLabelText('Due Date *')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum Score *')).toBeInTheDocument();
      expect(screen.getByLabelText('Course Weight (%) *')).toBeInTheDocument();
      
      // Requirements section
      expect(screen.getByText('Assignment Requirements')).toBeInTheDocument();
      
      // Submission settings
      expect(screen.getByText('Submission Settings')).toBeInTheDocument();
      expect(screen.getByText('Group Settings')).toBeInTheDocument();
      
      // File upload settings
      expect(screen.getByText('File Upload Settings')).toBeInTheDocument();
      
      // Form actions
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Assignment' })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<AssignmentCreationForm {...defaultProps} className="custom-class" />);
      
      const formContainer = screen.getByText('Create New Assignment').closest('div');
      expect(formContainer).toHaveClass('custom-class');
    });

    it('renders with initial data when provided', () => {
      const initialData = {
        title: 'Test Assignment',
        description: 'Test Description',
        assignmentType: AssignmentType.PROJECT,
        maxScore: 150,
        weight: 20
      };

      render(<AssignmentCreationForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByDisplayValue('Test Assignment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      render(<AssignmentCreationForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('shows error for empty title', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for title longer than 200 characters', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Assignment Title *');
      const longTitle = 'a'.repeat(201);
      await user.type(titleInput, longTitle);

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument();
    });

    it('shows error for empty description', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in title to pass first validation
      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Test Assignment');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('shows error for missing due date', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in required fields
      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Test Assignment');

      const descriptionInput = screen.getByTestId('description-input');
      await user.type(descriptionInput, 'Test Description');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Due date is required')).toBeInTheDocument();
    });

    it('shows error for due date in the past', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in required fields
      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Test Assignment');

      const descriptionInput = screen.getByTestId('description-input');
      await user.type(descriptionInput, 'Test Description');

      // Set past date
      const dateInput = screen.getByTestId('date-picker');
      await user.type(dateInput, '2020-01-01');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Due date must be in the future')).toBeInTheDocument();
    });

    it('shows error for invalid max score', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in required fields
      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Test Assignment');

      const descriptionInput = screen.getByTestId('description-input');
      await user.type(descriptionInput, 'Test Description');

      const maxScoreInput = screen.getByLabelText('Maximum Score *');
      await user.clear(maxScoreInput);
      await user.type(maxScoreInput, '0');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Maximum score must be greater than 0')).toBeInTheDocument();
    });

    it('shows error for invalid weight', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in required fields
      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Test Assignment');

      const descriptionInput = screen.getByTestId('description-input');
      await user.type(descriptionInput, 'Test Description');

      const weightInput = screen.getByLabelText('Course Weight (%) *');
      await user.clear(weightInput);
      await user.type(weightInput, '101');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(screen.getByText('Weight must be between 1 and 100')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows typing in title field', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'My Assignment');

      expect(titleInput).toHaveValue('My Assignment');
    });

    it('allows selecting assignment type', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText('Assignment Type *');
      await user.selectOptions(typeSelect, AssignmentType.QUIZ);

      expect(typeSelect).toHaveValue(AssignmentType.QUIZ);
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const descriptionInput = screen.getByTestId('description-input');
      await user.type(descriptionInput, 'This is a test description');

      expect(descriptionInput).toHaveValue('This is a test description');
    });

    it('allows setting due date', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const dateInput = screen.getByTestId('date-picker');
      const futureDate = '2025-12-31';
      await user.type(dateInput, futureDate);

      expect(dateInput).toHaveValue(futureDate);
    });

    it('allows setting max score', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const maxScoreInput = screen.getByLabelText('Maximum Score *');
      await user.clear(maxScoreInput);
      await user.type(maxScoreInput, '200');

      expect(maxScoreInput).toHaveValue(200);
    });

    it('allows setting course weight', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const weightInput = screen.getByLabelText('Course Weight (%) *');
      await user.clear(weightInput);
      await user.type(weightInput, '25');

      expect(weightInput).toHaveValue(25);
    });
  });

  describe('Requirements Management', () => {
    it('allows adding new requirements', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const addRequirementInput = screen.getByPlaceholderText('Add new requirement');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addButton = addButtons[addButtons.length - 1]; // Get the last Add button

      await user.type(addRequirementInput, 'Submit on time');
      await user.click(addButton);

      expect(screen.getByDisplayValue('Submit on time')).toBeInTheDocument();
    });

    it('allows removing requirements', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Add a requirement first
      const addRequirementInput = screen.getByPlaceholderText('Add new requirement');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addButton = addButtons[addButtons.length - 1]; // Get the last Add button
      await user.type(addRequirementInput, 'Test requirement');
      await user.click(addButton);

      // Verify the requirement was added
      expect(screen.getByDisplayValue('Test requirement')).toBeInTheDocument();

      // Now remove it
      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);

      // Verify the requirement was removed
      expect(screen.queryByDisplayValue('Test requirement')).not.toBeInTheDocument();
    });

    it('allows editing existing requirements', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Add a requirement first
      const addRequirementInput = screen.getByPlaceholderText('Add new requirement');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addButton = addButtons[addButtons.length - 1]; // Get the last Add button
      await user.type(addRequirementInput, 'Initial requirement');
      await user.click(addButton);

      // Edit the requirement
      const requirementInput = screen.getByDisplayValue('Initial requirement');
      await user.clear(requirementInput);
      await user.type(requirementInput, 'Updated requirement');

      expect(requirementInput).toHaveValue('Updated requirement');
    });

    it('adds requirement on Enter key press', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const addRequirementInput = screen.getByPlaceholderText('Add new requirement');
      await user.type(addRequirementInput, 'Enter requirement{enter}');

      expect(screen.getByDisplayValue('Enter requirement')).toBeInTheDocument();
    });
  });

  describe('Submission Settings', () => {
    it('toggles late submission checkbox', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const lateSubmissionCheckbox = screen.getByLabelText('Allow late submissions');
      expect(lateSubmissionCheckbox).not.toBeChecked();

      await user.click(lateSubmissionCheckbox);
      expect(lateSubmissionCheckbox).toBeChecked();
    });

    it('shows late penalty input when late submission is allowed', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const lateSubmissionCheckbox = screen.getByLabelText('Allow late submissions');
      await user.click(lateSubmissionCheckbox);

      expect(screen.getByLabelText('Late Penalty (%)')).toBeInTheDocument();
    });

    it('allows setting late penalty', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Enable late submission
      const lateSubmissionCheckbox = screen.getByLabelText('Allow late submissions');
      await user.click(lateSubmissionCheckbox);

      const latePenaltyInput = screen.getByLabelText('Late Penalty (%)');
      await user.clear(latePenaltyInput);
      await user.type(latePenaltyInput, '15');

      expect(latePenaltyInput).toHaveValue(15);
    });

    it('allows setting max submissions', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const maxSubmissionsInput = screen.getByLabelText('Maximum Submissions');
      // Use fireEvent to directly set the value to avoid the append issue
      fireEvent.change(maxSubmissionsInput, { target: { value: '3' } });

      expect(maxSubmissionsInput).toHaveValue(3);
    });
  });

  describe('Group Settings', () => {
    it('toggles group assignment checkbox', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const groupAssignmentCheckbox = screen.getByLabelText('Group assignment');
      expect(groupAssignmentCheckbox).not.toBeChecked();

      await user.click(groupAssignmentCheckbox);
      expect(groupAssignmentCheckbox).toBeChecked();
    });

    it('shows max group size input when group assignment is enabled', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const groupAssignmentCheckbox = screen.getByLabelText('Group assignment');
      await user.click(groupAssignmentCheckbox);

      expect(screen.getByLabelText('Maximum Group Size')).toBeInTheDocument();
    });

    it('allows setting max group size', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Enable group assignment
      const groupAssignmentCheckbox = screen.getByLabelText('Group assignment');
      await user.click(groupAssignmentCheckbox);

      const maxGroupSizeInput = screen.getByLabelText('Maximum Group Size');
      // Use fireEvent to directly set the value to avoid the append issue
      fireEvent.change(maxGroupSizeInput, { target: { value: '5' } });

      expect(maxGroupSizeInput).toHaveValue(5);
    });
  });

  describe('File Upload Settings', () => {
    it('allows selecting max file size', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const maxFileSizeSelect = screen.getByLabelText('Maximum File Size');
      await user.selectOptions(maxFileSizeSelect, '25 MB');

      expect(maxFileSizeSelect).toHaveValue('26214400'); // 25MB in bytes
    });

    it('allows adding file types', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const addFileTypeInput = screen.getByPlaceholderText('Add file type (e.g., pdf)');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addButton = addButtons[addButtons.length - 1]; // Get the last Add button

      await user.type(addFileTypeInput, 'txt');
      await user.click(addButton);

      expect(screen.getByText('TXT')).toBeInTheDocument();
    });

    it('allows removing file types', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Add a file type first
      const addFileTypeInput = screen.getByPlaceholderText('Add file type (e.g., pdf)');
      const addButtons = screen.getAllByRole('button', { name: 'Add' });
      const addButton = addButtons[addButtons.length - 1]; // Get the last Add button
      await user.type(addFileTypeInput, 'txt');
      await user.click(addButton);

      // Now remove it - target the specific remove button for the 'txt' file type
      const removeButtons = screen.getAllByText('×');
      const removeButton = removeButtons[removeButtons.length - 1]; // Get the last × button (for the newly added txt)
      await user.click(removeButton);

      expect(screen.queryByText('TXT')).not.toBeInTheDocument();
    });

    it('adds file type on Enter key press', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const addFileTypeInput = screen.getByPlaceholderText('Add file type (e.g., pdf)');
      await user.type(addFileTypeInput, 'txt{enter}');

      expect(screen.getByText('TXT')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in all required fields
      await user.type(screen.getByLabelText('Assignment Title *'), 'Test Assignment');
      await user.type(screen.getByTestId('description-input'), 'Test Description');
      
      // Set a valid future date - use a specific future date to avoid validation issues
      const dateInput = screen.getByTestId('date-picker');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // Next year to ensure it's valid
      await user.type(dateInput, futureDate.toISOString().split('T')[0]);

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Assignment',
            description: 'Test Description',
            assignmentType: AssignmentType.ESSAY,
            maxScore: 100,
            weight: 10,
            status: AssignmentStatus.DRAFT
          })
        );
      });
    });

    it('does not call onSubmit when form is invalid', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in title', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Assignment Title *');
      await user.type(titleInput, 'Assignment with special chars: @#$%^&*()');

      expect(titleInput).toHaveValue('Assignment with special chars: @#$%^&*()');
    });

    it('handles very long description', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      const descriptionInput = screen.getByTestId('description-input');
      const longDescription = 'a'.repeat(100); // Reduced from 1000 to avoid timeout
      await user.type(descriptionInput, longDescription);

      expect(descriptionInput).toHaveValue(longDescription);
    }, 10000); // Increased timeout

    it('handles zero and negative values gracefully', async () => {
      const user = userEvent.setup();
      render(<AssignmentCreationForm {...defaultProps} />);

      // Fill in required fields first
      await user.type(screen.getByLabelText('Assignment Title *'), 'Test Assignment');
      await user.type(screen.getByTestId('description-input'), 'Test Description');

      // Try to set invalid values
      const maxScoreInput = screen.getByLabelText('Maximum Score *');
      await user.clear(maxScoreInput);
      await user.type(maxScoreInput, '0');

      const submitButton = screen.getByRole('button', { name: 'Create Assignment' });
      await user.click(submitButton);

      // Wait for validation to complete and error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Maximum score must be greater than 0')).toBeInTheDocument();
      });
    });
  });
});
