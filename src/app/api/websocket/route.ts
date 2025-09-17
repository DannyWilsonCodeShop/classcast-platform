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
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing userId or token' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd validate the token here
    // For now, we'll accept any token

    // Create WebSocket server
    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log(`WebSocket connection established for user: ${userId}`);
      
      // Add connection to manager
      wsManager.addConnection(userId, ws);

      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          console.log(`Received message from ${userId}:`, message);

          // Handle different message types
          switch (message.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
            
            case 'join_course':
              // Handle course joining
              console.log(`User ${userId} joined course: ${message.courseId}`);
              break;
            
            case 'leave_course':
              // Handle course leaving
              console.log(`User ${userId} left course: ${message.courseId}`);
              break;
            
            default:
              console.log(`Unknown message type: ${message.type}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket connection closed for user: ${userId}`);
        wsManager.removeConnection(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        wsManager.removeConnection(userId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to ClassCast real-time updates',
        userId,
        timestamp: Date.now(),
      }));
    });

    return new NextResponse(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': 'websocket',
      },
    });
  } catch (error) {
    console.error('WebSocket error:', error);
    return NextResponse.json(
      { error: 'WebSocket connection failed' },
      { status: 500 }
    );
  }
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
