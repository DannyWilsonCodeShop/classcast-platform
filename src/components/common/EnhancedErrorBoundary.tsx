import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorLogger from '@/lib/errorLogger';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	recoveryActions?: Array<{
		label: string;
		action: () => void;
		variant?: 'primary' | 'secondary' | 'danger';
	}>;
	showDetails?: boolean;
	enableLogging?: boolean;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	showDetails: boolean;
}

class EnhancedErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			showDetails: props.showDetails || false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ errorInfo });

		// Log error if enabled
		if (this.props.enableLogging !== false) {
			errorLogger.error('React Error Boundary caught an error', {
				error: error.message,
				stack: error.stack,
				componentStack: errorInfo.componentStack,
				url: window.location.href,
				timestamp: new Date().toISOString(),
			});
		}

		// Call custom error handler
		this.props.onError?.(error, errorInfo);

		// Log to console for development
		if (process.env.NODE_ENV === 'development') {
			console.error('Error Boundary caught an error:', error, errorInfo);
		}
	}

	private handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	private handleGoBack = () => {
		window.history.back();
	};

	private handleGoHome = () => {
		window.location.href = '/';
	};

	private toggleDetails = () => {
		this.setState(prev => ({ showDetails: !prev.showDetails }));
	};

	private copyErrorDetails = async () => {
		if (!this.state.error || !this.state.errorInfo) return;

		const errorDetails = {
			message: this.state.error.message,
			stack: this.state.error.stack,
			componentStack: this.state.errorInfo.componentStack,
			url: window.location.href,
			timestamp: new Date().toISOString(),
		};

		try {
			await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
			// You could show a toast notification here
		} catch (err) {
			console.warn('Failed to copy error details:', err);
		}
	};

	private exportErrorLog = async () => {
		try {
			const logs = await errorLogger.exportLogs();
			const blob = new Blob([logs], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.warn('Failed to export error logs:', err);
		}
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const defaultRecoveryActions = [
				{
					label: 'Try Again',
					action: this.handleRetry,
					variant: 'primary' as const,
				},
				{
					label: 'Go Back',
					action: this.handleGoBack,
					variant: 'secondary' as const,
				},
				{
					label: 'Go Home',
					action: this.handleGoHome,
					variant: 'secondary' as const,
				},
			];

			const recoveryActions = this.props.recoveryActions || defaultRecoveryActions;

			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
					<div className="max-w-2xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
						{/* Header */}
						<div className="bg-red-600 px-6 py-4">
							<div className="flex items-center">
								<svg
									className="w-8 h-8 text-white mr-3"
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
								<div>
									<h1 className="text-xl font-bold text-white">Something went wrong</h1>
									<p className="text-red-100 text-sm">
										We encountered an unexpected error and couldn't complete your request.
									</p>
								</div>
							</div>
						</div>

						{/* Content */}
						<div className="px-6 py-6">
							{/* Error Message */}
							<div className="mb-6">
								<h2 className="text-lg font-medium text-gray-900 mb-2">
									Error Details
								</h2>
								<p className="text-gray-600 mb-4">
									{this.state.error?.message || 'An unexpected error occurred'}
								</p>

								{/* Action Buttons */}
								<div className="flex flex-wrap gap-3 mb-4">
									{recoveryActions.map((action, index) => (
										<button
											key={index}
											onClick={action.action}
											className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
												action.variant === 'primary'
													? 'bg-blue-600 text-white hover:bg-blue-700'
													: action.variant === 'danger'
													? 'bg-red-600 text-white hover:bg-red-700'
													: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
											}`}
										>
											{action.label}
										</button>
									))}
								</div>

								{/* Utility Buttons */}
								<div className="flex flex-wrap gap-2">
									<button
										onClick={this.toggleDetails}
										className="text-sm text-blue-600 hover:text-blue-800 underline"
									>
										{this.state.showDetails ? 'Hide' : 'Show'} Technical Details
									</button>
									<button
										onClick={this.copyErrorDetails}
										className="text-sm text-blue-600 hover:text-blue-800 underline"
									>
										Copy Error Details
									</button>
									<button
										onClick={this.exportErrorLog}
										className="text-sm text-blue-600 hover:text-blue-800 underline"
									>
										Export Error Logs
									</button>
								</div>
							</div>

							{/* Technical Details */}
							{this.state.showDetails && (
								<div className="border-t border-gray-200 pt-4">
									<h3 className="text-md font-medium text-gray-900 mb-3">
										Technical Details
									</h3>
									
									{/* Error Stack */}
									{this.state.error?.stack && (
										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-700 mb-2">
												Error Stack
											</h4>
											<pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
												{this.state.error.stack}
											</pre>
										</div>
									)}

									{/* Component Stack */}
									{this.state.errorInfo?.componentStack && (
										<div className="mb-4">
											<h4 className="text-sm font-medium text-gray-700 mb-2">
												Component Stack
											</h4>
											<pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-32">
												{this.state.errorInfo.componentStack}
											</pre>
										</div>
									)}

									{/* Additional Context */}
									<div className="text-xs text-gray-500">
										<p>URL: {window.location.href}</p>
										<p>User Agent: {navigator.userAgent}</p>
										<p>Timestamp: {new Date().toLocaleString()}</p>
									</div>
								</div>
							)}

							{/* Help Section */}
							<div className="border-t border-gray-200 pt-4 mt-6">
								<h3 className="text-md font-medium text-gray-900 mb-2">Need Help?</h3>
								<p className="text-sm text-gray-600 mb-3">
									If this error persists, please contact support with the error details above.
								</p>
								<div className="flex gap-3">
									<button className="text-sm text-blue-600 hover:text-blue-800 underline">
										Contact Support
									</button>
									<button className="text-sm text-blue-600 hover:text-blue-800 underline">
										View Documentation
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default EnhancedErrorBoundary;
