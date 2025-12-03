/**
 * Production Monitoring and Logging Configuration
 * Centralized logging, metrics, and error tracking for production
 */

import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// AWS Clients
const cloudWatchLogs = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const LOG_GROUP_NAME = process.env.CLOUDWATCH_LOG_GROUP || 'classcast-application-logs';
const LOG_STREAM_NAME = process.env.CLOUDWATCH_LOG_STREAM || 'api-logs';
const NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || 'ClassCast/API';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// Metrics interface
interface MetricData {
  metricName: string;
  value: number;
  unit: 'Count' | 'Milliseconds' | 'Bytes' | 'Percent';
  dimensions?: Record<string, string>;
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private initialized = false;
  private initializing = false;

  constructor() {
    // Don't initialize during build time
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // Only initialize in runtime, not during build
      if (process.env.AWS_EXECUTION_ENV || process.env.VERCEL) {
        this.startFlushInterval();
      }
    }
  }

  private async initializeLogGroup() {
    if (this.initialized || this.initializing) return;
    this.initializing = true;

    try {
      // Create log group if it doesn't exist
      await cloudWatchLogs.send(new CreateLogGroupCommand({
        logGroupName: LOG_GROUP_NAME
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException' && error.name !== 'AccessDeniedException') {
        console.error('Error creating log group:', error);
      }
    }

    try {
      // Create log stream if it doesn't exist
      await cloudWatchLogs.send(new CreateLogStreamCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: LOG_STREAM_NAME
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException' && error.name !== 'AccessDeniedException') {
        console.error('Error creating log stream:', error);
      }
    }

    this.initialized = true;
    this.initializing = false;
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    // Initialize if not already done
    if (!this.initialized && !this.initializing) {
      await this.initializeLogGroup();
    }
    
    if (!this.initialized) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const logEvents = logsToFlush.map(log => ({
        timestamp: new Date(log.timestamp).getTime(),
        message: JSON.stringify(log)
      }));

      await cloudWatchLogs.send(new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: LOG_STREAM_NAME,
        logEvents
      }));

      console.log(`Flushed ${logsToFlush.length} log entries to CloudWatch`);
    } catch (error: any) {
      // Silently fail if no permissions (like during build)
      if (error.name !== 'AccessDeniedException') {
        console.error('Error flushing logs to CloudWatch:', error);
      }
      // Don't re-add logs to prevent infinite growth
    }
  }

  private addLog(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'classcast-api',
      metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    // Always log to console for debugging
    console.log(`[${level}] ${message}`, metadata);

    this.logBuffer.push(logEntry);

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushLogs();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, metadata || '');
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.addLog(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.addLog(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.addLog(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.addLog(LogLevel.DEBUG, message, metadata);
  }

  // API-specific logging methods
  logAPIRequest(method: string, path: string, userId?: string, requestId?: string) {
    this.info('API Request', {
      method,
      path,
      userId,
      requestId,
      userAgent: 'unknown' // Would be passed from request headers
    });
  }

  logAPIResponse(method: string, path: string, statusCode: number, duration: number, userId?: string, requestId?: string) {
    this.info('API Response', {
      method,
      path,
      statusCode,
      duration,
      userId,
      requestId
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean) {
    this.info('Database Operation', {
      operation,
      table,
      duration,
      success
    });
  }

  logAuthenticationEvent(event: string, userId: string, success: boolean, metadata?: Record<string, any>) {
    this.info('Authentication Event', {
      event,
      userId,
      success,
      ...metadata
    });
  }

  logFileUpload(fileName: string, fileSize: number, userId: string, success: boolean, error?: Error) {
    this.info('File Upload', {
      fileName,
      fileSize,
      userId,
      success,
      ...(error && { error: error.message })
    });
  }
}

class MetricsCollector {
  private metricsBuffer: MetricData[] = [];
  private bufferSize = 100;
  private flushInterval = 60000; // 1 minute

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const metricData = metricsToFlush.map(metric => ({
        MetricName: metric.metricName,
        Value: metric.value,
        Unit: metric.unit,
        Dimensions: Object.entries(metric.dimensions || {}).map(([Name, Value]) => ({ Name, Value }))
      }));

      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: metricData
      }));

      console.log(`Flushed ${metricsToFlush.length} metrics to CloudWatch`);
    } catch (error) {
      console.error('Error flushing metrics to CloudWatch:', error);
      // Re-add metrics to buffer if flush failed
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  recordMetric(metricName: string, value: number, unit: MetricData['unit'], dimensions?: Record<string, string>) {
    this.metricsBuffer.push({
      metricName,
      value,
      unit,
      dimensions
    });

    // Flush immediately if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetrics();
    }
  }

  // API-specific metrics
  recordAPICall(method: string, path: string, statusCode: number, duration: number) {
    this.recordMetric('API_Calls', 1, 'Count', {
      Method: method,
      Path: path,
      StatusCode: statusCode.toString()
    });

    this.recordMetric('API_Duration', duration, 'Milliseconds', {
      Method: method,
      Path: path
    });
  }

  recordDatabaseOperation(operation: string, table: string, duration: number, success: boolean) {
    this.recordMetric('Database_Operations', 1, 'Count', {
      Operation: operation,
      Table: table,
      Success: success.toString()
    });

    this.recordMetric('Database_Duration', duration, 'Milliseconds', {
      Operation: operation,
      Table: table
    });
  }

  recordAuthenticationEvent(event: string, success: boolean) {
    this.recordMetric('Authentication_Events', 1, 'Count', {
      Event: event,
      Success: success.toString()
    });
  }

  recordFileUpload(fileSize: number, success: boolean) {
    this.recordMetric('File_Uploads', 1, 'Count', {
      Success: success.toString()
    });

    this.recordMetric('File_Upload_Size', fileSize, 'Bytes', {
      Success: success.toString()
    });
  }

  recordError(errorType: string, service: string) {
    this.recordMetric('Errors', 1, 'Count', {
      ErrorType: errorType,
      Service: service
    });
  }
}

// Export singleton instances
export const logger = new Logger();
export const metrics = new MetricsCollector();

// Error tracking and alerting
export class ErrorTracker {
  static trackError(error: Error, context: Record<string, any> = {}) {
    logger.error('Application Error', error, context);
    metrics.recordError(error.name, 'api');
    
    // In production, you might want to send alerts to SNS or other services
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement alerting logic (SNS, PagerDuty, etc.)
      console.error('CRITICAL ERROR:', error.message, context);
    }
  }

  static trackAPIError(error: Error, method: string, path: string, userId?: string) {
    this.trackError(error, {
      method,
      path,
      userId,
      type: 'API_ERROR'
    });
  }

  static trackDatabaseError(error: Error, operation: string, table: string) {
    this.trackError(error, {
      operation,
      table,
      type: 'DATABASE_ERROR'
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  static startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  static measureAsync<T>(fn: () => Promise<T>, metricName: string, dimensions?: Record<string, string>): Promise<T> {
    const timer = this.startTimer();
    return fn().then(
      (result) => {
        const duration = timer();
        metrics.recordMetric(metricName, duration, 'Milliseconds', dimensions);
        return result;
      },
      (error) => {
        const duration = timer();
        metrics.recordMetric(metricName, duration, 'Milliseconds', { ...dimensions, Success: 'false' });
        throw error;
      }
    );
  }
}

// Health check monitoring
export class HealthChecker {
  static async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database health check
      // In a real implementation, you'd ping your database
      return true;
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  static async checkS3Health(): Promise<boolean> {
    try {
      // Simple S3 health check
      // In a real implementation, you'd check S3 connectivity
      return true;
    } catch (error) {
      logger.error('S3 health check failed', error as Error);
      return false;
    }
  }

  static async getOverallHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const checks = {
      database: await this.checkDatabaseHealth(),
      s3: await this.checkS3Health()
    };

    const allHealthy = Object.values(checks).every(check => check);
    const anyHealthy = Object.values(checks).some(check => check);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      status = 'healthy';
    } else if (anyHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

  return {
      status,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}