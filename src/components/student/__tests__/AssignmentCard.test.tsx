import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssignmentCard } from '../AssignmentCard';
import { Assignment, AssignmentType, AssignmentStatus } from '@/types/dynamodb';

// Mock assignment data
const mockAssignment: Assignment = {
  assignmentId: 'assign_123',
  courseId: 'CS101',
  title: 'React Component Design',
  description: 'Create a reusable React component with proper TypeScript types and styling',
  assignmentType: AssignmentType.PROJECT,
  instructorId: 'instructor_456',
  status: AssignmentStatus.PUBLISHED,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  dueDate: '2024-12-20T23:59:59.000Z',
  maxScore: 100,
  weight: 15,
  requirements: [
    'Component must be reusable',
    'Include TypeScript interfaces',
    'Add proper error handling',
    'Include unit tests'
  ],
  allowedFileTypes: ['tsx', 'ts', 'css'],
  maxFileSize: 1048576, // 1MB
  maxSubmissions: 3,
  allowLateSubmission: true,
  latePenalty: 10,
  groupAssignment: false,
  maxGroupSize: 1,
};

const mockOverdueAssignment: Assignment = {
  ...mockAssignment,
  assignmentId: 'assign_124',
  title: 'Overdue Assignment',
  dueDate: '2024-12-10T23:59:59.000Z', // Past date
};

const mockDueTodayAssignment: Assignment = {
  ...mockAssignment,
  assignmentId: 'assign_125',
  title: 'Due Today Assignment',
  dueDate: new Date().toISOString(), // Today
};

const mockDueTomorrowAssignment: Assignment = {
  ...mockAssignment,
  assignmentId: 'assign_126',
  title: 'Due Tomorrow Assignment',
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
};

describe('AssignmentCard', () => {
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to be consistent in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-12-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Compact Mode', () => {
    it('renders compact assignment card correctly', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.getByText('React Component Design')).toBeInTheDocument();
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('100 pts')).toBeInTheDocument();
      expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
      expect(screen.getByText('💻 Project')).toBeInTheDocument();
    });

    it('does not show description in compact mode', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.queryByText('Create a reusable React component with proper TypeScript types and styling')).not.toBeInTheDocument();
    });
  });

  describe('Full Mode', () => {
    it('renders full assignment card correctly', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('React Component Design')).toBeInTheDocument();
      expect(screen.getByText('Create a reusable React component with proper TypeScript types and styling')).toBeInTheDocument();
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('100 pts')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows requirements when available', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('Requirements:')).toBeInTheDocument();
      expect(screen.getByText('Component must be reusable')).toBeInTheDocument();
      expect(screen.getByText('Include TypeScript interfaces')).toBeInTheDocument();
      expect(screen.getByText('+2 more requirements')).toBeInTheDocument();
    });

    it('shows submission details when available', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('Submission Details:')).toBeInTheDocument();
      expect(screen.getByText('Types: tsx, ts, css')).toBeInTheDocument();
      expect(screen.getByText('Max: 1.0 MB')).toBeInTheDocument();
    });

    it('shows View Details button', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      const viewButton = screen.getByText('View Details');
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('Due Date Formatting', () => {
    it('shows overdue message for past due dates', () => {
      render(
        <AssignmentCard
          assignment={mockOverdueAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.getByText('Due 5 days ago')).toBeInTheDocument();
    });

    it('shows due today message', () => {
      render(
        <AssignmentCard
          assignment={mockDueTodayAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.getByText('Due today')).toBeInTheDocument();
    });

    it('shows due tomorrow message', () => {
      render(
        <AssignmentCard
          assignment={mockDueTomorrowAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
    });

    it('shows due in X days for future dates', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={true}
        />
      );

      expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
    });
  });

  describe('Status and Type Display', () => {
    it('shows correct status badge', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('shows correct type badge with icon', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('💻 Project')).toBeInTheDocument();
    });

    it('handles different assignment types correctly', () => {
      const essayAssignment = { ...mockAssignment, assignmentType: AssignmentType.ESSAY };
      
      render(
        <AssignmentCard
          assignment={essayAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.getByText('📝 Essay')).toBeInTheDocument();
    });
  });

  describe('Course and Instructor Info', () => {
    it('shows course info when showCourseInfo is true', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          showCourseInfo={true}
          compact={false}
        />
      );

      expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('hides course info when showCourseInfo is false', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          showCourseInfo={false}
          compact={false}
        />
      );

      expect(screen.queryByText('CS101')).not.toBeInTheDocument();
    });

    it('shows instructor info when showInstructorInfo is true', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          showInstructorInfo={true}
          compact={false}
        />
      );

      expect(screen.getByText('instructor_456')).toBeInTheDocument();
    });

    it('hides instructor info when showInstructorInfo is false', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          showInstructorInfo={false}
          compact={false}
        />
      );

      expect(screen.queryByText('instructor_456')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('calls onViewDetails when View Details button is clicked', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      const viewButton = screen.getByText('View Details');
      fireEvent.click(viewButton);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles assignment without requirements', () => {
      const assignmentWithoutRequirements = { ...mockAssignment, requirements: [] };
      
      render(
        <AssignmentCard
          assignment={assignmentWithoutRequirements}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.queryByText('Requirements:')).not.toBeInTheDocument();
    });

    it('handles assignment without submission details', () => {
      const assignmentWithoutSubmissionDetails = {
        ...mockAssignment,
        allowedFileTypes: undefined,
        maxFileSize: undefined,
      };
      
      render(
        <AssignmentCard
          assignment={assignmentWithoutSubmissionDetails}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.queryByText('Submission Details:')).not.toBeInTheDocument();
    });

    it('handles assignment without weight', () => {
      const assignmentWithoutWeight = { ...mockAssignment, weight: undefined };
      
      render(
        <AssignmentCard
          assignment={assignmentWithoutWeight}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.queryByText('Weight:')).not.toBeInTheDocument();
    });

    it('handles assignment without maxSubmissions', () => {
      const assignmentWithoutMaxSubmissions = { ...mockAssignment, maxSubmissions: undefined };
      
      render(
        <AssignmentCard
          assignment={assignmentWithoutMaxSubmissions}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      expect(screen.queryByText('Submissions:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('React Component Design');
    });

    it('has proper button labeling', () => {
      render(
        <AssignmentCard
          assignment={mockAssignment}
          onViewDetails={mockOnViewDetails}
          compact={false}
        />
      );

      const viewButton = screen.getByRole('button', { name: 'View Details' });
      expect(viewButton).toBeInTheDocument();
    });
  });
});






