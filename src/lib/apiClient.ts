import { ApiError, NetworkError, TimeoutError } from './errors';
import { notificationCenter } from './notifications';
import { TokenManager } from './tokenManager';

export interface ApiClientOptions {
	baseUrl: string;
	timeoutMs?: number;
	maxRetries?: number;
	retryDelayMs?: number;
}

export class ApiClient {
	private baseUrl: string;
	private timeoutMs: number;
	private maxRetries: number;
	private retryDelayMs: number;
	private tokenManager?: TokenManager;

	constructor(options: ApiClientOptions, tokenManager?: TokenManager) {
		this.baseUrl = options.baseUrl.replace(/\/$/, '');
		this.timeoutMs = options.timeoutMs ?? 15000;
		this.maxRetries = options.maxRetries ?? 1;
		this.retryDelayMs = options.retryDelayMs ?? 250;
		this.tokenManager = tokenManager;
	}

	private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const t = setTimeout(() => reject(new TimeoutError()), ms);
			promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
		});
	}

	private async sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

	private async request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
		const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
		let attempt = 0;

		const doFetch = async (): Promise<Response> => {
			const headers = new Headers(init.headers || {});
			headers.set('Accept', 'application/json');
			if (!(init.body instanceof FormData)) {
				headers.set('Content-Type', 'application/json');
			}

			if (init.auth !== false && this.tokenManager) {
				const token = await this.tokenManager.ensureValidToken();
				if (token) headers.set('Authorization', `Bearer ${token}`);
			}

			return this.withTimeout(fetch(url, { ...init, headers }), this.timeoutMs);
		};

		while (true) {
			try {
				let res = await doFetch();
				if (res.status === 401 && this.tokenManager && init.auth !== false) {
					// try refresh once per attempt
					try {
						await this.tokenManager.refresh();
						res = await doFetch();
					} catch (_) {
						// refresh failed; fallthrough to error mapping
					}
				}

				if (!res.ok) {
					const body = await this.safeJson(res);
					throw new ApiError(body?.message || res.statusText || 'Request failed', res.status, body?.code, body);
				}
				return (await this.safeJson(res)) as T;
			} catch (err: any) {
				attempt += 1;
				// No retry for client errors
				const status = err?.status as number | undefined;
				const isClientErr = typeof status === 'number' && status >= 400 && status < 500 && status !== 429 && status !== 408;
				if (isClientErr || attempt > this.maxRetries) {
					this.notifyError(err);
					throw this.normalizeError(err);
				}
				await this.sleep(this.retryDelayMs * attempt);
			}
		}
	}

	private async safeJson(res: Response): Promise<any | null> {
		const text = await res.text();
		if (!text) return null;
		try { return JSON.parse(text); } catch { return { message: text }; }
	}

	private normalizeError(err: any): Error {
		if (err instanceof ApiError || err instanceof TimeoutError) return err;
		if (err?.name === 'AbortError') return new TimeoutError();
		if (err?.status) return new ApiError(err.message || 'Request failed', err.status, err.code, err.details);
		if (typeof err?.message === 'string') return new NetworkError(err.message);
		return new NetworkError();
	}

	private notifyError(err: any) {
		const error = this.normalizeError(err);
		if (error instanceof ApiError) {
			if (error.status >= 500) notificationCenter.notify('error', 'Server error. Please try again later.', 'Server Error');
			else if (error.status === 401) notificationCenter.notify('warning', 'Your session expired. Please sign in again.', 'Unauthorized');
			else if (error.status === 429) notificationCenter.notify('warning', 'Too many requests. Please slow down.', 'Rate Limited');
			else notificationCenter.notify('error', error.message, 'Request Error');
		} else if (error instanceof TimeoutError) {
			notificationCenter.notify('warning', 'Request timed out. Check your connection and try again.', 'Timeout');
		} else {
			notificationCenter.notify('error', 'Network error. Check your connection.', 'Network Error');
		}
	}

	// Public helpers
	get<T>(path: string, init?: RequestInit & { auth?: boolean }) { return this.request<T>(path, { ...init, method: 'GET' }); }
	post<T>(path: string, body?: unknown, init?: RequestInit & { auth?: boolean }) { return this.request<T>(path, { ...init, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }); }
	put<T>(path: string, body?: unknown, init?: RequestInit & { auth?: boolean }) { return this.request<T>(path, { ...init, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }); }
	patch<T>(path: string, body?: unknown, init?: RequestInit & { auth?: boolean }) { return this.request<T>(path, { ...init, method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }); }
	delete<T>(path: string, init?: RequestInit & { auth?: boolean }) { return this.request<T>(path, { ...init, method: 'DELETE' }); }
}
