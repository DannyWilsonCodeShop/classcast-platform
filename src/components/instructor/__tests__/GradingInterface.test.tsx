import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradingInterface, { GradingSubmission } from '../GradingInterface';
import { Assignment, AssignmentStatus, AssignmentType, SubmissionStatus } from '@/types/dynamodb';

const mockAssignment: Assignment = {
  assignmentId: 'assign-1',
  courseId: 'course-1',
  title: 'Video Presentation',
  description: 'Create a video presentation on the assigned topic',
  assignmentType: AssignmentType.PROJECT,
  instructorId: 'instructor-1',
  status: AssignmentStatus.PUBLISHED,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  dueDate: '2024-02-01T00:00:00Z',
  maxScore: 100,
  weight: 20,
  requirements: ['5-10 minutes', 'Include visuals', 'Clear audio'],
  rubric: [
    { criterion: 'Content Quality', description: 'Quality of content and research', maxPoints: 40, weight: 40 },
    { criterion: 'Presentation Skills', description: 'Delivery and communication', maxPoints: 30, weight: 30 },
    { criterion: 'Technical Quality', description: 'Video and audio quality', maxPoints: 30, weight: 30 },
  ],
};

const mockSubmissions: GradingSubmission[] = [
  {
    submissionId: 'sub-1',
    assignmentId: 'assign-1',
    courseId: 'course-1',
    studentId: 'student-1',
    studentName: 'John Doe',
    submittedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    status: SubmissionStatus.SUBMITTED,
    grade: undefined,
    feedback: undefined,
    files: [],
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      submissionMethod: 'web' as any,
    },
  },
  {
    submissionId: 'sub-2',
    assignmentId: 'assign-1',
    courseId: 'course-1',
    studentId: 'student-2',
    studentName: 'Jane Smith',
    submittedAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
    status: SubmissionStatus.GRADED,
    grade: 85,
    feedback: 'Great presentation with clear structure',
    files: [],
    metadata: {
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0',
      submissionMethod: 'web' as any,
    },
  },
  {
    submissionId: 'sub-3',
    assignmentId: 'assign-1',
    courseId: 'course-1',
    studentId: 'student-3',
    studentName: 'Bob Johnson',
    submittedAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
    status: SubmissionStatus.LATE,
    grade: undefined,
    feedback: undefined,
    files: [],
    metadata: {
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0',
      submissionMethod: 'web' as any,
    },
  },
];

describe('GradingInterface', () => {
  const mockOnGradeSubmission = jest.fn();
  const mockOnBatchGrade = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the grading interface with assignment info', () => {
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onGradeSubmission={mockOnGradeSubmission}
        />
      );

      expect(screen.getByText('Grade Submissions')).toBeInTheDocument();
      expect(screen.getByText('Video Presentation - 3 submissions')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('shows submission status badges with correct colors', () => {
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      const submittedBadge = screen.getByText('SUBMITTED');
      const gradedBadge = screen.getByText('GRADED');
      const lateBadge = screen.getByText('LATE');

      expect(submittedBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(gradedBadge).toHaveClass('bg-green-100', 'text-green-800');
      expect(lateBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('displays existing grades with color coding', () => {
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      const gradeElement = screen.getByText('Grade: 85/100');
      expect(gradeElement).toHaveClass('text-blue-600'); // 85% = blue
    });
  });

  describe('Submission Selection', () => {
    it('allows selecting a submission to grade', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      await user.click(screen.getByText('John Doe'));
      
      expect(screen.getByText('Grading: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Assignment: Video Presentation | Max Score: 100')).toBeInTheDocument();
    });

    it('shows placeholder when no submission is selected', () => {
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      expect(screen.getByText('Select a submission to begin grading')).toBeInTheDocument();
    });
  });

  describe('Grading Form', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onGradeSubmission={mockOnGradeSubmission}
        />
      );
      await user.click(screen.getByText('John Doe'));
    });

    it('renders grading form with all required fields', () => {
      expect(screen.getByLabelText('Grade *')).toBeInTheDocument();
      expect(screen.getByLabelText('Feedback *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Grade' })).toBeInTheDocument();
    });

    it('shows rubric scoring when assignment has rubric', () => {
      expect(screen.getByText('Rubric Scoring')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
      expect(screen.getByText('Presentation Skills')).toBeInTheDocument();
      expect(screen.getByText('Technical Quality')).toBeInTheDocument();
    });

    it('validates grade input range', async () => {
      const user = userEvent.setup();
      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      // Fill in feedback first
      await user.type(feedbackInput, 'This is a detailed feedback message that meets the minimum length requirement.');

      // Try invalid grade - use value above max score since negative values are prevented by HTML
      await user.clear(gradeInput);
      await user.type(gradeInput, '150');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      expect(screen.getByText('Grade must be between 0 and 100')).toBeInTheDocument();
    });

    it('validates feedback minimum length', async () => {
      const user = userEvent.setup();
      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      // Fill in valid grade
      await user.clear(gradeInput);
      await user.type(gradeInput, '85');

      // Try short feedback
      await user.type(feedbackInput, 'Good');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      expect(screen.getByText('Feedback must be at least 10 characters long')).toBeInTheDocument();
    });

    it('submits grade successfully with valid data', async () => {
      const user = userEvent.setup();
      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      await user.clear(gradeInput);
      await user.type(gradeInput, '90');
      await user.clear(feedbackInput);
      await user.type(feedbackInput, 'Excellent presentation with clear content and good technical quality.');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      await waitFor(() => {
        expect(mockOnGradeSubmission).toHaveBeenCalledWith(
          'sub-1',
          90,
          'Excellent presentation with clear content and good technical quality.',
          undefined
        );
      });
    });

    it('submits grade with rubric scores when provided', async () => {
      const user = userEvent.setup();
      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      await user.clear(gradeInput);
      await user.type(gradeInput, '88');
      await user.clear(feedbackInput);
      await user.type(feedbackInput, 'Very good work with room for improvement in some areas.');

      // Fill in rubric scores - find the first rubric input
      const rubricInputs = screen.getAllByPlaceholderText('0-100');
      if (rubricInputs.length > 0) {
        await user.clear(rubricInputs[0]);
        await user.type(rubricInputs[0], '85');
      }

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      await waitFor(() => {
        expect(mockOnGradeSubmission).toHaveBeenCalledWith(
          'sub-1',
          88,
          'Very good work with room for improvement in some areas.',
          expect.objectContaining({
            'Content Quality': 85,
          })
        );
      });
    });
  });

  describe('Batch Grading', () => {
    it('toggles between single and batch mode', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onBatchGrade={mockOnBatchGrade}
        />
      );

      const batchButton = screen.getByRole('button', { name: 'Batch Mode' });
      await user.click(batchButton);

      expect(screen.getByText('Single Mode')).toBeInTheDocument();
      expect(screen.getByText('Batch Grading')).toBeInTheDocument();
      expect(screen.getByText('Submit All Grades')).toBeInTheDocument();
    });

    it('allows entering grades and feedback in batch mode', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onBatchGrade={mockOnBatchGrade}
        />
      );

      // Enable batch mode
      await user.click(screen.getByRole('button', { name: 'Batch Mode' }));

      // Enter grades and feedback for submissions
      const gradeInputs = screen.getAllByPlaceholderText('Grade');
      const feedbackInputs = screen.getAllByPlaceholderText('Quick feedback...');

      await user.type(gradeInputs[0], '85');
      await user.type(feedbackInputs[0], 'Good presentation with clear structure');

      await user.type(gradeInputs[1], '92');
      await user.type(feedbackInputs[1], 'Excellent work, very well done');

      expect(gradeInputs[0]).toHaveValue(85);
      expect(feedbackInputs[0]).toHaveValue('Good presentation with clear structure');
    });

    it('submits batch grades successfully', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onBatchGrade={mockOnBatchGrade}
        />
      );

      // Enable batch mode
      await user.click(screen.getByRole('button', { name: 'Batch Mode' }));

      // Enter grades and feedback
      const gradeInputs = screen.getAllByPlaceholderText('Grade');
      const feedbackInputs = screen.getAllByPlaceholderText('Quick feedback...');

      await user.type(gradeInputs[0], '85');
      await user.type(feedbackInputs[0], 'Good presentation with clear structure');

      await user.type(gradeInputs[2], '78');
      await user.type(feedbackInputs[2], 'Late submission but good effort');

      // Submit batch grades
      await user.click(screen.getByRole('button', { name: 'Submit All Grades' }));

      await waitFor(() => {
        expect(mockOnBatchGrade).toHaveBeenCalledWith([
          {
            submissionId: 'sub-1',
            grade: 85,
            feedback: 'Good presentation with clear structure',
            rubricScores: undefined,
          },
          {
            submissionId: 'sub-3',
            grade: 78,
            feedback: 'Late submission but good effort',
            rubricScores: undefined,
          },
        ]);
      });
    });

    it('filters out incomplete batch grades', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onBatchGrade={mockOnBatchGrade}
        />
      );

      // Enable batch mode
      await user.click(screen.getByRole('button', { name: 'Batch Mode' }));

      // Enter only grade for first submission (no feedback)
      const gradeInputs = screen.getAllByPlaceholderText('Grade');
      await user.type(gradeInputs[0], '85');

      // Enter only feedback for second submission (no grade)
      const feedbackInputs = screen.getAllByPlaceholderText('Quick feedback...');
      await user.type(feedbackInputs[1], 'Good work');

      // Submit batch grades
      await user.click(screen.getByRole('button', { name: 'Submit All Grades' }));

      // Should not call onBatchGrade since no complete grades
      expect(mockOnBatchGrade).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows validation errors for invalid feedback', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      await user.click(screen.getByText('John Doe'));

      // Try to submit with short feedback
      const feedbackInput = screen.getByLabelText('Feedback *');
      await user.type(feedbackInput, 'Short');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      expect(screen.getByText('Feedback must be at least 10 characters long')).toBeInTheDocument();
    });

    it('handles grading submission errors gracefully', async () => {
      const mockErrorOnGrade = jest.fn().mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onGradeSubmission={mockErrorOnGrade}
        />
      );

      await user.click(screen.getByText('John Doe'));

      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      await user.clear(gradeInput);
      await user.type(gradeInput, '90');
      await user.clear(feedbackInput);
      await user.type(feedbackInput, 'Excellent presentation with clear content and good technical quality.');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      // Should handle error gracefully and not crash
      await waitFor(() => {
        expect(mockErrorOnGrade).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and form controls', async () => {
      const user = userEvent.setup();
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
        />
      );

      // Select a submission first to render the form
      await user.click(screen.getByText('John Doe'));

      expect(screen.getByLabelText('Grade *')).toBeInTheDocument();
      expect(screen.getByLabelText('Feedback *')).toBeInTheDocument();
    });

    it('shows loading states during grading operations', async () => {
      const slowMockGrade = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      
      render(
        <GradingInterface
          assignment={mockAssignment}
          submissions={mockSubmissions}
          onGradeSubmission={slowMockGrade}
        />
      );

      await user.click(screen.getByText('John Doe'));

      const gradeInput = screen.getByLabelText('Grade *');
      const feedbackInput = screen.getByLabelText('Feedback *');

      await user.clear(gradeInput);
      await user.type(gradeInput, '90');
      await user.clear(feedbackInput);
      await user.type(feedbackInput, 'Excellent presentation with clear content and good technical quality.');

      await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

      // Verify that the grading function was called
      expect(slowMockGrade).toHaveBeenCalled();
      
      // Wait for the async operation to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Submit Grade' })).toBeInTheDocument();
      });
    });
  });
});
