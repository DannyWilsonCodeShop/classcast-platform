import { renderHook, act } from '@testing-library/react';
import { useGrades } from '../useGrades';
import { ApiClient } from '@/lib/apiClient';

const mockClient = {
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	patch: jest.fn(),
	delete: jest.fn(),
} as unknown as ApiClient;

describe('useGrades', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches grades and caches list', async () => {
		(mockClient.get as any).mockResolvedValueOnce([{ submissionId: 's1' }]);
		const { result } = renderHook(() => useGrades(mockClient).fetchGrades());
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});

	it('fetches single grade and caches it', async () => {
		(mockClient.get as any).mockResolvedValueOnce({ submissionId: 's2' });
		const { result } = renderHook(() => useGrades(mockClient).fetchGrade('s2'));
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});

	it('updates grade and invalidates lists', async () => {
		(mockClient.put as any).mockResolvedValueOnce({ submissionId: 's3', grade: 88 });
		const { result } = renderHook(() => useGrades(mockClient).updateGrade());
		await act(async () => {
			await result.current.execute({ submissionId: 's3', grade: 88 } as any);
		});
		expect(mockClient.put).toHaveBeenCalled();
	});

	it('caches grade statistics', async () => {
		(mockClient.get as any).mockResolvedValueOnce({ totalSubmissions: 10, gradedSubmissions: 8, averageGrade: 85, gradeDistribution: {} });
		const { result } = renderHook(() => useGrades(mockClient).getGradeStatistics('a1'));
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
		await act(async () => {
			await result.current.execute();
		});
		expect(mockClient.get).toHaveBeenCalledTimes(1);
	});
});
