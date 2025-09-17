import { NextRequest, NextResponse } from 'next/server';
import { systemMonitor } from '@/lib/systemMonitoring';

export async function GET(request: NextRequest) {
  try {
    console.log('Manual health check triggered');
    await systemMonitor.runHealthCheck();
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed and notifications sent if needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forceNotification } = body;
    
    console.log('Manual health check triggered with options:', { forceNotification });
    
    if (forceNotification) {
      // Force notification by clearing cooldown
      (systemMonitor as any).lastNotificationTime.clear();
    }
    
    await systemMonitor.runHealthCheck();
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed and notifications sent if needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
