import { useCallback } from 'react';
import { useApi, useOptimisticApi } from './useApi';
import { ApiClient } from '@/lib/apiClient';

export interface Grade {
	submissionId: string;
	assignmentId: string;
	studentId: string;
	courseId: string;
	grade: number;
	maxScore: number;
	feedback: string;
	rubricScores?: { [criterion: string]: number };
	gradedBy: string;
	gradedAt: string;
	updatedAt: string;
}

export interface GradeFilters {
	assignmentId?: string;
	studentId?: string;
	courseId?: string;
	gradedBy?: string;
}

export interface CreateGradeData {
	submissionId: string;
	assignmentId: string;
	studentId: string;
	courseId: string;
	grade: number;
	maxScore: number;
	feedback: string;
	rubricScores?: { [criterion: string]: number };
	gradedBy: string;
}

export interface UpdateGradeData extends Partial<CreateGradeData> {
	submissionId: string;
}

export interface BatchGradeData {
	grades: Array<{
		submissionId: string;
		grade: number;
		feedback: string;
		rubricScores?: { [criterion: string]: number };
	}>;
	gradedBy: string;
}

// Simple in-memory cache for grades
const gradesCache = new Map<string, any>();

export function useGrades(apiClient: ApiClient) {
	const fetchGrades = useCallback(
		async (client: ApiClient, filters?: GradeFilters): Promise<Grade[]> => {
			const queryParams = new URLSearchParams();
			if (filters?.assignmentId) queryParams.append('assignmentId', filters.assignmentId);
			if (filters?.studentId) queryParams.append('studentId', filters.studentId);
			if (filters?.courseId) queryParams.append('courseId', filters.courseId);
			if (filters?.gradedBy) queryParams.append('gradedBy', filters.gradedBy);

			const path = `/grades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
			const cacheKey = `list:${path}`;
			if (gradesCache.has(cacheKey)) {
				return gradesCache.get(cacheKey);
			}
			const result = await client.get<Grade[]>(path);
			gradesCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const fetchGrade = useCallback(
		async (client: ApiClient, submissionId: string): Promise<Grade> => {
			const cacheKey = `item:${submissionId}`;
			if (gradesCache.has(cacheKey)) {
				return gradesCache.get(cacheKey);
			}
			const result = await client.get<Grade>(`/grades/${submissionId}`);
			gradesCache.set(cacheKey, result);
			return result;
		},
		[]
	);

	const createGrade = useCallback(
		async (client: ApiClient, data: CreateGradeData): Promise<Grade> => {
			const created = await client.post<Grade>('/grades', data);
			gradesCache.clear();
			return created;
		},
		[]
	);

	const updateGrade = useCallback(
		async (client: ApiClient, data: UpdateGradeData): Promise<Grade> => {
			const updated = await client.put<Grade>(`/grades/${data.submissionId}`, data);
			gradesCache.set(`item:${updated.submissionId}`, updated);
			for (const key of gradesCache.keys()) {
				if (key.startsWith('list:')) gradesCache.delete(key);
			}
			return updated;
		},
		[]
	);

	const deleteGrade = useCallback(
		async (client: ApiClient, submissionId: string): Promise<void> => {
			await client.delete<void>(`/grades/${submissionId}`);
			gradesCache.delete(`item:${submissionId}`);
			for (const key of gradesCache.keys()) {
				if (key.startsWith('list:')) gradesCache.delete(key);
			}
		},
		[]
	);

	const batchGrade = useCallback(
		async (client: ApiClient, data: BatchGradeData): Promise<Grade[]> => {
			const result = await client.post<Grade[]>('/grades/batch', data);
			gradesCache.clear();
			return result;
		},
		[]
	);

	const getGradeStatistics = useCallback(
		async (client: ApiClient, assignmentId: string): Promise<{
			totalSubmissions: number;
			gradedSubmissions: number;
			averageGrade: number;
			gradeDistribution: { [grade: string]: number };
		}> => {
			const cacheKey = `stats:${assignmentId}`;
			if (gradesCache.has(cacheKey)) {
				return gradesCache.get(cacheKey);
			}
			const stats = await client.get(`/grades/statistics/${assignmentId}`);
			gradesCache.set(cacheKey, stats);
			return stats;
		},
		[]
	);

	return {
		fetchGrades: (filters?: GradeFilters) => useApi(apiClient, fetchGrades, { initialData: [] }),
		fetchGrade: (submissionId: string) => useApi(apiClient, fetchGrade),
		createGrade: () => useApi(apiClient, createGrade),
		updateGrade: () => useOptimisticApi(apiClient, updateGrade, {
			optimisticUpdate: (oldData, newData) => {
				if (!oldData) return newData as Grade;
				return { ...oldData, ...newData, updatedAt: new Date().toISOString() };
			},
		}),
		deleteGrade: () => useApi(apiClient, deleteGrade),
		batchGrade: () => useApi(apiClient, batchGrade),
		getGradeStatistics: (assignmentId: string) => useApi(apiClient, getGradeStatistics),
	};
}
