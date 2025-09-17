import { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

export interface MetricData {
  namespace: string;
  metricName: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Milliseconds' | 'Bytes' | 'Percent';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface LogEvent {
  message: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private logGroupName: string;
  private logStreamName: string;

  private constructor() {
    this.logGroupName = '/classcast/platform';
    this.logStreamName = `app-${new Date().toISOString().split('T')[0]}`;
    this.initializeLogGroup();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private async initializeLogGroup() {
    try {
      // Create log group if it doesn't exist
      await logsClient.send(new CreateLogGroupCommand({
        logGroupName: this.logGroupName
      }));
    } catch (error) {
      // Log group might already exist, ignore error
    }

    try {
      // Create log stream if it doesn't exist
      await logsClient.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }));
    } catch (error) {
      // Log stream might already exist, ignore error
    }
  }

  // Metrics
  public async putMetric(metricData: MetricData): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: metricData.namespace,
        MetricData: [{
          MetricName: metricData.metricName,
          Value: metricData.value,
          Unit: metricData.unit,
          Dimensions: Object.entries(metricData.dimensions || {}).map(([Name, Value]) => ({ Name, Value })),
          Timestamp: metricData.timestamp || new Date()
        }]
      });

      await cloudWatchClient.send(command);
    } catch (error) {
      console.error('Error putting metric:', error);
    }
  }

  // Logging
  public async logEvent(event: LogEvent): Promise<void> {
    try {
      const logEvent = {
        message: JSON.stringify({
          level: event.level,
          message: event.message,
          source: event.source,
          userId: event.userId,
          metadata: event.metadata,
          timestamp: new Date(event.timestamp).toISOString()
        }),
        timestamp: event.timestamp
      };

      await logsClient.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent]
      }));
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  // Convenience methods for common metrics
  public async trackUserAction(action: string, userId: string, metadata?: Record<string, any>) {
    await this.putMetric({
      namespace: 'ClassCast/Users',
      metricName: 'UserAction',
      value: 1,
      unit: 'Count',
      dimensions: {
        Action: action,
        UserId: userId
      }
    });

    await this.logEvent({
      message: `User action: ${action}`,
      timestamp: Date.now(),
      level: 'INFO',
      source: 'user-action',
      userId,
      metadata
    });
  }

  public async trackAssignmentCreated(assignmentId: string, courseId: string, instructorId: string) {
    await this.putMetric({
      namespace: 'ClassCast/Assignments',
      metricName: 'AssignmentCreated',
      value: 1,
      unit: 'Count',
      dimensions: {
        CourseId: courseId,
        InstructorId: instructorId
      }
    });

    await this.logEvent({
      message: `Assignment created: ${assignmentId}`,
      timestamp: Date.now(),
      level: 'INFO',
      source: 'assignment-creation',
      userId: instructorId,
      metadata: { assignmentId, courseId }
    });
  }

  public async trackSubmissionGraded(submissionId: string, assignmentId: string, studentId: string, grade: number) {
    await this.putMetric({
      namespace: 'ClassCast/Submissions',
      metricName: 'SubmissionGraded',
      value: 1,
      unit: 'Count',
      dimensions: {
        AssignmentId: assignmentId,
        StudentId: studentId
      }
    });

    await this.putMetric({
      namespace: 'ClassCast/Submissions',
      metricName: 'AverageGrade',
      value: grade,
      unit: 'Percent',
      dimensions: {
        AssignmentId: assignmentId
      }
    });

    await this.logEvent({
      message: `Submission graded: ${submissionId} - Grade: ${grade}%`,
      timestamp: Date.now(),
      level: 'INFO',
      source: 'submission-grading',
      userId: studentId,
      metadata: { submissionId, assignmentId, grade }
    });
  }

  public async trackError(error: Error, context: string, userId?: string, metadata?: Record<string, any>) {
    await this.putMetric({
      namespace: 'ClassCast/Errors',
      metricName: 'ErrorCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        Context: context,
        ErrorType: error.constructor.name
      }
    });

    await this.logEvent({
      message: `Error in ${context}: ${error.message}`,
      timestamp: Date.now(),
      level: 'ERROR',
      source: 'error-tracking',
      userId,
      metadata: {
        ...metadata,
        errorStack: error.stack,
        errorName: error.name
      }
    });
  }

  public async trackPerformance(operation: string, duration: number, userId?: string) {
    await this.putMetric({
      namespace: 'ClassCast/Performance',
      metricName: 'OperationDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Operation: operation
      }
    });

    await this.logEvent({
      message: `Performance: ${operation} took ${duration}ms`,
      timestamp: Date.now(),
      level: 'INFO',
      source: 'performance-tracking',
      userId,
      metadata: { operation, duration }
    });
  }

  // System health metrics
  public async trackSystemHealth(component: string, status: 'healthy' | 'warning' | 'critical', details?: string) {
    const statusValue = status === 'healthy' ? 1 : status === 'warning' ? 0.5 : 0;

    await this.putMetric({
      namespace: 'ClassCast/System',
      metricName: 'HealthStatus',
      value: statusValue,
      unit: 'Count',
      dimensions: {
        Component: component,
        Status: status
      }
    });

    await this.logEvent({
      message: `System health: ${component} is ${status}${details ? ` - ${details}` : ''}`,
      timestamp: Date.now(),
      level: status === 'critical' ? 'ERROR' : status === 'warning' ? 'WARN' : 'INFO',
      source: 'system-health',
      metadata: { component, status, details }
    });
  }

  // API metrics
  public async trackApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    await this.putMetric({
      namespace: 'ClassCast/API',
      metricName: 'ApiCalls',
      value: 1,
      unit: 'Count',
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        StatusCode: statusCode.toString()
      }
    });

    await this.putMetric({
      namespace: 'ClassCast/API',
      metricName: 'ApiResponseTime',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Endpoint: endpoint,
        Method: method
      }
    });
  }
}

export const monitoringService = MonitoringService.getInstance();

// React hook for monitoring
export function useMonitoring() {
  const trackUserAction = (action: string, metadata?: Record<string, any>) => {
    monitoringService.trackUserAction(action, 'current-user', metadata);
  };

  const trackError = (error: Error, context: string, metadata?: Record<string, any>) => {
    monitoringService.trackError(error, context, 'current-user', metadata);
  };

  const trackPerformance = (operation: string, duration: number) => {
    monitoringService.trackPerformance(operation, duration, 'current-user');
  };

  return {
    trackUserAction,
    trackError,
    trackPerformance
  };
}
