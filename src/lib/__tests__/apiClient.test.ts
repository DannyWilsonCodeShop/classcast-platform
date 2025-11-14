import { ApiClient } from '../apiClient';
import { TokenManager, MemoryTokenStorage, TokenRefresher } from '../tokenManager';
import { ApiError, TimeoutError, NetworkError } from '../errors';
import { notificationCenter, NotificationMessage } from '../notifications';

const BASE_URL = 'https://api.example.com';

describe('ApiClient', () => {
	let originalFetch: any;
	let unsubscribe: (() => void) | null = null;
	let notifications: NotificationMessage[];

	beforeAll(() => {
		originalFetch = global.fetch;
	});

	beforeEach(() => {
		notifications = [];
		unsubscribe?.();
		unsubscribe = notificationCenter.subscribe((n) => notifications.push(n));
		(global as any).fetch = jest.fn();
	});

	afterEach(() => {
		(global as any).fetch = originalFetch;
		unsubscribe?.();
		unsubscribe = null;
	});

	function mockResponse(status: number, body?: any) {
		return {
			ok: status >= 200 && status < 300,
			status,
			text: jest.fn().mockResolvedValue(body ? JSON.stringify(body) : ''),
		} as any as Response;
	}

	it('performs a simple GET request', async () => {
		(global as any).fetch.mockResolvedValue(mockResponse(200, { ok: true }));
		const client = new ApiClient({ baseUrl: BASE_URL });
		const res = await client.get<{ ok: boolean }>('/ping');
		expect(res.ok).toBe(true);
		expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/ping`, expect.any(Object));
	});

	it('retries on server error and succeeds', async () => {
		(global as any).fetch
			.mockResolvedValueOnce(mockResponse(500, { message: 'fail' }))
			.mockResolvedValueOnce(mockResponse(200, { ok: true }));
		const client = new ApiClient({ baseUrl: BASE_URL, maxRetries: 1, retryDelayMs: 1 });
		const res = await client.get<{ ok: boolean }>('/retry');
		expect(res.ok).toBe(true);
		expect((global as any).fetch).toHaveBeenCalledTimes(2);
	});

	it('throws ApiError on client error and notifies', async () => {
		(global as any).fetch.mockResolvedValue(mockResponse(404, { message: 'Not found' }));
		const client = new ApiClient({ baseUrl: BASE_URL, maxRetries: 0 });
		await expect(client.get('/missing')).rejects.toBeInstanceOf(ApiError);
		expect(notifications.some((n) => n.type === 'error')).toBe(true);
	});

	it('refreshes token on 401 and retries', async () => {
		const storage = new MemoryTokenStorage();
		storage.set({ accessToken: 'old', refreshToken: 'r1', expiresAt: Date.now() - 1000 });
		const refresher: TokenRefresher = { refresh: jest.fn().mockResolvedValue({ accessToken: 'new', refreshToken: 'r2', expiresAt: Date.now() + 3600_000 }) };
		const tokenManager = new TokenManager(storage, refresher);

		(global as any).fetch
			.mockResolvedValueOnce(mockResponse(401, { message: 'expired' }))
			.mockResolvedValueOnce(mockResponse(200, { ok: true }));

		const client = new ApiClient({ baseUrl: BASE_URL }, tokenManager);
		const res = await client.get<{ ok: boolean }>('/secure');
		expect(res.ok).toBe(true);
		expect(refresher.refresh).toHaveBeenCalledWith('r1');
	});

	it('times out requests and notifies', async () => {
		(global as any).fetch.mockImplementation(() => new Promise(() => {}));
		const client = new ApiClient({ baseUrl: BASE_URL, timeoutMs: 10, maxRetries: 0 });
		await expect(client.get('/slow')).rejects.toBeInstanceOf(TimeoutError);
		expect(notifications.find((n) => n.type === 'warning')).toBeTruthy();
	});

	it('handles network errors and notifies', async () => {
		(global as any).fetch.mockRejectedValue(new Error('ECONNRESET'));
		const client = new ApiClient({ baseUrl: BASE_URL, maxRetries: 0 });
		await expect(client.get('/neterr')).rejects.toBeInstanceOf(NetworkError);
		expect(notifications.find((n) => n.type === 'error')).toBeTruthy();
	});
});
