import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentManagement, { AssignmentWithStats } from '../AssignmentManagement';
import { AssignmentStatus, AssignmentType } from '@/types/dynamodb';

// Mock the editor and datepicker used by AssignmentCreationForm to keep tests focused
jest.mock('../TipTapEditor', () => {
	return function MockTipTapEditor({ value, onChange, placeholder }: any) {
		return (
			<div data-testid="rich-text-editor">
				<textarea
					id="description"
					data-testid="description-input"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="min-h-[200px] w-full p-2 border rounded"
				/>
			</div>
		);
	};
});

jest.mock('react-datepicker', () => {
	return function MockDatePicker({ selected, onChange, placeholderText, className }: any) {
		return (
			<input
				id="dueDate"
				data-testid="date-picker"
				type="text"
				value={selected ? selected.toISOString().split('T')[0] : ''}
				onChange={(e) => {
					const d = new Date(e.target.value);
					if (!isNaN(d.getTime())) onChange(d);
				}}
				placeholder={placeholderText}
				className={className}
			/>
		);
	};
});

const makeAssignments = (): AssignmentWithStats[] => [
	{
		assignmentId: 'a1',
		title: 'Essay 1',
		description: 'First essay',
		assignmentType: AssignmentType.ESSAY,
		status: AssignmentStatus.DRAFT,
		dueDate: new Date(Date.now() + 86400000).toISOString(),
		maxScore: 100,
		totalSubmissions: 10,
		gradedSubmissions: 6,
		averageScore: 80,
		completionRate: 60,
	},
	{
		assignmentId: 'a2',
		title: 'Quiz A',
		description: 'Ch 1-3',
		assignmentType: AssignmentType.QUIZ,
		status: AssignmentStatus.PUBLISHED,
		dueDate: new Date(Date.now() + 172800000).toISOString(),
		maxScore: 20,
		totalSubmissions: 20,
		gradedSubmissions: 20,
		averageScore: 16,
		completionRate: 100,
	},
];

describe('AssignmentManagement', () => {
	it('renders list and basic fields', () => {
		render(
			<AssignmentManagement assignments={makeAssignments()} />
		);
		expect(screen.getByRole('table', { name: 'assignments-table' })).toBeInTheDocument();
		expect(screen.getByText('Essay 1')).toBeInTheDocument();
		expect(screen.getByText('Quiz A')).toBeInTheDocument();
	});

	it('filters by status and search query', async () => {
		const user = userEvent.setup();
		render(<AssignmentManagement assignments={makeAssignments()} />);

		await user.type(screen.getByLabelText('Search assignments'), 'Essay');
		expect(screen.getByText('Essay 1')).toBeInTheDocument();
		expect(screen.queryByText('Quiz A')).not.toBeInTheDocument();

		await user.clear(screen.getByLabelText('Search assignments'));
		await user.selectOptions(screen.getByLabelText('Filter by status'), AssignmentStatus.PUBLISHED);
		expect(screen.getByText('Quiz A')).toBeInTheDocument();
		expect(screen.queryByText('Essay 1')).not.toBeInTheDocument();
	});

	it('changes status via dropdown', async () => {
		const onStatusChange = jest.fn();
		const user = userEvent.setup();
		render(
			<AssignmentManagement assignments={makeAssignments()} onStatusChange={onStatusChange} />
		);
		const select = screen.getByLabelText('Status for Essay 1');
		await user.selectOptions(select, AssignmentStatus.PUBLISHED);
		expect(onStatusChange).toHaveBeenCalledWith('a1', AssignmentStatus.PUBLISHED);
	});

	it('opens edit modal and submits updates', async () => {
		const onUpdateAssignment = jest.fn();
		const user = userEvent.setup();
		render(
			<AssignmentManagement assignments={makeAssignments()} onUpdateAssignment={onUpdateAssignment} />
		);
		await user.click(screen.getByRole('button', { name: 'Edit Essay 1' }));
		// change title and description
		const titleInput = screen.getByLabelText('Assignment Title *');
		await user.clear(titleInput);
		await user.type(titleInput, 'Essay 1 - Updated');
		const desc = screen.getByTestId('description-input');
		await user.clear(desc);
		await user.type(desc, 'Updated description');

		// set a valid future date
		const dateInput = screen.getByTestId('date-picker');
		const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
		await user.clear(dateInput);
		await user.type(dateInput, future);

		await user.click(screen.getByRole('button', { name: 'Create Assignment' }));

		await waitFor(() => {
			expect(onUpdateAssignment).toHaveBeenCalled();
			const [assignmentId, payload] = onUpdateAssignment.mock.calls[0];
			expect(assignmentId).toBe('a1');
			expect(payload).toEqual(expect.objectContaining({
				title: 'Essay 1 - Updated',
				description: 'Updated description',
				status: AssignmentStatus.DRAFT,
			}));
		});
	});
});
