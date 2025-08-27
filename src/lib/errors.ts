export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;
	readonly details?: unknown;

	constructor(message: string, status: number, code?: string, details?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export class NetworkError extends Error {
	constructor(message = 'Network error') {
		super(message);
		this.name = 'NetworkError';
	}
}

export class TimeoutError extends Error {
	constructor(message = 'Request timed out') {
		super(message);
		this.name = 'TimeoutError';
	}
}
