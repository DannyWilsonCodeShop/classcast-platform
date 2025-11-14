import { NextRequest, NextResponse } from 'next/server';
import { HealthChecker, logger, metrics } from '@/lib/monitoring';

// GET /api/health - Comprehensive health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logger.info('Health check requested');
    
    // Get overall health status
    const health = await HealthChecker.getOverallHealth();
    
    // Add response time to health data
    const responseTime = Date.now() - startTime;
    health.responseTime = responseTime;
    
    // Record metrics
    metrics.recordMetric('Health_Check_Response_Time', responseTime, 'Milliseconds');
    metrics.recordMetric('Health_Check_Status', health.status === 'healthy' ? 1 : 0, 'Count');
    
    // Determine HTTP status code
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 207; // Multi-Status
    } else if (health.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }
    
    logger.info('Health check completed', {
      status: health.status,
      responseTime,
      checks: health.checks
    });
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', error as Error);
    metrics.recordMetric('Health_Check_Errors', 1, 'Count');
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// POST /api/health - Detailed health check with specific service checks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { services = ['database', 's3'] } = body;
    
    logger.info('Detailed health check requested', { services });
    
    const results: Record<string, any> = {};
    
    // Check each requested service
    for (const service of services) {
      switch (service) {
        case 'database':
          results.database = {
            healthy: await HealthChecker.checkDatabaseHealth(),
            timestamp: new Date().toISOString()
          };
          break;
        case 's3':
          results.s3 = {
            healthy: await HealthChecker.checkS3Health(),
            timestamp: new Date().toISOString()
          };
          break;
        default:
          results[service] = {
            healthy: false,
            error: 'Unknown service',
            timestamp: new Date().toISOString()
          };
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // Record metrics
    metrics.recordMetric('Detailed_Health_Check_Response_Time', responseTime, 'Milliseconds');
    
    logger.info('Detailed health check completed', {
      services,
      responseTime,
      results
    });
    
    return NextResponse.json({
      status: 'completed',
      services: results,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Detailed health check failed', error as Error);
    metrics.recordMetric('Detailed_Health_Check_Errors', 1, 'Count');
    
    return NextResponse.json({
      status: 'failed',
      error: 'Detailed health check failed',
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}