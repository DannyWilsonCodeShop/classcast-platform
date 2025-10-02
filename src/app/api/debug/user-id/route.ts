import { NextRequest, NextResponse } from 'next/server';
import { useAuth } from '@/contexts/AuthContext';

export async function GET(request: NextRequest) {
  try {
    // This is a debug endpoint to help troubleshoot instructor ID issues
    return NextResponse.json({
      success: true,
      message: 'This endpoint requires client-side authentication context',
      note: 'Check the browser console for user ID information'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get user ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
