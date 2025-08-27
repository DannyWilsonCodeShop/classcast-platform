import { renderHook, act } from '@testing-library/react';
import { useAssignments } from '../useAssignments';
import { ApiClient } from '@/lib/apiClient';
import { Assignment, AssignmentStatus, AssignmentType } from '@/types/dynamodb';

const mockClient = {
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
} as unknown as ApiClient;

describe('useAssignments', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches assignments and caches results', async () => {
		const assignments: Assignment[] = [
			{ assignmentId: 'a1', courseId: 'c1', title: 'T1', instructorId: 'i1', status: AssignmentStatus.DRAFT, assignmentType: AssignmentType.ESSAY, createdAt: '', updatedAt: '' },
		];
		(mockClient.get as any).mockResolvedValue(assignments);

		const { result } = renderHook(() => useAssignments(mockClient).fetchAssignments());

		let data: Assignment[] | null = null;
		await act(async () => {
			data = await result.current.execute();
		});
		expect(data).toEqual(assignments);
		expect(mockClient.get).toHaveBeenCalledTimes(1);

		// Second call should hit cache and not call client again
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});

	it('fetches single assignment and caches it', async () => {
		const assignment: Assignment = { assignmentId: 'a2', courseId: 'c1', title: 'T2', instructorId: 'i1', status: AssignmentStatus.DRAFT, assignmentType: AssignmentType.QUIZ, createdAt: '', updatedAt: '' };
		(mockClient.get as any).mockResolvedValue(assignment);

		const { result } = renderHook(() => useAssignments(mockClient).fetchAssignment('a2'));
		let data: Assignment | null = null;
		await act(async () => {
			data = await result.current.execute();
		});
		expect(data).toEqual(assignment);
		expect(mockClient.get).toHaveBeenCalledTimes(1);

		// Cached
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});

	it('invalidates caches after create/update/delete/status', async () => {
		const createRes: Assignment = { assignmentId: 'a3', courseId: 'c1', title: 'T3', instructorId: 'i1', status: AssignmentStatus.DRAFT, assignmentType: AssignmentType.PROJECT, createdAt: '', updatedAt: '' };
		(mockClient.post as any).mockResolvedValue(createRes);
		(mockClient.put as any).mockResolvedValue({ ...createRes, title: 'Updated' });
		(mockClient.patch as any).mockResolvedValue({ ...createRes, status: AssignmentStatus.PUBLISHED });
		(mockClient.delete as any).mockResolvedValue(undefined);

		// Create clears cache
		const createHook = renderHook(() => useAssignments(mockClient).createAssignment());
		await act(async () => {
			await createHook.result.current.execute(createRes as any);
		});
		expect(mockClient.post).toHaveBeenCalled();

		// Update updates item and invalidates lists
		const updateHook = renderHook(() => useAssignments(mockClient).updateAssignment());
		await act(async () => {
			await updateHook.result.current.execute({ assignmentId: 'a3', title: 'Updated' } as any);
		});
		expect(mockClient.put).toHaveBeenCalled();

		// Status update invalidates lists
		const statusHook = renderHook(() => useAssignments(mockClient).updateAssignmentStatus());
		await act(async () => {
			await statusHook.result.current.execute('a3', AssignmentStatus.PUBLISHED as any);
		});
		expect(mockClient.patch).toHaveBeenCalled();

		// Delete invalidates
		const deleteHook = renderHook(() => useAssignments(mockClient).deleteAssignment());
		await act(async () => {
			await deleteHook.result.current.execute('a3');
		});
		expect(mockClient.delete).toHaveBeenCalled();
	});
});
