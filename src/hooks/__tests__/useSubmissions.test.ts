import { renderHook, act } from '@testing-library/react';
import { useSubmissions } from '../useSubmissions';
import { ApiClient } from '@/lib/apiClient';
import { Submission, SubmissionStatus } from '@/types/dynamodb';

const mockClient = {
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
} as unknown as ApiClient;

describe('useSubmissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches submissions and caches results', async () => {
		const submissions: Submission[] = [
			{ submissionId: 's1', assignmentId: 'a1', courseId: 'c1', studentId: 'u1', submittedAt: '', updatedAt: '', status: SubmissionStatus.SUBMITTED, files: [], metadata: { ipAddress: '', userAgent: '', submissionMethod: 'web' as any } },
		];
		(mockClient.get as any).mockResolvedValue(submissions);

		const { result } = renderHook(() => useSubmissions(mockClient).fetchSubmissions());
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});

	it('grades a submission with optimistic update', async () => {
		const initial: Submission = { submissionId: 's1', assignmentId: 'a1', courseId: 'c1', studentId: 'u1', submittedAt: '', updatedAt: '', status: SubmissionStatus.SUBMITTED, files: [], metadata: { ipAddress: '', userAgent: '', submissionMethod: 'web' as any } };
		const graded: Submission = { ...initial, status: SubmissionStatus.GRADED, grade: 95, feedback: 'Great job' } as any;
		(mockClient.patch as any).mockResolvedValue(graded);

		const { result } = renderHook(() => useSubmissions(mockClient).gradeSubmission());

		await act(async () => {
			await result.current.execute({ submissionId: 's1', grade: 95, feedback: 'Great job' });
		});

		expect(mockClient.patch).toHaveBeenCalled();
	});

	it('updates submission status with optimistic update', async () => {
		const updated: Submission = { submissionId: 's1', assignmentId: 'a1', courseId: 'c1', studentId: 'u1', submittedAt: '', updatedAt: '', status: SubmissionStatus.GRADED, files: [], metadata: { ipAddress: '', userAgent: '', submissionMethod: 'web' as any } };
		(mockClient.patch as any).mockResolvedValue(updated);
		const { result } = renderHook(() => useSubmissions(mockClient).updateSubmissionStatus());
		await act(async () => {
			await result.current.execute('s1', SubmissionStatus.GRADED);
		});
		expect(mockClient.patch).toHaveBeenCalled();
	});
});
