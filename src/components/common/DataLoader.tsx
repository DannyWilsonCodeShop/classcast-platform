import React, { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface DataLoaderProps<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	children: (data: T) => ReactNode;
	loadingFallback?: ReactNode;
	errorFallback?: (error: string) => ReactNode;
	emptyFallback?: ReactNode;
	showEmpty?: boolean;
}

function DataLoader<T>({
	data,
	loading,
	error,
	children,
	loadingFallback,
	errorFallback,
	emptyFallback,
	showEmpty = false,
}: DataLoaderProps<T>) {
	if (loading) {
		return loadingFallback ? (
			<>{loadingFallback}</>
		) : (
			<LoadingSpinner text="Loading..." />
		);
	}

	if (error) {
		return errorFallback ? (
			<>{errorFallback(error)}</>
		) : (
			<div className="text-center py-8">
				<div className="text-red-600 mb-2">
					<svg
						className="w-12 h-12 mx-auto"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">Error loading data</h3>
				<p className="text-gray-600">{error}</p>
			</div>
		);
	}

	if (showEmpty && (!data || (Array.isArray(data) && data.length === 0))) {
		return emptyFallback ? (
			<>{emptyFallback}</>
		) : (
			<div className="text-center py-8">
				<div className="text-gray-400 mb-2">
					<svg
						className="w-12 h-12 mx-auto"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
				<p className="text-gray-600">There are no items to display.</p>
			</div>
		);
	}

	if (!data) {
		return null;
	}

	return <>{children(data)}</>;
}

export default DataLoader;
