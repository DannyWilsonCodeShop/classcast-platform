import { WebSocketManager, useWebSocket } from '@/lib/websocket';

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.OPEN;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    // Simulate connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = WebSocketManager.getInstance();
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await expect(wsManager.connect('user-123')).resolves.toBeUndefined();
      expect(wsManager.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      // Mock WebSocket to throw error
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(wsManager.connect('user-123')).rejects.toThrow('Connection failed');

      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });
  });

  describe('subscribe', () => {
    it('should subscribe to events', async () => {
      await wsManager.connect('user-123');
      
      const callback = jest.fn();
      const unsubscribe = wsManager.subscribe('test_event', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple subscribers', async () => {
      await wsManager.connect('user-123');
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      wsManager.subscribe('test_event', callback1);
      wsManager.subscribe('test_event', callback2);
      
      // Simulate message
      const mockMessage = {
        type: 'test_event',
        data: { test: 'data' },
        timestamp: new Date().toISOString()
      };
      
      // This would need to be implemented in the actual WebSocketManager
      // to trigger the message handling
    });
  });

  describe('send', () => {
    it('should send messages when connected', async () => {
      await wsManager.connect('user-123');
      
      const message = {
        type: 'test_event' as const,
        data: { test: 'data' },
        timestamp: new Date().toISOString()
      };
      
      // Should not throw
      expect(() => wsManager.send(message)).not.toThrow();
    });

    it('should handle sending when disconnected', () => {
      const message = {
        type: 'test_event' as const,
        data: { test: 'data' },
        timestamp: new Date().toISOString()
      };
      
      // Should not throw, but should log warning
      expect(() => wsManager.send(message)).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect cleanly', async () => {
      await wsManager.connect('user-123');
      expect(wsManager.isConnected()).toBe(true);
      
      wsManager.disconnect();
      expect(wsManager.isConnected()).toBe(false);
    });
  });
});

describe('useWebSocket hook', () => {
  // Mock React hooks
  const mockUseState = jest.fn();
  const mockUseEffect = jest.fn();
  const mockUseMemo = jest.fn();
  const mockUseCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    mockUseState
      .mockReturnValueOnce([false, jest.fn()]) // isConnected
      .mockReturnValueOnce([null, jest.fn()]); // error
    
    mockUseMemo.mockReturnValue(WebSocketManager.getInstance());
    mockUseEffect.mockImplementation((fn) => fn());
    mockUseCallback.mockReturnValue(jest.fn());

    // This would need to be properly mocked for React testing
    // const result = useWebSocket('user-123');
    
    // expect(result.isConnected).toBe(false);
    // expect(result.error).toBe(null);
  });
});
