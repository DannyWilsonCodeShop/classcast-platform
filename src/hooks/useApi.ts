import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiClient } from '@/lib/apiClient';
import { ApiError } from '@/lib/errors';

export interface UseApiState<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
}

export interface UseApiOptions<T> {
	initialData?: T;
	onSuccess?: (data: T) => void;
	onError?: (error: string) => void;
	optimisticUpdate?: (oldData: T | null, newData: T) => T;
}

export interface UseApiReturn<T> extends UseApiState<T> {
	execute: (...args: any[]) => Promise<T | null>;
	reset: () => void;
	setData: (data: T) => void;
}

export function useApi<T>(
	apiClient: ApiClient,
	operation: (client: ApiClient, ...args: any[]) => Promise<T>,
	options: UseApiOptions<T> = {}
): UseApiReturn<T> {
	const [state, setState] = useState<UseApiState<T>>({
		data: options.initialData ?? null,
		loading: false,
		error: null,
	});

	const abortControllerRef = useRef<AbortController | null>(null);

	const execute = useCallback(
		async (...args: any[]): Promise<T | null> => {
			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			const controller = new AbortController();
			abortControllerRef.current = controller;

			setState(prev => ({ ...prev, loading: true, error: null }));

			try {
				const result = await operation(apiClient, ...args);
				
				if (!controller.signal.aborted) {
					setState(prev => ({ ...prev, data: result, loading: false }));
					options.onSuccess?.(result);
				}
				
				return result;
			} catch (error) {
				if (!controller.signal.aborted) {
					const errorMessage = error instanceof ApiError ? error.message : 'An unexpected error occurred';
					setState(prev => ({ ...prev, error: errorMessage, loading: false }));
					options.onError?.(errorMessage);
				}
				return null;
			}
		},
		[apiClient, operation, options.onSuccess, options.onError]
	);

	const reset = useCallback(() => {
		setState({
			data: options.initialData ?? null,
			loading: false,
			error: null,
		});
	}, [options.initialData]);

	const setData = useCallback((data: T) => {
		setState(prev => ({ ...prev, data }));
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	return {
		...state,
		execute,
		reset,
		setData,
	};
}

export function useOptimisticApi<T>(
	apiClient: ApiClient,
	operation: (client: ApiClient, ...args: any[]) => Promise<T>,
	options: UseApiOptions<T> & { optimisticUpdate: (oldData: T | null, newData: T) => T }
): UseApiReturn<T> {
	const [optimisticData, setOptimisticData] = useState<T | null>(options.initialData ?? null);
	const [actualData, setActualData] = useState<T | null>(options.initialData ?? null);

	const execute = useCallback(
		async (...args: any[]): Promise<T | null> => {
			const newData = options.optimisticUpdate(actualData, args[0]);
			setOptimisticData(newData);

			try {
				const result = await operation(apiClient, ...args);
				setActualData(result);
				setOptimisticData(result);
				options.onSuccess?.(result);
				return result;
			} catch (error) {
				// Revert optimistic update on error
				setOptimisticData(actualData);
				const errorMessage = error instanceof ApiError ? error.message : 'An unexpected error occurred';
				options.onError?.(errorMessage);
				return null;
			}
		},
		[apiClient, operation, actualData, options]
	);

	const reset = useCallback(() => {
		setOptimisticData(options.initialData ?? null);
		setActualData(options.initialData ?? null);
	}, [options.initialData]);

	const setData = useCallback((data: T) => {
		setOptimisticData(data);
		setActualData(data);
	}, []);

	return {
		data: optimisticData,
		loading: false,
		error: null,
		execute,
		reset,
		setData,
	};
}
