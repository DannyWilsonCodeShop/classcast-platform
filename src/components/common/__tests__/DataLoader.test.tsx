import React from 'react';
import { render, screen } from '@testing-library/react';
import DataLoader from '../DataLoader';

describe('DataLoader', () => {
	it('renders children when data is available', () => {
		const mockData = { id: '1', name: 'Test' };
		render(
			<DataLoader data={mockData} loading={false} error={null}>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Data: Test')).toBeInTheDocument();
	});

	it('shows loading spinner when loading', () => {
		render(
			<DataLoader data={null} loading={true} error={null}>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('shows custom loading fallback when provided', () => {
		const customLoading = <div>Custom loading...</div>;
		render(
			<DataLoader 
				data={null} 
				loading={true} 
				error={null}
				loadingFallback={customLoading}
			>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Custom loading...')).toBeInTheDocument();
		expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
	});

	it('shows error message when error occurs', () => {
		const errorMessage = 'Failed to load data';
		render(
			<DataLoader data={null} loading={false} error={errorMessage}>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Error loading data')).toBeInTheDocument();
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it('shows custom error fallback when provided', () => {
		const customError = (error: string) => <div>Custom error: {error}</div>;
		const errorMessage = 'Failed to load data';
		render(
			<DataLoader 
				data={null} 
				loading={false} 
				error={errorMessage}
				errorFallback={customError}
			>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Custom error: Failed to load data')).toBeInTheDocument();
		expect(screen.queryByText('Error loading data')).not.toBeInTheDocument();
	});

	it('shows empty state when showEmpty is true and data is empty array', () => {
		render(
			<DataLoader data={[]} loading={false} error={null} showEmpty={true}>
				{(data) => <div>Data count: {data.length}</div>}
			</DataLoader>
		);

		expect(screen.getByText('No data found')).toBeInTheDocument();
		expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
	});

	it('shows custom empty fallback when provided', () => {
		const customEmpty = <div>Custom empty state</div>;
		render(
			<DataLoader 
				data={[]} 
				loading={false} 
				error={null} 
				showEmpty={true}
				emptyFallback={customEmpty}
			>
				{(data) => <div>Data count: {data.length}</div>}
			</DataLoader>
		);

		expect(screen.getByText('Custom empty state')).toBeInTheDocument();
		expect(screen.queryByText('No data found')).not.toBeInTheDocument();
	});

	it('renders nothing when data is null and showEmpty is false', () => {
		const { container } = render(
			<DataLoader data={null} loading={false} error={null}>
				{(data) => <div>Data: {data.name}</div>}
			</DataLoader>
		);

		expect(container.firstChild).toBeNull();
	});

	it('handles array data correctly', () => {
		const mockData = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
		render(
			<DataLoader data={mockData} loading={false} error={null}>
				{(data) => (
					<div>
						{data.map(item => (
							<div key={item.id}>{item.name}</div>
						))}
					</div>
				)}
			</DataLoader>
		);

		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('shows empty state for empty array when showEmpty is true', () => {
		render(
			<DataLoader data={[]} loading={false} error={null} showEmpty={true}>
				{(data) => <div>Data count: {data.length}</div>}
			</DataLoader>
		);

		expect(screen.getByText('No data found')).toBeInTheDocument();
	});
});
