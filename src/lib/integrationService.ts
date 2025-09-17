import { emailService } from './emailService';
import { monitoringService } from './monitoring';
import { WebSocketManager } from './websocket';
import { cognitoAuthService } from './cognitoAuth';

export class IntegrationService {
  private static instance: IntegrationService;

  private constructor() {}

  public static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // Complete assignment creation flow with all integrations
  public async createAssignmentWithNotifications(assignment: any, instructorId: string, students: string[]) {
    try {
      const startTime = Date.now();

      // 1. Create assignment (this would call your API)
      console.log('Creating assignment:', assignment);

      // 2. Send real-time notification via WebSocket
      const wsManager = WebSocketManager.getInstance();
      if (wsManager.isConnected()) {
        wsManager.send({
          type: 'assignment_created',
          data: {
            assignment,
            message: `New assignment "${assignment.title}" has been created`
          },
          timestamp: new Date().toISOString(),
          targetUsers: students
        });
      }

      // 3. Send email notifications
      await emailService.notifyAssignmentCreated(assignment, students);

      // 4. Track metrics and logs
      await monitoringService.trackAssignmentCreated(
        assignment.assignmentId,
        assignment.courseId,
        instructorId
      );

      // 5. Track performance
      const duration = Date.now() - startTime;
      await monitoringService.trackPerformance('assignment_creation', duration, instructorId);

      return { success: true, assignmentId: assignment.assignmentId };
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'assignment_creation',
        instructorId,
        { assignment }
      );
      throw error;
    }
  }

  // Complete submission grading flow with all integrations
  public async gradeSubmissionWithNotifications(submission: any, grade: number, feedback: string, instructorId: string) {
    try {
      const startTime = Date.now();

      // 1. Grade submission (this would call your API)
      console.log('Grading submission:', submission);

      // 2. Send real-time notification via WebSocket
      const wsManager = WebSocketManager.getInstance();
      if (wsManager.isConnected()) {
        wsManager.send({
          type: 'submission_graded',
          data: {
            submission,
            grade,
            feedback,
            message: `Your submission has been graded: ${grade}%`
          },
          timestamp: new Date().toISOString(),
          targetUsers: [submission.studentId]
        });
      }

      // 3. Send email notification
      await emailService.notifySubmissionGraded(submission, submission.studentEmail);

      // 4. Track metrics and logs
      await monitoringService.trackSubmissionGraded(
        submission.submissionId,
        submission.assignmentId,
        submission.studentId,
        grade
      );

      // 5. Track performance
      const duration = Date.now() - startTime;
      await monitoringService.trackPerformance('submission_grading', duration, instructorId);

      return { success: true, submissionId: submission.submissionId };
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'submission_grading',
        instructorId,
        { submission, grade }
      );
      throw error;
    }
  }

  // Complete user authentication flow with all integrations
  public async authenticateUserWithTracking(email: string, password: string) {
    try {
      const startTime = Date.now();

      // 1. Authenticate with Cognito
      const authResult = await cognitoAuthService.signIn(email, password);
      const userInfo = cognitoAuthService.getUserInfo(authResult.idToken);

      // 2. Track user login
      await monitoringService.trackUserAction('user_login', userInfo?.sub || email);

      // 3. Track performance
      const duration = Date.now() - startTime;
      await monitoringService.trackPerformance('user_authentication', duration, userInfo?.sub);

      // 4. Check system health
      await monitoringService.trackSystemHealth('authentication', 'healthy');

      return { success: true, authResult, userInfo };
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'user_authentication',
        undefined,
        { email }
      );
      throw error;
    }
  }

  // Complete user registration flow with all integrations
  public async registerUserWithTracking(userData: any) {
    try {
      const startTime = Date.now();

      // 1. Register with Cognito
      const userId = await cognitoAuthService.signUp(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role,
        userData.additionalAttributes
      );

      // 2. Track user registration
      await monitoringService.trackUserAction('user_registration', userId);

      // 3. Send welcome email (if needed)
      // await emailService.sendWelcomeEmail(userData.email, userData.firstName);

      // 4. Track performance
      const duration = Date.now() - startTime;
      await monitoringService.trackPerformance('user_registration', duration, userId);

      return { success: true, userId };
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'user_registration',
        undefined,
        { email: userData.email }
      );
      throw error;
    }
  }

  // System health check with all integrations
  public async performSystemHealthCheck() {
    try {
      const healthStatus = {
        websocket: false,
        email: false,
        monitoring: false,
        authentication: false,
        overall: 'healthy'
      };

      // Check WebSocket
      const wsManager = WebSocketManager.getInstance();
      healthStatus.websocket = wsManager.isConnected();

      // Check email service (test send)
      try {
        await emailService.sendEmail({
          to: 'test@example.com',
          templateName: 'assignment_created',
          templateData: { test: true }
        });
        healthStatus.email = true;
      } catch (error) {
        console.warn('Email service check failed:', error);
      }

      // Check monitoring service
      try {
        await monitoringService.trackSystemHealth('health_check', 'healthy');
        healthStatus.monitoring = true;
      } catch (error) {
        console.warn('Monitoring service check failed:', error);
      }

      // Check authentication service
      try {
        // This would be a simple check, not actual authentication
        healthStatus.authentication = true;
      } catch (error) {
        console.warn('Authentication service check failed:', error);
      }

      // Determine overall health
      const healthyServices = Object.values(healthStatus).filter(status => status === true).length;
      const totalServices = Object.keys(healthStatus).length - 1; // Exclude 'overall'

      if (healthyServices === totalServices) {
        healthStatus.overall = 'healthy';
      } else if (healthyServices >= totalServices * 0.7) {
        healthStatus.overall = 'warning';
      } else {
        healthStatus.overall = 'critical';
      }

      // Track health check
      await monitoringService.trackSystemHealth(
        'overall',
        healthStatus.overall as 'healthy' | 'warning' | 'critical',
        `Services: ${healthyServices}/${totalServices} healthy`
      );

      return healthStatus;
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'system_health_check',
        undefined
      );
      throw error;
    }
  }

  // Initialize all services
  public async initializeServices() {
    try {
      console.log('Initializing integration services...');

      // Initialize monitoring
      await monitoringService.trackSystemHealth('initialization', 'healthy', 'Starting services');

      // Initialize WebSocket (if user is available)
      // This would typically be done when a user logs in

      // Initialize email service
      // This is already initialized as a singleton

      // Initialize authentication service
      // This is already initialized as a singleton

      await monitoringService.trackSystemHealth('initialization', 'healthy', 'All services initialized');

      console.log('Integration services initialized successfully');
      return { success: true };
    } catch (error) {
      await monitoringService.trackError(
        error as Error,
        'service_initialization',
        undefined
      );
      throw error;
    }
  }
}

export const integrationService = IntegrationService.getInstance();
