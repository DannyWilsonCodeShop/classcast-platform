import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error('Test error message');
	}
	return <div>No error</div>;
};

describe('ErrorBoundary', () => {
	beforeEach(() => {
		// Suppress console.error for tests
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('renders children when there is no error', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>
		);

		expect(screen.getByText('No error')).toBeInTheDocument();
	});

	it('renders error UI when child throws error', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('We encountered an unexpected error. Please try refreshing the page.')).toBeInTheDocument();
		expect(screen.getByText('Error details')).toBeInTheDocument();
		expect(screen.getByText('Test error message')).toBeInTheDocument();
	});

	it('calls onError callback when error occurs', () => {
		const onError = jest.fn();
		render(
			<ErrorBoundary onError={onError}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(onError).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				componentStack: expect.any(String),
			})
		);
	});

	it('renders custom fallback when provided', () => {
		const customFallback = <div>Custom error message</div>;
		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(screen.getByText('Custom error message')).toBeInTheDocument();
		expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
	});

	it('shows refresh button and reloads page when clicked', () => {
		const reloadMock = jest.fn();
		Object.defineProperty(window, 'location', {
			value: { reload: reloadMock },
			writable: true,
		});

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const refreshButton = screen.getByText('Refresh Page');
		expect(refreshButton).toBeInTheDocument();

		fireEvent.click(refreshButton);
		expect(reloadMock).toHaveBeenCalled();
	});

	it('expands error details when clicked', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		const detailsElement = screen.getByText('Error details');
		expect(detailsElement).toBeInTheDocument();

		// Error details should be visible by default
		expect(screen.getByText('Test error message')).toBeInTheDocument();
	});

	it('logs error to console', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(console.error).toHaveBeenCalledWith(
			'ErrorBoundary caught an error:',
			expect.any(Error),
			expect.objectContaining({
				componentStack: expect.any(String),
			})
		);
	});
});
