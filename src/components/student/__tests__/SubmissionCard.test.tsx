import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionCard } from '../SubmissionCard';

// Mock the supporting components
jest.mock('../VideoPlayer', () => ({
  VideoPlayer: ({ videoUrl, onClose }: any) => (
    <div data-testid="video-player">
      <span>Video: {videoUrl}</span>
      <button onClick={onClose}>Close Video</button>
    </div>
  ),
}));

jest.mock('../GradeDisplay', () => ({
  GradeDisplay: ({ grade, maxScore, feedback, compact }: any) => (
    <div data-testid="grade-display">
      Grade: {grade}/{maxScore} - {feedback}
      {compact && <span data-testid="compact-mode">Compact</span>}
    </div>
  ),
}));

jest.mock('../FeedbackViewer', () => ({
  FeedbackViewer: ({ feedback, rubricScores, instructorNotes }: any) => (
    <div data-testid="feedback-viewer">
      <span>Feedback: {feedback}</span>
      {rubricScores && <span>Rubric Scores: {rubricScores.length}</span>}
      {instructorNotes && <span>Notes: {instructorNotes}</span>}
    </div>
  ),
}));

describe('SubmissionCard', () => {
  const mockSubmission = {
    submissionId: 'sub1',
    assignmentId: 'assign1',
    assignmentTitle: 'Introduction to Algorithms',
    courseId: 'CS101',
    courseName: 'Computer Science Fundamentals',
    studentId: 'student123',
    studentName: 'John Doe',
    status: 'graded',
    submittedAt: '2024-01-15T10:00:00Z',
    processedAt: '2024-01-16T14:30:00Z',
    grade: 85,
    maxScore: 100,
    feedback: 'Excellent work on the algorithm implementation!',
    videoUrl: 'https://example.com/video.mp4',
    videoUrlExpiry: '2024-01-16T15:00:00Z',
    thumbnailUrls: ['https://example.com/thumb1.jpg'],
    videoDuration: 180,
    videoResolution: { width: 1920, height: 1080 },
    processingDuration: 45,
    errorMessage: null,
    retryCount: 0,
    metadata: {
      submissionMethod: 'web',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      rubricScores: [
        { criterion: 'Algorithm Correctness', points: 40, maxPoints: 50 },
        { criterion: 'Code Quality', points: 35, maxPoints: 40 },
        { criterion: 'Documentation', points: 10, maxPoints: 10 },
      ],
      instructorNotes: 'Great attention to detail in the implementation.',
    },
    files: [
      {
        name: 'algorithm.py',
        url: 'https://example.com/files/algorithm.py',
        size: 2048,
        type: 'text/plain',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
      {
        name: 'presentation.mp4',
        url: 'https://example.com/files/presentation.mp4',
        size: 52428800,
        type: 'video/mp4',
        uploadedAt: '2024-01-15T10:00:00Z',
      },
    ],
  };

  it('renders basic submission information', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(screen.getByText(/Computer Science Fundamentals/)).toBeInTheDocument();
    expect(screen.getByText(/Course:/)).toBeInTheDocument();
    expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    expect(screen.getByText(/Processed:/)).toBeInTheDocument();
    expect(screen.getByText('graded')).toBeInTheDocument();
  });

  it('displays status badge with correct color', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    const statusBadge = screen.getByText('graded');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows different status colors for different statuses', () => {
    const { rerender } = render(<SubmissionCard submission={mockSubmission} />);
    
    // Graded status (green)
    expect(screen.getByText('graded')).toHaveClass('bg-green-100', 'text-green-800');

    // Submitted status (blue)
    rerender(<SubmissionCard submission={{ ...mockSubmission, status: 'submitted' }} />);
    expect(screen.getByText('submitted')).toHaveClass('bg-blue-100', 'text-blue-800');

    // Late status (yellow)
    rerender(<SubmissionCard submission={{ ...mockSubmission, status: 'late' }} />);
    expect(screen.getByText('late')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    // Returned status (red)
    rerender(<SubmissionCard submission={{ ...mockSubmission, status: 'returned' }} />);
    expect(screen.getByText('returned')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays grade and feedback when available', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    expect(screen.getByTestId('grade-display')).toBeInTheDocument();
    expect(screen.getByText('Grade: 85/100 - Excellent work on the algorithm implementation!')).toBeInTheDocument();
  });

  it('shows files section with correct information', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    expect(screen.getByText('Submitted Files')).toBeInTheDocument();
    expect(screen.getByText('algorithm.py')).toBeInTheDocument();
    expect(screen.getByText('presentation.mp4')).toBeInTheDocument();
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
    expect(screen.getByText(/50 MB/)).toBeInTheDocument();
  });

  it('distinguishes between video and non-video files', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    // Video file should have blue styling
    const videoFile = screen.getByText('presentation.mp4').closest('div')?.parentElement?.parentElement;
    expect(videoFile).toHaveClass('border-blue-200', 'hover:border-blue-300', 'hover:bg-blue-50');

    // Text file should have gray styling
    const textFile = screen.getByText('algorithm.py').closest('div')?.parentElement?.parentElement;
    expect(textFile).toHaveClass('border-gray-200', 'hover:border-gray-300', 'hover:bg-gray-50');
  });

  it('shows expand/collapse button for submissions with video files', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    const expandButton = screen.getByTitle('Expand');
    expect(expandButton).toBeInTheDocument();
  });

  it('does not show expand button for submissions without video files', () => {
    const submissionWithoutVideo = {
      ...mockSubmission,
      files: [{ ...mockSubmission.files[0] }], // Only text file
    };

    render(<SubmissionCard submission={submissionWithoutVideo} />);

    expect(screen.queryByTitle('Expand')).not.toBeInTheDocument();
  });

  it('expands and shows video player when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    expect(screen.getByText('Video Playback')).toBeInTheDocument();
    expect(screen.getByText('Select a video file to play')).toBeInTheDocument();
  });

  it('shows video player when video file is selected', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Expand the card
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // Click on video file
    const videoFile = screen.getByText('presentation.mp4');
    await user.click(videoFile);

    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    expect(screen.getByText('Video: https://example.com/files/presentation.mp4')).toBeInTheDocument();
  });

  it('collapses when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Expand the card
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // Verify expanded state
    expect(screen.getByText('Video Playback')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByTitle('Collapse');
    await user.click(collapseButton);

    // Verify collapsed state
    expect(screen.queryByText('Video Playback')).not.toBeInTheDocument();
  });

  it('shows feedback viewer when expanded and feedback exists', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Expand the card
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    expect(screen.getByTestId('feedback-viewer')).toBeInTheDocument();
    expect(screen.getByText('Feedback: Excellent work on the algorithm implementation!')).toBeInTheDocument();
    expect(screen.getByText('Rubric Scores: 3')).toBeInTheDocument();
    expect(screen.getByText('Notes: Great attention to detail in the implementation.')).toBeInTheDocument();
  });

  it('shows submission details when expanded', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Expand the card
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    expect(screen.getByText('Submission Details')).toBeInTheDocument();
    expect(screen.getByText(/Submission ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Assignment ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Course ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText(/Files:/)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const submissionWithMissingFields = {
      ...mockSubmission,
      processedAt: undefined,
      grade: undefined,
      maxScore: undefined,
      feedback: undefined,
      metadata: {
        ...mockSubmission.metadata,
        instructorNotes: undefined,
        rubricScores: undefined,
      },
    };

    render(<SubmissionCard submission={submissionWithMissingFields} />);

    // Should not show processed date
    expect(screen.queryByText(/Processed:/)).not.toBeInTheDocument();

    // Should not show grade display
    expect(screen.queryByTestId('grade-display')).not.toBeInTheDocument();

    // Should still show basic submission info
    expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
  });

  it('formats file sizes correctly', () => {
    render(<SubmissionCard submission={mockSubmission} />);

    // Check that file sizes are displayed (the exact format may vary)
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
    expect(screen.getByText(/50 MB/)).toBeInTheDocument();
  });

  it('handles zero file size', () => {
    const submissionWithZeroSize = {
      ...mockSubmission,
      files: [{ ...mockSubmission.files[0], size: 0 }],
    };

    render(<SubmissionCard submission={submissionWithZeroSize} />);

    expect(screen.getByText(/0 Bytes/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SubmissionCard submission={mockSubmission} className="custom-class" />);

    const container = screen.getByText('Introduction to Algorithms').closest('div')?.parentElement?.parentElement?.parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('handles file selection and video playback correctly', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Expand the card
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);

    // Initially shows placeholder
    expect(screen.getByText('Select a video file to play')).toBeInTheDocument();

    // Click on video file
    const videoFile = screen.getByText('presentation.mp4');
    await user.click(videoFile);

    // Shows video player
    expect(screen.getByTestId('video-player')).toBeInTheDocument();

    // Close video by clicking the close button in the video player
    const closeButton = screen.getByText('Close Video');
    await user.click(closeButton);

    // Video player should be closed
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
  });

  it('toggles between expanded and collapsed states', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={mockSubmission} />);

    // Initially collapsed
    expect(screen.queryByText('Video Playback')).not.toBeInTheDocument();

    // Expand
    const expandButton = screen.getByTitle('Expand');
    await user.click(expandButton);
    expect(screen.getByText('Video Playback')).toBeInTheDocument();

    // Collapse
    await user.click(expandButton);
    expect(screen.queryByText('Video Playback')).not.toBeInTheDocument();

    // Expand again
    await user.click(expandButton);
    expect(screen.getByText('Video Playback')).toBeInTheDocument();
  });
});

