import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
	it('renders with default size and no text', () => {
		render(<LoadingSpinner />);
		
		const spinner = screen.getByRole('status');
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass('w-8', 'h-8');
		expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
	});

	it('renders with small size', () => {
		render(<LoadingSpinner size="sm" />);
		
		const spinner = screen.getByRole('status');
		expect(spinner).toHaveClass('w-4', 'h-4');
	});

	it('renders with large size', () => {
		render(<LoadingSpinner size="lg" />);
		
		const spinner = screen.getByRole('status');
		expect(spinner).toHaveClass('w-12', 'h-12');
	});

	it('renders with custom text', () => {
		render(<LoadingSpinner text="Please wait..." />);
		
		expect(screen.getByText('Please wait...')).toBeInTheDocument();
	});

	it('renders with custom className', () => {
		render(<LoadingSpinner className="custom-class" />);
		
		const container = screen.getByRole('status').parentElement;
		expect(container).toHaveClass('custom-class');
	});

	it('has proper accessibility attributes', () => {
		render(<LoadingSpinner />);
		
		const spinner = screen.getByRole('status');
		expect(spinner).toHaveAttribute('aria-label', 'Loading');
	});

	it('applies correct CSS classes for animation', () => {
		render(<LoadingSpinner />);
		
		const spinner = screen.getByRole('status');
		expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-2', 'border-gray-300', 'border-t-blue-600');
	});
});
