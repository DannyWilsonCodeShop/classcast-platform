export interface ErrorLogEntry {
	id: string;
	timestamp: number;
	level: 'error' | 'warn' | 'info';
	message: string;
	stack?: string;
	context?: Record<string, any>;
	userId?: string;
	sessionId?: string;
	url?: string;
	userAgent?: string;
}

export interface ErrorLoggerOptions {
	enableConsole?: boolean;
	enableRemote?: boolean;
	remoteEndpoint?: string;
	includeUserInfo?: boolean;
	includeSessionInfo?: boolean;
	includeBrowserInfo?: boolean;
}

class ErrorLogger {
	private options: ErrorLoggerOptions;
	private sessionId: string;
	private logs: ErrorLogEntry[] = [];
	private maxLogs: number = 100;

	constructor(options: ErrorLoggerOptions = {}) {
		this.options = {
			enableConsole: true,
			enableRemote: false,
			remoteEndpoint: '/api/errors',
			includeUserInfo: true,
			includeSessionInfo: true,
			includeBrowserInfo: true,
			...options,
		};

		this.sessionId = this.generateSessionId();
		this.setupGlobalErrorHandlers();
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private setupGlobalErrorHandlers(): void {
		// Handle unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.log('error', 'Unhandled Promise Rejection', {
				reason: event.reason,
				stack: event.reason?.stack,
			});
		});

		// Handle global errors
		window.addEventListener('error', (event) => {
			this.log('error', 'Global Error', {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				error: event.error,
			});
		});
	}

	private getContext(): Record<string, any> {
		const context: Record<string, any> = {};

		if (this.options.includeSessionInfo) {
			context.sessionId = this.sessionId;
		}

		if (this.options.includeBrowserInfo) {
			context.url = window.location.href;
			context.userAgent = navigator.userAgent;
			context.viewport = {
				width: window.innerWidth,
				height: window.innerHeight,
			};
		}

		return context;
	}

	private generateId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	async log(
		level: 'error' | 'warn' | 'info',
		message: string,
		context?: Record<string, any>
	): Promise<void> {
		const entry: ErrorLogEntry = {
			id: this.generateId(),
			timestamp: Date.now(),
			level,
			message,
			stack: context?.stack || new Error().stack,
			context: { ...this.getContext(), ...context },
		};

		// Add to local logs
		this.logs.push(entry);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Console logging
		if (this.options.enableConsole) {
			const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
			console[logMethod](`[${level.toUpperCase()}] ${message}`, entry);
		}

		// Remote logging for errors
		if (this.options.enableRemote && level === 'error') {
			try {
				await this.sendToRemote(entry);
			} catch (sendError) {
				console.warn('Failed to send error to remote endpoint:', sendError);
			}
		}
	}

	private async sendToRemote(entry: ErrorLogEntry): Promise<void> {
		if (!this.options.remoteEndpoint) return;

		const response = await fetch(this.options.remoteEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(entry),
		});

		if (!response.ok) {
			throw new Error(`Failed to send error: ${response.status}`);
		}
	}

	error(message: string, context?: Record<string, any>): Promise<void> {
		return this.log('error', message, context);
	}

	warn(message: string, context?: Record<string, any>): Promise<void> {
		return this.log('warn', message, context);
	}

	info(message: string, context?: Record<string, any>): Promise<void> {
		return this.log('info', message, context);
	}

	getLogs(level?: 'error' | 'warn' | 'info'): ErrorLogEntry[] {
		if (level) {
			return this.logs.filter(log => log.level === level);
		}
		return [...this.logs];
	}

	clearLogs(): void {
		this.logs = [];
	}

	setUserInfo(userId: string): void {
		this.options.includeUserInfo = true;
		// Update existing logs with user info
		this.logs.forEach(log => {
			if (log.context) {
				log.context.userId = userId;
			}
		});
	}

	async exportLogs(): Promise<string> {
		const exportData = {
			exportedAt: new Date().toISOString(),
			sessionId: this.sessionId,
			logs: this.logs,
		};
		return JSON.stringify(exportData, null, 2);
	}
}

export const errorLogger = new ErrorLogger();

// Export default instance for easy import
export default errorLogger;
