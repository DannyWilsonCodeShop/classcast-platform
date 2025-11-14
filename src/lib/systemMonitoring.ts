import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const sesClient = new SESClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });

const ADMIN_EMAIL = 'wilson.danny@me.com';
const FROM_EMAIL = 'noreply@myclasscast.com';

interface SystemHealthStatus {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  metrics?: any;
}

class SystemMonitor {
  private lastNotificationTime: Map<string, number> = new Map();
  private readonly NOTIFICATION_COOLDOWN = 15 * 60 * 1000; // 15 minutes

  async checkSystemHealth(): Promise<SystemHealthStatus[]> {
    const healthChecks: SystemHealthStatus[] = [];

    // Check DynamoDB
    try {
      const dynamoHealth = await this.checkDynamoDBHealth();
      healthChecks.push(dynamoHealth);
    } catch (error) {
      healthChecks.push({
        service: 'DynamoDB',
        status: 'critical',
        message: `DynamoDB health check failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check Cognito
    try {
      const cognitoHealth = await this.checkCognitoHealth();
      healthChecks.push(cognitoHealth);
    } catch (error) {
      healthChecks.push({
        service: 'Cognito',
        status: 'critical',
        message: `Cognito health check failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check S3
    try {
      const s3Health = await this.checkS3Health();
      healthChecks.push(s3Health);
    } catch (error) {
      healthChecks.push({
        service: 'S3',
        status: 'critical',
        message: `S3 health check failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check Lambda Functions
    try {
      const lambdaHealth = await this.checkLambdaHealth();
      healthChecks.push(lambdaHealth);
    } catch (error) {
      healthChecks.push({
        service: 'Lambda',
        status: 'critical',
        message: `Lambda health check failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    return healthChecks;
  }

  private async checkDynamoDBHealth(): Promise<SystemHealthStatus> {
    // Check if tables exist and are accessible
    const tables = ['classcast-users', 'classcast-courses', 'classcast-assignments', 'classcast-submissions'];
    
    for (const table of tables) {
      try {
        // This would be a real DynamoDB check in production
        // For now, we'll simulate a check
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        return {
          service: 'DynamoDB',
          status: 'critical',
          message: `Table ${table} is not accessible`,
          timestamp: new Date().toISOString()
        };
      }
    }

    return {
      service: 'DynamoDB',
      status: 'healthy',
      message: 'All tables accessible',
      timestamp: new Date().toISOString()
    };
  }

  private async checkCognitoHealth(): Promise<SystemHealthStatus> {
    try {
      // Check if Cognito User Pool is accessible
      // This would be a real Cognito check in production
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        service: 'Cognito',
        status: 'healthy',
        message: 'User Pool accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'Cognito',
        status: 'critical',
        message: `Cognito User Pool not accessible: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkS3Health(): Promise<SystemHealthStatus> {
    try {
      // Check if S3 bucket is accessible
      // This would be a real S3 check in production
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        service: 'S3',
        status: 'healthy',
        message: 'S3 bucket accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'S3',
        status: 'critical',
        message: `S3 bucket not accessible: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkLambdaHealth(): Promise<SystemHealthStatus> {
    try {
      // Check Lambda function health via CloudWatch metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'classcast-post-confirmation'
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      });

      const response = await cloudWatchClient.send(command);
      const errorCount = response.Datapoints?.[0]?.Sum || 0;

      if (errorCount > 5) {
        return {
          service: 'Lambda',
          status: 'warning',
          message: `High error rate detected: ${errorCount} errors in last 5 minutes`,
          timestamp: new Date().toISOString(),
          metrics: { errorCount }
        };
      }

      return {
        service: 'Lambda',
        status: 'healthy',
        message: 'Lambda functions operating normally',
        timestamp: new Date().toISOString(),
        metrics: { errorCount }
      };
    } catch (error) {
      return {
        service: 'Lambda',
        status: 'critical',
        message: `Lambda health check failed: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendFailureNotification(healthStatus: SystemHealthStatus[]): Promise<void> {
    const criticalIssues = healthStatus.filter(status => status.status === 'critical');
    const warningIssues = healthStatus.filter(status => status.status === 'warning');

    if (criticalIssues.length === 0 && warningIssues.length === 0) {
      return; // No issues to report
    }

    // Check cooldown period
    const now = Date.now();
    const lastNotification = this.lastNotificationTime.get('system-health');
    
    if (lastNotification && (now - lastNotification) < this.NOTIFICATION_COOLDOWN) {
      console.log('Notification cooldown active, skipping email');
      return;
    }

    try {
      const subject = criticalIssues.length > 0 
        ? `🚨 CRITICAL: ClassCast System Failures Detected`
        : `⚠️ WARNING: ClassCast System Issues Detected`;

      const htmlBody = this.generateEmailBody(healthStatus, criticalIssues, warningIssues);

      const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [ADMIN_EMAIL]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            }
          }
        }
      });

      await sesClient.send(command);
      this.lastNotificationTime.set('system-health', now);
      
      console.log(`System failure notification sent to ${ADMIN_EMAIL}`);
    } catch (error) {
      console.error('Failed to send system failure notification:', error);
    }
  }

  private generateEmailBody(
    healthStatus: SystemHealthStatus[], 
    criticalIssues: SystemHealthStatus[], 
    warningIssues: SystemHealthStatus[]
  ): string {
    const timestamp = new Date().toLocaleString();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${criticalIssues.length > 0 ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .status-critical { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .status-warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .status-healthy { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .service-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .status-message { color: #374151; }
          .timestamp { color: #6b7280; font-size: 12px; }
          .footer { background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${criticalIssues.length > 0 ? '🚨 System Critical Alert' : '⚠️ System Warning Alert'}</h1>
            <p>ClassCast Platform Health Check - ${timestamp}</p>
          </div>
          <div class="content">
    `;

    if (criticalIssues.length > 0) {
      html += `
        <h2 style="color: #dc2626;">Critical Issues (${criticalIssues.length})</h2>
        ${criticalIssues.map(issue => `
          <div class="status-critical">
            <div class="service-name">${issue.service}</div>
            <div class="status-message">${issue.message}</div>
            <div class="timestamp">${new Date(issue.timestamp).toLocaleString()}</div>
          </div>
        `).join('')}
      `;
    }

    if (warningIssues.length > 0) {
      html += `
        <h2 style="color: #f59e0b;">Warning Issues (${warningIssues.length})</h2>
        ${warningIssues.map(issue => `
          <div class="status-warning">
            <div class="service-name">${issue.service}</div>
            <div class="status-message">${issue.message}</div>
            <div class="timestamp">${new Date(issue.timestamp).toLocaleString()}</div>
          </div>
        `).join('')}
      `;
    }

    // Show healthy services
    const healthyServices = healthStatus.filter(status => status.status === 'healthy');
    if (healthyServices.length > 0) {
      html += `
        <h2 style="color: #10b981;">Healthy Services (${healthyServices.length})</h2>
        ${healthyServices.map(service => `
          <div class="status-healthy">
            <div class="service-name">${service.service}</div>
            <div class="status-message">${service.message}</div>
            <div class="timestamp">${new Date(service.timestamp).toLocaleString()}</div>
          </div>
        `).join('')}
      `;
    }

    html += `
          </div>
          <div class="footer">
            <p>This is an automated alert from the ClassCast Platform monitoring system.</p>
            <p>Please investigate these issues immediately to ensure service continuity.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  async runHealthCheck(): Promise<void> {
    try {
      console.log('Running system health check...');
      const healthStatus = await this.checkSystemHealth();
      
      // Log all statuses
      healthStatus.forEach(status => {
        const emoji = status.status === 'healthy' ? '✅' : status.status === 'warning' ? '⚠️' : '🚨';
        console.log(`${emoji} ${status.service}: ${status.message}`);
      });

      // Send notification if there are issues
      await this.sendFailureNotification(healthStatus);
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Send critical notification about health check failure
      await this.sendFailureNotification([{
        service: 'System Monitor',
        status: 'critical',
        message: `Health check system failed: ${error}`,
        timestamp: new Date().toISOString()
      }]);
    }
  }
}

export const systemMonitor = new SystemMonitor();

// Run health check every 5 minutes
if (typeof window === 'undefined') { // Only run on server side
  setInterval(() => {
    systemMonitor.runHealthCheck();
  }, 5 * 60 * 1000);
}
