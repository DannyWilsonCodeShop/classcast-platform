import { EmailService } from '@/lib/emailService';

// Mock AWS SDK
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' })
  })),
  SendEmailCommand: jest.fn()
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = EmailService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        templateName: 'assignment_created',
        templateData: {
          studentName: 'John Doe',
          assignmentTitle: 'Math Quiz',
          courseName: 'Mathematics 101',
          dueDate: '2024-01-15',
          assignmentType: 'quiz',
          maxScore: 100,
          description: 'Complete the math quiz',
          instructions: 'Show all work',
          assignmentUrl: 'https://classcast.com/assignments/1'
        }
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result).toBe(true);
    });

    it('should handle multiple recipients', async () => {
      const emailData = {
        to: ['student1@example.com', 'student2@example.com'],
        templateName: 'assignment_created',
        templateData: {
          studentName: 'Student',
          assignmentTitle: 'Test Assignment',
          courseName: 'Test Course',
          dueDate: '2024-01-15',
          assignmentType: 'assignment',
          maxScore: 100,
          description: 'Test description',
          assignmentUrl: 'https://classcast.com/assignments/1'
        }
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result).toBe(true);
    });

    it('should throw error for invalid template', async () => {
      const emailData = {
        to: 'test@example.com',
        templateName: 'invalid_template',
        templateData: {}
      };

      const result = await emailService.sendEmail(emailData);
      
      expect(result).toBe(false);
    });
  });

  describe('notifyAssignmentCreated', () => {
    it('should send assignment notification', async () => {
      const assignment = {
        title: 'Math Quiz',
        courseName: 'Mathematics 101',
        dueDate: '2024-01-15T23:59:59Z',
        type: 'quiz',
        maxScore: 100,
        description: 'Complete the math quiz',
        instructions: 'Show all work',
        assignmentId: 'assign-123'
      };

      const students = ['student1@example.com', 'student2@example.com'];

      const result = await emailService.notifyAssignmentCreated(assignment, students);
      
      expect(result).toBe(true);
    });
  });

  describe('notifySubmissionGraded', () => {
    it('should send grading notification', async () => {
      const submission = {
        studentName: 'John Doe',
        assignmentTitle: 'Math Quiz',
        grade: 85,
        pointsEarned: 85,
        maxPoints: 100,
        feedback: 'Good work!',
        gradedAt: '2024-01-15T10:30:00Z',
        submissionId: 'sub-123'
      };

      const result = await emailService.notifySubmissionGraded(submission, 'john@example.com');
      
      expect(result).toBe(true);
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      const result = await emailService.sendPasswordReset(
        'user@example.com',
        '123456',
        'John Doe'
      );
      
      expect(result).toBe(true);
    });
  });
});
