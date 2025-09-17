import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
  userId?: string;
  courseId?: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onAssignmentCreated?: (assignment: any) => void;
  onAssignmentUpdated?: (assignment: any) => void;
  onSubmissionGraded?: (submission: any) => void;
  onGradeUpdated?: (submission: any) => void;
  onAnnouncement?: (announcement: any) => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const {
    onMessage,
    onAssignmentCreated,
    onAssignmentUpdated,
    onSubmissionGraded,
    onGradeUpdated,
    onAnnouncement,
    autoConnect = true,
    reconnectInterval = 5000,
  } = options;

  const connect = useCallback(() => {
    if (!user || !isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}/api/websocket?userId=${user.userId}&token=${user.token || 'demo-token'}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          // Call general message handler
          onMessage?.(message);

          // Call specific handlers based on message type
          switch (message.type) {
            case 'assignment_created':
              onAssignmentCreated?.(message.data);
              break;
            case 'assignment_updated':
              onAssignmentUpdated?.(message.data);
              break;
            case 'submission_graded':
              onSubmissionGraded?.(message.data);
              break;
            case 'grade_updated':
              onGradeUpdated?.(message.data);
              break;
            case 'announcement':
              onAnnouncement?.(message.data);
              break;
            case 'pong':
              // Handle ping/pong for connection health
              break;
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [user, isAuthenticated, onMessage, onAssignmentCreated, onAssignmentUpdated, onSubmissionGraded, onGradeUpdated, onAnnouncement, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const joinCourse = useCallback((courseId: string) => {
    return sendMessage({
      type: 'join_course',
      courseId,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const leaveCourse = useCallback((courseId: string) => {
    return sendMessage({
      type: 'leave_course',
      courseId,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const ping = useCallback(() => {
    return sendMessage({
      type: 'ping',
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && user && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user, isAuthenticated, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    joinCourse,
    leaveCourse,
    ping,
  };
}
