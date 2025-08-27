import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstructorDashboard from '../InstructorDashboard';

// Mock the child components
jest.mock('../AssignmentCreationForm', () => {
  return function MockAssignmentCreationForm({ onSubmit, onCancel, isLoading }: any) {
    return (
      <div data-testid="assignment-creation-form">
        <h2>Create New Assignment</h2>
        <button onClick={() => onSubmit({ title: 'Test Assignment' })} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Assignment'}
        </button>
        <button onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
      </div>
    );
  };
});

jest.mock('../InstructorStats', () => {
  return function MockInstructorStats() {
    return <div data-testid="instructor-stats">Instructor Stats</div>;
  };
});

jest.mock('../InstructorSubmissionCard', () => {
  return function MockInstructorSubmissionCard({ submission, onGrade, onView }: any) {
    return (
      <div data-testid="instructor-submission-card">
        <div>Submission: {submission.studentName}</div>
        <button onClick={() => onGrade(submission.id)}>Grade</button>
        <button onClick={() => onView(submission.id)}>View</button>
      </div>
    );
  };
});

jest.mock('../InstructorCommunityFeed', () => {
  return function MockInstructorCommunityFeed() {
    return <div data-testid="instructor-community-feed">Community Feed</div>;
  };
});

describe('InstructorDashboard', () => {
  const defaultProps = {
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dashboard header correctly', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your courses, assignments, and student submissions')).toBeInTheDocument();
    });

    it('renders navigation tabs correctly', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('📊 Overview')).toBeInTheDocument();
      expect(screen.getByText('📝 Assignments')).toBeInTheDocument();
      expect(screen.getByText('📤 Submissions')).toBeInTheDocument();
      expect(screen.getByText('👥 Community')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<InstructorDashboard {...defaultProps} className="custom-class" />);
      
      const dashboardContainer = screen.getByText('Instructor Dashboard').closest('div');
      expect(dashboardContainer?.parentElement).toHaveClass('custom-class');
    });

    it('shows overview view by default', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByTestId('instructor-stats')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('switches to assignments view when assignments tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      expect(screen.getByText('Assignments')).toBeInTheDocument();
      expect(screen.getByText('Essay Assignment')).toBeInTheDocument();
      expect(screen.getByText('Project Report')).toBeInTheDocument();
      expect(screen.getByText('Quiz 3')).toBeInTheDocument();
    });

    it('switches to submissions view when submissions tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const submissionsTab = screen.getByText('📤 Submissions');
      await user.click(submissionsTab);

      expect(screen.getByText('Submissions')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('switches to community view when community tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const communityTab = screen.getByText('👥 Community');
      await user.click(communityTab);

      expect(screen.getByTestId('instructor-community-feed')).toBeInTheDocument();
    });

    it('returns to overview view when overview tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // First switch to another view
      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      // Then return to overview
      const overviewTab = screen.getByText('📊 Overview');
      await user.click(overviewTab);

      expect(screen.getByTestId('instructor-stats')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('highlights active tab correctly', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // Overview should be active by default
      const overviewTab = screen.getByText('📊 Overview').closest('button');
      expect(overviewTab).toHaveClass('border-blue-500', 'text-blue-600');

      // Click assignments tab
      const assignmentsTab = screen.getByText('📝 Assignments').closest('button');
      await user.click(assignmentsTab!);

      // Assignments should now be active
      expect(assignmentsTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(overviewTab).toHaveClass('border-transparent', 'text-gray-500');
    });
  });

  describe('Assignment Creation Modal', () => {
    it('shows assignment creation form when create assignment button is clicked from overview', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      expect(screen.getByTestId('assignment-creation-form')).toBeInTheDocument();
      expect(screen.getByText('Create New Assignment')).toBeInTheDocument();
    });

    it('shows assignment creation form when create assignment button is clicked from assignments view', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // Switch to assignments view
      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      expect(screen.getByTestId('assignment-creation-form')).toBeInTheDocument();
    });

    it('closes assignment creation form when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // Open the form
      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      expect(screen.getByTestId('assignment-creation-form')).toBeInTheDocument();

      // Close the form
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByTestId('assignment-creation-form')).not.toBeInTheDocument();
    });

    it('handles assignment creation successfully', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // Open the form
      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      // Submit the form
      const submitButton = screen.getByText('Create Assignment');
      await user.click(submitButton);

      // Wait for the form to close
      await waitFor(() => {
        expect(screen.queryByTestId('assignment-creation-form')).not.toBeInTheDocument();
      });
    });

    it('shows loading state during assignment creation', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      // Open the form
      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      // Submit the form
      const submitButton = screen.getByText('Create Assignment');
      await user.click(submitButton);

      // The form should show loading state briefly before closing
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Overview View', () => {
    it('displays instructor stats', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByTestId('instructor-stats')).toBeInTheDocument();
    });

    it('displays recent activity', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New submission received for "Essay Assignment"')).toBeInTheDocument();
      expect(screen.getByText('Assignment "Quiz 3" published')).toBeInTheDocument();
      expect(screen.getByText('Grade submitted for "Project Report"')).toBeInTheDocument();
    });

    it('displays quick actions', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Assignment')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
    });

    it('opens assignment creation form from quick actions', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const quickActionButton = screen.getByText('Create Assignment').closest('button');
      await user.click(quickActionButton!);

      expect(screen.getByTestId('assignment-creation-form')).toBeInTheDocument();
    });
  });

  describe('Assignments View', () => {
    it('displays assignments list', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      expect(screen.getByText('Essay Assignment')).toBeInTheDocument();
      expect(screen.getByText('Project Report')).toBeInTheDocument();
      expect(screen.getByText('Quiz 3')).toBeInTheDocument();
    });

    it('shows assignment status badges', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('displays assignment details', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      expect(screen.getByText('Write a 1000-word essay on modern technology trends.')).toBeInTheDocument();
      expect(screen.getByText('Due: Dec 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Max Score: 100')).toBeInTheDocument();
      expect(screen.getByText('Submissions: 12/25')).toBeInTheDocument();
    });

    it('shows action buttons for each assignment', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const assignmentsTab = screen.getByText('📝 Assignments');
      await user.click(assignmentsTab);

      // Check for action buttons
      expect(screen.getAllByText('Edit')).toHaveLength(3);
      expect(screen.getAllByText('View')).toHaveLength(2);
      expect(screen.getByText('Publish')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
    });
  });

  describe('Submissions View', () => {
    it('displays submissions list', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const submissionsTab = screen.getByText('📤 Submissions');
      await user.click(submissionsTab);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows submission filters', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const submissionsTab = screen.getByText('📤 Submissions');
      await user.click(submissionsTab);

      expect(screen.getByDisplayValue('All Assignments')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });

    it('displays submission cards with actions', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const submissionsTab = screen.getByText('📤 Submissions');
      await user.click(submissionsTab);

      expect(screen.getAllByTestId('instructor-submission-card')).toHaveLength(2);
      expect(screen.getAllByText('Grade')).toHaveLength(2);
      expect(screen.getAllByText('View')).toHaveLength(2);
    });

    it('handles submission actions', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<InstructorDashboard {...defaultProps} />);

      const submissionsTab = screen.getByText('📤 Submissions');
      await user.click(submissionsTab);

      const gradeButtons = screen.getAllByText('Grade');
      await user.click(gradeButtons[0]);

      expect(consoleSpy).toHaveBeenCalledWith('Grade submission');

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(consoleSpy).toHaveBeenCalledWith('View submission');

      consoleSpy.mockRestore();
    });
  });

  describe('Community View', () => {
    it('displays community feed component', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const communityTab = screen.getByText('👥 Community');
      await user.click(communityTab);

      expect(screen.getByTestId('instructor-community-feed')).toBeInTheDocument();
    });
  });

  describe('Header Actions', () => {
    it('displays notification bell icon', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });

    it('displays instructor avatar', () => {
      render(<InstructorDashboard {...defaultProps} />);

      expect(screen.getByText('I')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders navigation tabs in a horizontal layout', () => {
      render(<InstructorDashboard {...defaultProps} />);

      const nav = screen.getByText('📊 Overview').closest('nav');
      expect(nav).toHaveClass('flex', 'space-x-8');
    });

    it('renders main content with proper max width and padding', () => {
      render(<InstructorDashboard {...defaultProps} />);

      const mainContent = screen.getByText('📊 Overview').closest('div')?.parentElement;
      expect(mainContent).toHaveClass('max-w-7xl', 'mx-auto', 'px-4');
    });
  });

  describe('Modal Behavior', () => {
    it('renders modal with proper backdrop', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      const modal = screen.getByTestId('assignment-creation-form').closest('div')?.parentElement;
      expect(modal).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
    });

    it('modal has proper z-index', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      const modal = screen.getByTestId('assignment-creation-form').closest('div')?.parentElement;
      expect(modal).toHaveClass('z-50');
    });

    it('modal has proper sizing and scrolling', async () => {
      const user = userEvent.setup();
      render(<InstructorDashboard {...defaultProps} />);

      const createButton = screen.getByText('Create Assignment');
      await user.click(createButton);

      const modalContent = screen.getByTestId('assignment-creation-form').closest('div');
      expect(modalContent).toHaveClass('max-w-4xl', 'w-full', 'max-h-[90vh]', 'overflow-y-auto');
    });
  });
});
