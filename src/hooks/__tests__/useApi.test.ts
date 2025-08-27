import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, useOptimisticApi } from '../useApi';
import { ApiClient } from '@/lib/apiClient';
import { ApiError } from '@/lib/errors';

// Mock ApiClient
const mockApiClient = {
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
} as unknown as ApiClient;

describe('useApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('initializes with default state', () => {
		const { result } = renderHook(() =>
			useApi(mockApiClient, jest.fn())
		);

		expect(result.current.data).toBeNull();
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('initializes with initial data', () => {
		const initialData = { id: '1', name: 'Test' };
		const { result } = renderHook(() =>
			useApi(mockApiClient, jest.fn(), { initialData })
		);

		expect(result.current.data).toEqual(initialData);
	});

	it('executes operation and updates state', async () => {
		const mockOperation = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
		const { result } = renderHook(() =>
			useApi(mockApiClient, mockOperation)
		);

		act(() => {
			result.current.execute('arg1', 'arg2');
		});

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.data).toEqual({ id: '1', name: 'Test' });
		expect(result.current.error).toBeNull();
		expect(mockOperation).toHaveBeenCalledWith(mockApiClient, 'arg1', 'arg2');
	});

	it('handles errors and updates state', async () => {
		const mockOperation = jest.fn().mockRejectedValue(new ApiError('Not found', 404));
		const { result } = renderHook(() =>
			useApi(mockApiClient, mockOperation)
		);

		act(() => {
			result.current.execute();
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe('Not found');
		expect(result.current.data).toBeNull();
	});

	it('calls onSuccess callback when operation succeeds', async () => {
		const mockOperation = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
		const onSuccess = jest.fn();
		const { result } = renderHook(() =>
			useApi(mockApiClient, mockOperation, { onSuccess })
		);

		act(() => {
			result.current.execute();
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(onSuccess).toHaveBeenCalledWith({ id: '1', name: 'Test' });
	});

	it('calls onError callback when operation fails', async () => {
		const mockOperation = jest.fn().mockRejectedValue(new ApiError('Not found', 404));
		const onError = jest.fn();
		const { result } = renderHook(() =>
			useApi(mockApiClient, mockOperation, { onError })
		);

		act(() => {
			result.current.execute();
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(onError).toHaveBeenCalledWith('Not found');
	});

	it('resets state when reset is called', () => {
		const initialData = { id: '1', name: 'Test' };
		const { result } = renderHook(() =>
			useApi(mockApiClient, jest.fn(), { initialData })
		);

		act(() => {
			result.current.setData({ id: '2', name: 'Updated' });
		});

		expect(result.current.data).toEqual({ id: '2', name: 'Updated' });

		act(() => {
			result.current.reset();
		});

		expect(result.current.data).toEqual(initialData);
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('cancels previous request when new one starts', async () => {
		const mockOperation = jest.fn().mockImplementation(() => new Promise(() => {}));
		const { result } = renderHook(() =>
			useApi(mockApiClient, mockOperation)
		);

		act(() => {
			result.current.execute();
		});

		expect(result.current.loading).toBe(true);

		act(() => {
			result.current.execute();
		});

		// Second execution should cancel the first one
		expect(mockOperation).toHaveBeenCalledTimes(2);
	});
});

describe('useOptimisticApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('initializes with initial data', () => {
		const initialData = { id: '1', name: 'Test' };
		const { result } = renderHook(() =>
			useOptimisticApi(mockApiClient, jest.fn(), {
				initialData,
				optimisticUpdate: (old, newData) => ({ ...old, ...newData }),
			})
		);

		expect(result.current.data).toEqual(initialData);
	});

	it('applies optimistic update immediately', async () => {
		const mockOperation = jest.fn().mockResolvedValue({ id: '1', name: 'Updated' });
		const { result } = renderHook(() =>
			useOptimisticApi(mockApiClient, mockOperation, {
				optimisticUpdate: (old, newData) => ({ ...old, ...newData }),
			})
		);

		act(() => {
			result.current.execute({ name: 'Optimistic' });
		});

		// Should immediately show optimistic data
		expect(result.current.data).toEqual({ name: 'Optimistic' });
	});

	it('reverts optimistic update on error', async () => {
		const mockOperation = jest.fn().mockRejectedValue(new ApiError('Failed', 500));
		const initialData = { id: '1', name: 'Original' };
		const { result } = renderHook(() =>
			useOptimisticApi(mockApiClient, mockOperation, {
				initialData,
				optimisticUpdate: (old, newData) => ({ ...old, ...newData }),
			})
		);

		act(() => {
			result.current.execute({ name: 'Optimistic' });
		});

		// Should show optimistic data initially
		expect(result.current.data).toEqual({ id: '1', name: 'Optimistic' });

		await waitFor(() => {
			expect(result.current.data).toEqual(initialData);
		});
	});

	it('updates with actual data on success', async () => {
		const mockOperation = jest.fn().mockResolvedValue({ id: '1', name: 'Actual' });
		const { result } = renderHook(() =>
			useOptimisticApi(mockApiClient, mockOperation, {
				optimisticUpdate: (old, newData) => ({ ...old, ...newData }),
			})
		);

		act(() => {
			result.current.execute({ name: 'Optimistic' });
		});

		await waitFor(() => {
			expect(result.current.data).toEqual({ id: '1', name: 'Actual' });
		});
	});
});
