export interface Section {
  sectionId: string;
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateSectionRequest {
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
}

export interface UpdateSectionRequest extends Partial<CreateSectionRequest> {
  sectionId: string;
  isActive?: boolean;
}
