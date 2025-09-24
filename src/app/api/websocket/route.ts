import { NextRequest, NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'socket.io';

// WebSocket connection manager
class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocket> = new Map();
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public addConnection(userId: string, ws: WebSocket) {
    this.connections.set(userId, ws);
    console.log(`User ${userId} connected. Total connections: ${this.connections.size}`);
  }

  public removeConnection(userId: string) {
    this.connections.delete(userId);
    console.log(`User ${userId} disconnected. Total connections: ${this.connections.size}`);
  }

  public sendToUser(userId: string, message: any) {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public broadcastToRole(role: string, message: any) {
    // In a real implementation, you'd need to track user roles
    // For now, we'll broadcast to all connected users
    this.connections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastToCourse(courseId: string, message: any) {
    // In a real implementation, you'd need to track user course enrollments
    // For now, we'll broadcast to all connected users
    this.connections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }
}

// Initialize WebSocket manager
const wsManager = WebSocketManager.getInstance();

// WebSocket upgrade handler
export async function GET(request: NextRequest) {
  // Disable WebSocket connections for now to prevent errors
  // In production, WebSocket connections should be handled by a proper WebSocket server
  return NextResponse.json(
    { 
      error: 'WebSocket connections are temporarily disabled',
      message: 'Real-time features are not available at this time'
    },
    { status: 503 }
  );
}

// Helper functions for sending real-time updates
export class RealtimeNotifier {
  // Notify when assignment is created
  static async notifyAssignmentCreated(assignment: any, courseId: string) {
    const message = {
      type: 'assignment_created',
      data: assignment,
      courseId,
      timestamp: Date.now(),
    };
    
    wsManager.broadcastToCourse(courseId, message);
  }

  // Notify when assignment is updated
  static async notifyAssignmentUpdated(assignment: any, courseId: string) {
    const message = {
      type: 'assignment_updated',
      data: assignment,
      courseId,
      timestamp: Date.now(),
    };
    
    wsManager.broadcastToCourse(courseId, message);
  }

  // Notify when submission is made
  static async notifySubmissionMade(submission: any, courseId: string) {
    const message = {
      type: 'submission_made',
      data: submission,
      courseId,
      timestamp: Date.now(),
    };
    
    wsManager.broadcastToCourse(courseId, message);
  }

  // Notify when submission is graded
  static async notifySubmissionGraded(submission: any, studentId: string) {
    const message = {
      type: 'submission_graded',
      data: submission,
      studentId,
      timestamp: Date.now(),
    };
    
    wsManager.sendToUser(studentId, message);
  }

  // Notify when grade is updated
  static async notifyGradeUpdated(submission: any, studentId: string) {
    const message = {
      type: 'grade_updated',
      data: submission,
      studentId,
      timestamp: Date.now(),
    };
    
    wsManager.sendToUser(studentId, message);
  }

  // Notify system-wide announcements
  static async notifyAnnouncement(announcement: any, targetRole?: string) {
    const message = {
      type: 'announcement',
      data: announcement,
      timestamp: Date.now(),
    };
    
    if (targetRole) {
      wsManager.broadcastToRole(targetRole, message);
    } else {
      // Broadcast to all users
      wsManager.connections.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }
}

// Export the WebSocket manager for use in other API routes
export { wsManager };
