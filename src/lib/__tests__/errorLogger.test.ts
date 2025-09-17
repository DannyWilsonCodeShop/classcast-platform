import { errorLogger } from '../errorLogger';

// Mock fetch for remote logging
global.fetch = jest.fn();

describe('ErrorLogger', () => {
	let mockConsole: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		mockConsole = jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		mockConsole.mockRestore();
		jest.restoreAllMocks();
	});

	describe('Basic Logging', () => {
		it('logs error messages', async () => {
			await errorLogger.error('Test error message');
			
			const logs = errorLogger.getLogs('error');
			expect(logs).toHaveLength(1);
			expect(logs[0].message).toBe('Test error message');
			expect(logs[0].level).toBe('error');
		});

		it('logs warning messages', async () => {
			await errorLogger.warn('Test warning message');
			
			const logs = errorLogger.getLogs('warn');
			expect(logs).toHaveLength(1);
			expect(logs[0].message).toBe('Test warning message');
			expect(logs[0].level).toBe('warn');
		});

		it('logs info messages', async () => {
			await errorLogger.info('Test info message');
			
			const logs = errorLogger.getLogs('info');
			expect(logs).toHaveLength(1);
			expect(logs[0].message).toBe('Test info message');
			expect(logs[0].level).toBe('info');
		});

		it('includes timestamp in log entries', async () => {
			const beforeLog = Date.now();
			await errorLogger.error('Test message');
			const afterLog = Date.now();
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeLog);
			expect(logs[0].timestamp).toBeLessThanOrEqual(afterLog);
		});

		it('generates unique IDs for log entries', async () => {
			await errorLogger.error('Message 1');
			await errorLogger.error('Message 2');
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].id).not.toBe(logs[1].id);
		});
	});

	describe('Context and Metadata', () => {
		it('includes session ID in context', async () => {
			await errorLogger.error('Test message');
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].context?.sessionId).toBeDefined();
			expect(typeof logs[0].context?.sessionId).toBe('string');
		});

		it('includes browser information in context', async () => {
			await errorLogger.error('Test message');
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].context?.url).toBe(window.location.href);
			expect(logs[0].context?.userAgent).toBe(navigator.userAgent);
			expect(logs[0].context?.viewport).toBeDefined();
		});

		it('includes custom context in log entries', async () => {
			const customContext = { userId: '123', action: 'test' };
			await errorLogger.error('Test message', customContext);
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].context?.userId).toBe('123');
			expect(logs[0].context?.action).toBe('test');
		});

		it('includes stack trace when available', async () => {
			const error = new Error('Test error');
			await errorLogger.error('Test message', { stack: error.stack });
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].stack).toBe(error.stack);
		});
	});

	describe('Log Management', () => {
		it('limits log entries to maximum count', async () => {
			// Create more logs than the default max (100)
			for (let i = 0; i < 105; i++) {
				await errorLogger.info(`Message ${i}`);
			}
			
			const logs = errorLogger.getLogs();
			expect(logs).toHaveLength(100);
			// Should keep the most recent logs
			expect(logs[logs.length - 1].message).toBe('Message 104');
		});

		it('filters logs by level', async () => {
			await errorLogger.error('Error message');
			await errorLogger.warn('Warning message');
			await errorLogger.info('Info message');
			
			const errorLogs = errorLogger.getLogs('error');
			const warningLogs = errorLogger.getLogs('warn');
			const infoLogs = errorLogger.getLogs('info');
			
			expect(errorLogs).toHaveLength(1);
			expect(warningLogs).toHaveLength(1);
			expect(infoLogs).toHaveLength(1);
		});

		it('clears all logs', async () => {
			await errorLogger.error('Test message');
			expect(errorLogger.getLogs()).toHaveLength(1);
			
			errorLogger.clearLogs();
			expect(errorLogger.getLogs()).toHaveLength(0);
		});
	});

	describe('Console Logging', () => {
		it('logs to console by default', async () => {
			await errorLogger.error('Test error');
			await errorLogger.warn('Test warning');
			await errorLogger.info('Test info');
			
			expect(console.error).toHaveBeenCalled();
			expect(console.warn).toHaveBeenCalled();
			expect(console.log).toHaveBeenCalled();
		});

		it('can disable console logging', async () => {
			const customLogger = new ErrorLogger({ enableConsole: false });
			await customLogger.error('Test message');
			
			expect(console.error).not.toHaveBeenCalled();
		});
	});

	describe('Remote Logging', () => {
		it('sends errors to remote endpoint when enabled', async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
			mockFetch.mockResolvedValueOnce({ ok: true } as Response);
			
			const customLogger = new ErrorLogger({ enableRemote: true });
			await customLogger.error('Test error');
			
			expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: expect.stringContaining('Test error'),
			});
		});

		it('handles remote logging failures gracefully', async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
			mockFetch.mockRejectedValueOnce(new Error('Network error'));
			
			const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
			
			const customLogger = new ErrorLogger({ enableRemote: true });
			await customLogger.error('Test error');
			
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Failed to send error to remote endpoint:',
				expect.any(Error)
			);
		});

		it('only sends errors to remote endpoint', async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
			
			const customLogger = new ErrorLogger({ enableRemote: true });
			await customLogger.info('Test info');
			await customLogger.warn('Test warning');
			await customLogger.error('Test error');
			
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});

	describe('User Information', () => {
		it('sets user ID for logging', async () => {
			errorLogger.setUserInfo('user123');
			
			await errorLogger.error('Test message');
			const logs = errorLogger.getLogs('error');
			expect(logs[0].context?.userId).toBe('user123');
		});

		it('updates existing logs with user info', async () => {
			await errorLogger.error('Message 1');
			errorLogger.setUserInfo('user123');
			await errorLogger.error('Message 2');
			
			const logs = errorLogger.getLogs('error');
			expect(logs[0].context?.userId).toBe('user123');
			expect(logs[1].context?.userId).toBe('user123');
		});
	});

	describe('Export Functionality', () => {
		it('exports logs in JSON format', async () => {
			await errorLogger.error('Test error');
			await errorLogger.warn('Test warning');
			
			const exported = await errorLogger.exportLogs();
			const parsed = JSON.parse(exported);
			
			expect(parsed).toHaveProperty('exportedAt');
			expect(parsed).toHaveProperty('sessionId');
			expect(parsed).toHaveProperty('logs');
			expect(parsed.logs).toHaveLength(2);
		});
	});

	describe('Global Error Handling', () => {
		it('handles unhandled promise rejections', async () => {
		const unhandledRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
			reason: new Error('Promise rejected'),
			promise: Promise.reject(new Error('Promise rejected')),
		});
			
			window.dispatchEvent(unhandledRejectionEvent);
			
			// Wait for the event to be processed
			await new Promise(resolve => setTimeout(resolve, 0));
			
			const logs = errorLogger.getLogs('error');
			expect(logs.some(log => log.message.includes('Unhandled Promise Rejection'))).toBe(true);
		});

		it('handles global errors', async () => {
			const errorEvent = new ErrorEvent('error', {
				message: 'Global error',
				filename: 'test.js',
				lineno: 10,
				colno: 5,
				error: new Error('Global error'),
			});
			
			window.dispatchEvent(errorEvent);
			
			// Wait for the event to be processed
			await new Promise(resolve => setTimeout(resolve, 0));
			
			const logs = errorLogger.getLogs('error');
			expect(logs.some(log => log.message.includes('Global Error'))).toBe(true);
		});
	});
});
