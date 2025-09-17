import { useCallback } from 'react';
import { useApi, useOptimisticApi } from './useApi';
import { ApiClient } from '@/lib/apiClient';
import { AssignmentSubmission as Submission, SubmissionStatus } from '@/types/dynamodb';

// Simple in-memory cache for submissions
const submissionsCache = new Map<string, any>();

export interface SubmissionFilters {
	assignmentId?: string;
	studentId?: string;
	status?: SubmissionStatus;
	courseId?: string;
}

export interface CreateSubmissionData {
	assignmentId: string;
	studentId: string;
	courseId: string;
	files: Array<{
		filename: string;
		contentType: string;
		size: number;
		url: string;
	}>;
	metadata: {
		ipAddress: string;
		userAgent: string;
		submissionMethod: string;
		submissionTime?: number;
	};
}

export interface UpdateSubmissionData extends Partial<CreateSubmissionData> {
	submissionId: string;
}

export interface GradeSubmissionData {
	submissionId: string;
	grade: number;
	feedback: string;
	rubricScores?: { [criterion: string]: number };
}

export function useSubmissions(apiClient: ApiClient) {
	const fetchSubmissions = useCallback(
		async (client: ApiClient, filters?: SubmissionFilters): Promise<Submission[]> => {
			const queryParams = new URLSearchParams();
			if (filters?.assignmentId) queryParams.append('assignmentId', filters.assignmentId);
			if (filters?.studentId) queryParams.append('studentId', filters.studentId);
			if (filters?.status) queryParams.append('status', filters.status);
			if (filters?.courseId) queryParams.append('courseId', filters.courseId);

			const path = `/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
			const cacheKey = `list:${path}`;
			if (submissionsCache.has(cacheKey)) {
				return submissionsCache.get(cacheKey);
			}
			const result = await client.get<Submission[]>(path);
			submissionsCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const fetchSubmission = useCallback(
		async (client: ApiClient, submissionId: string): Promise<Submission> => {
			const cacheKey = `item:${submissionId}`;
			if (submissionsCache.has(cacheKey)) {
				return submissionsCache.get(cacheKey);
			}
			const result = await client.get<Submission>(`/submissions/${submissionId}`);
			submissionsCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const createSubmission = useCallback(
		async (client: ApiClient, data: CreateSubmissionData): Promise<Submission> => {
			const created = await client.post<Submission>('/submissions', data);
			submissionsCache.clear();
			return created;
		},
		[]
	);

	const updateSubmission = useCallback(
		async (client: ApiClient, data: UpdateSubmissionData): Promise<Submission> => {
			const updated = await client.put<Submission>(`/submissions/${data.submissionId}`, data);
			submissionsCache.set(`item:${updated.submissionId}`, updated);
			for (const key of submissionsCache.keys()) {
				if (key.startsWith('list:')) submissionsCache.delete(key);
			}
			return updated;
		},
		[]
	);

	const deleteSubmission = useCallback(
		async (client: ApiClient, submissionId: string): Promise<void> => {
			await client.delete<void>(`/submissions/${submissionId}`);
			submissionsCache.delete(`item:${submissionId}`);
			for (const key of submissionsCache.keys()) {
				if (key.startsWith('list:')) submissionsCache.delete(key);
			}
		},
		[]
	);

	const gradeSubmission = useCallback(
		async (client: ApiClient, data: GradeSubmissionData): Promise<Submission> => {
			const updated = await client.patch<Submission>(`/submissions/${data.submissionId}/grade`, data);
			submissionsCache.set(`item:${updated.submissionId}`, updated);
			for (const key of submissionsCache.keys()) {
				if (key.startsWith('list:')) submissionsCache.delete(key);
			}
			return updated;
		},
		[]
	);

	const updateSubmissionStatus = useCallback(
		async (client: ApiClient, submissionId: string, status: SubmissionStatus): Promise<Submission> => {
			const updated = await client.patch<Submission>(`/submissions/${submissionId}/status`, { status });
			submissionsCache.set(`item:${updated.submissionId}`, updated);
			for (const key of submissionsCache.keys()) {
				if (key.startsWith('list:')) submissionsCache.delete(key);
			}
			return updated;
		},
		[]
	);

	return {
		fetchSubmissions: (filters?: SubmissionFilters) => useApi(apiClient, fetchSubmissions, { initialData: [] }),
		fetchSubmission: (submissionId: string) => useApi(apiClient, fetchSubmission),
		createSubmission: () => useApi(apiClient, createSubmission),
		updateSubmission: () => useOptimisticApi(apiClient, updateSubmission, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Submission;
				return { ...oldData, ...newData };
			},
		}),
		deleteSubmission: () => useApi(apiClient, deleteSubmission),
		gradeSubmission: () => useOptimisticApi(apiClient, gradeSubmission, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Submission;
				return {
					...oldData,
					grade: newData.grade,
					feedback: newData.feedback,
					rubricScores: newData.rubricScores,
					status: 'GRADED' as SubmissionStatus,
					gradedAt: new Date().toISOString(),
				};
			},
		}),
		updateSubmissionStatus: () => useOptimisticApi(apiClient, updateSubmissionStatus, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Submission;
				return { ...oldData, status: newData.status };
			},
		}),
	};
}
