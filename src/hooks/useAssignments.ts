import { useCallback } from 'react';
import { useApi, useOptimisticApi } from './useApi';
import { ApiClient } from '@/lib/apiClient';
import { Assignment, AssignmentStatus, AssignmentType } from '@/types/dynamodb';

// Simple in-memory cache for assignments
const assignmentsCache = new Map<string, any>();

export interface AssignmentFilters {
	status?: AssignmentStatus;
	type?: AssignmentType;
	courseId?: string;
	instructorId?: string;
}

export interface CreateAssignmentData {
	title: string;
	description: string;
	assignmentType: AssignmentType;
	courseId: string;
	instructorId: string;
	dueDate: string;
	maxScore: number;
	weight: number;
	requirements: string[];
	allowLateSubmissions: boolean;
	maxSubmissions: number;
	allowGroupSubmissions: boolean;
	maxGroupSize: number;
	allowedFileTypes: string[];
	rubric?: Array<{
		criterion: string;
		description: string;
		maxPoints: number;
		weight?: number;
	}>;
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {
	assignmentId: string;
}

export function useAssignments(apiClient: ApiClient) {
	const fetchAssignments = useCallback(
		async (client: ApiClient, filters?: AssignmentFilters): Promise<Assignment[]> => {
			const queryParams = new URLSearchParams();
			if (filters?.status) queryParams.append('status', filters.status);
			if (filters?.type) queryParams.append('type', filters.type);
			if (filters?.courseId) queryParams.append('courseId', filters.courseId);
			if (filters?.instructorId) queryParams.append('instructorId', filters.instructorId);

			const path = `/assignments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
			const cacheKey = `list:${path}`;
			if (assignmentsCache.has(cacheKey)) {
				return assignmentsCache.get(cacheKey);
			}
			const result = await client.get<Assignment[]>(path);
			assignmentsCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const fetchAssignment = useCallback(
		async (client: ApiClient, assignmentId: string): Promise<Assignment> => {
			const cacheKey = `item:${assignmentId}`;
			if (assignmentsCache.has(cacheKey)) {
				return assignmentsCache.get(cacheKey);
			}
			const result = await client.get<Assignment>(`/assignments/${assignmentId}`);
			assignmentsCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const createAssignment = useCallback(
		async (client: ApiClient, data: CreateAssignmentData): Promise<Assignment> => {
			const created = await client.post<Assignment>('/assignments', data);
			assignmentsCache.clear();
			return created;
		},
		[]
	);

	const updateAssignment = useCallback(
		async (client: ApiClient, data: UpdateAssignmentData): Promise<Assignment> => {
			const updated = await client.put<Assignment>(`/assignments/${data.assignmentId}`, data);
			assignmentsCache.set(`item:${updated.assignmentId}`, updated);
			for (const key of assignmentsCache.keys()) {
				if (key.startsWith('list:')) assignmentsCache.delete(key);
			}
			return updated;
		},
		[]
	);

	const deleteAssignment = useCallback(
		async (client: ApiClient, assignmentId: string): Promise<void> => {
			await client.delete<void>(`/assignments/${assignmentId}`);
			assignmentsCache.delete(`item:${assignmentId}`);
			for (const key of assignmentsCache.keys()) {
				if (key.startsWith('list:')) assignmentsCache.delete(key);
			}
		},
		[]
	);

	const updateAssignmentStatus = useCallback(
		async (client: ApiClient, assignmentId: string, status: AssignmentStatus): Promise<Assignment> => {
			const updated = await client.patch<Assignment>(`/assignments/${assignmentId}/status`, { status });
			assignmentsCache.set(`item:${updated.assignmentId}`, updated);
			for (const key of assignmentsCache.keys()) {
				if (key.startsWith('list:')) assignmentsCache.delete(key);
			}
			return updated;
		},
		[]
	);

	return {
		fetchAssignments: (filters?: AssignmentFilters) => useApi(apiClient, fetchAssignments, { initialData: [] }),
		fetchAssignment: (assignmentId: string) => useApi(apiClient, fetchAssignment),
		createAssignment: () => useApi(apiClient, createAssignment),
		updateAssignment: () => useOptimisticApi(apiClient, updateAssignment, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Assignment;
				return { ...oldData, ...newData };
			},
		}),
		deleteAssignment: () => useApi(apiClient, deleteAssignment),
		updateAssignmentStatus: () => useOptimisticApi(apiClient, updateAssignmentStatus, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Assignment;
				return { ...oldData, status: newData.status };
			},
		}),
	};
}
