// Course Colors TypeScript Interfaces

export interface CourseColor {
  colorId: number;
  colorName: string;
  hexCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface InstructorColorPreference {
  preferenceId: number;
  instructorId: string;
  courseId?: string;
  preferredColors: number[]; // Array of color IDs
  defaultColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseColorOption {
  name: string;
  value: string;
  description?: string;
}

// Default course color options
export const DEFAULT_COURSE_COLORS: CourseColorOption[] = [
  { name: 'Sky Blue', value: '#4A90E2', description: 'Professional and trustworthy' },
  { name: 'Coral', value: '#FF6F61', description: 'Energetic and creative' },
  { name: 'Golden Yellow', value: '#FFD166', description: 'Optimistic and bright' },
  { name: 'Mint Green', value: '#06D6A0', description: 'Fresh and calming' },
  { name: 'Lavender', value: '#9B5DE5', description: 'Creative and inspiring' },
  { name: 'Charcoal', value: '#333333', description: 'Professional and sophisticated' },
  { name: 'Ocean Blue', value: '#0077BE', description: 'Deep and reliable' },
  { name: 'Forest Green', value: '#228B22', description: 'Natural and growth-oriented' },
  { name: 'Sunset Orange', value: '#FF8C00', description: 'Warm and energetic' },
  { name: 'Royal Purple', value: '#800080', description: 'Luxurious and creative' },
  { name: 'Crimson Red', value: '#DC143C', description: 'Bold and attention-grabbing' },
  { name: 'Teal', value: '#008080', description: 'Balanced and professional' }
];

// Color utility functions
export const getColorName = (hexCode: string): string => {
  const color = DEFAULT_COURSE_COLORS.find(c => c.value === hexCode);
  return color?.name || 'Unknown Color';
};

export const getColorDescription = (hexCode: string): string => {
  const color = DEFAULT_COURSE_COLORS.find(c => c.value === hexCode);
  return color?.description || '';
};

export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export const getContrastColor = (hexColor: string): string => {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
