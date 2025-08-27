import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedErrorBoundary from '../EnhancedErrorBoundary';
import errorLogger from '@/lib/errorLogger';

// Mock errorLogger
jest.mock('@/lib/errorLogger');
const mockErrorLogger = errorLogger as jest.Mocked<typeof errorLogger>;

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error('Test error message');
	}
	return <div>No error</div>;
};

// Mock clipboard API
const mockClipboard = {
	writeText: jest.fn(),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
Object.assign(URL, {
	createObjectURL: mockCreateObjectURL,
	revokeObjectURL: mockRevokeObjectURL,
});

describe('EnhancedErrorBoundary', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'error').mockImplementation(() => {});
		mockErrorLogger.error.mockResolvedValue();
		mockErrorLogger.exportLogs.mockResolvedValue('{"logs": []}');
		mockCreateObjectURL.mockReturnValue('blob:test');
		mockRevokeObjectURL.mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('renders children when there is no error', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={false} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('No error')).toBeInTheDocument();
	});

	it('renders enhanced error UI when child throws error', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
		expect(screen.getByText('We encountered an unexpected error and couldn\'t complete your request.')).toBeInTheDocument();
		expect(screen.getByText('Error Details')).toBeInTheDocument();
		expect(screen.getByText('Test error message')).toBeInTheDocument();
	});

	it('calls onError callback when error occurs', () => {
		const onError = jest.fn();
		render(
			<EnhancedErrorBoundary onError={onError}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
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
			<EnhancedErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Custom error message')).toBeInTheDocument();
		expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
	});

	it('shows default recovery actions', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Try Again')).toBeInTheDocument();
		expect(screen.getByText('Go Back')).toBeInTheDocument();
		expect(screen.getByText('Go Home')).toBeInTheDocument();
	});

	it('shows custom recovery actions when provided', () => {
		const customActions = [
			{ label: 'Custom Action', action: jest.fn(), variant: 'danger' as const },
		];

		render(
			<EnhancedErrorBoundary recoveryActions={customActions}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Custom Action')).toBeInTheDocument();
		expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
	});

	it('handles retry action', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const retryButton = screen.getByText('Try Again');
		fireEvent.click(retryButton);

		expect(screen.getByText('No error')).toBeInTheDocument();
	});

	it('handles go back action', () => {
		const mockBack = jest.fn();
		Object.defineProperty(window, 'history', {
			value: { back: mockBack },
			writable: true,
		});

		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const goBackButton = screen.getByText('Go Back');
		fireEvent.click(goBackButton);

		expect(mockBack).toHaveBeenCalled();
	});

	it('handles go home action', () => {
		const mockLocation = jest.fn();
		Object.defineProperty(window, 'location', {
			value: { href: 'http://localhost', assign: mockLocation },
			writable: true,
		});

		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const goHomeButton = screen.getByText('Go Home');
		fireEvent.click(goHomeButton);

		expect(mockLocation).toHaveBeenCalledWith('/');
	});

	it('toggles technical details visibility', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		// Technical details should be hidden by default
		expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();

		// Click to show details
		const toggleButton = screen.getByText('Show Technical Details');
		fireEvent.click(toggleButton);

		expect(screen.getByText('Technical Details')).toBeInTheDocument();
		expect(screen.getByText('Hide Technical Details')).toBeInTheDocument();

		// Click to hide details
		fireEvent.click(toggleButton);
		expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
	});

	it('copies error details to clipboard', async () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const copyButton = screen.getByText('Copy Error Details');
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(mockClipboard.writeText).toHaveBeenCalledWith(
				expect.stringContaining('Test error message')
			);
		});
	});

	it('exports error logs', async () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const exportButton = screen.getByText('Export Error Logs');
		fireEvent.click(exportButton);

		await waitFor(() => {
			expect(mockErrorLogger.exportLogs).toHaveBeenCalled();
			expect(mockCreateObjectURL).toHaveBeenCalled();
		});
	});

	it('logs error when logging is enabled', () => {
		render(
			<EnhancedErrorBoundary enableLogging={true}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(mockErrorLogger.error).toHaveBeenCalledWith(
			'React Error Boundary caught an error',
			expect.objectContaining({
				error: 'Test error message',
				stack: expect.any(String),
				componentStack: expect.any(String),
				url: window.location.href,
				timestamp: expect.any(String),
			})
		);
	});

	it('does not log error when logging is disabled', () => {
		render(
			<EnhancedErrorBoundary enableLogging={false}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(mockErrorLogger.error).not.toHaveBeenCalled();
	});

	it('shows error stack trace in technical details', () => {
		render(
			<EnhancedErrorBoundary showDetails={true}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Technical Details')).toBeInTheDocument();
		expect(screen.getByText('Error Stack')).toBeInTheDocument();
		expect(screen.getByText('Component Stack')).toBeInTheDocument();
	});

	it('shows browser context information', () => {
		render(
			<EnhancedErrorBoundary showDetails={true}>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText(/URL:/)).toBeInTheDocument();
		expect(screen.getByText(/User Agent:/)).toBeInTheDocument();
		expect(screen.getByText(/Timestamp:/)).toBeInTheDocument();
	});

	it('shows help section with support options', () => {
		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		expect(screen.getByText('Need Help?')).toBeInTheDocument();
		expect(screen.getByText('Contact Support')).toBeInTheDocument();
		expect(screen.getByText('View Documentation')).toBeInTheDocument();
	});

	it('handles clipboard API errors gracefully', async () => {
		mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const copyButton = screen.getByText('Copy Error Details');
		fireEvent.click(copyButton);

		// Should not throw error
		await waitFor(() => {
			expect(mockClipboard.writeText).toHaveBeenCalled();
		});
	});

	it('handles export errors gracefully', async () => {
		mockErrorLogger.exportLogs.mockRejectedValue(new Error('Export error'));

		render(
			<EnhancedErrorBoundary>
				<ThrowError shouldThrow={true} />
			</EnhancedErrorBoundary>
		);

		const exportButton = screen.getByText('Export Error Logs');
		fireEvent.click(exportButton);

		// Should not throw error
		await waitFor(() => {
			expect(mockErrorLogger.exportLogs).toHaveBeenCalled();
		});
	});
});
