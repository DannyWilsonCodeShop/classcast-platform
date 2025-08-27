export interface ValidationRule<T = any> {
	validate: (value: T) => boolean | string;
	message: string;
	severity?: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
	errors: string[];
	warnings: string[];
	info: string[];
}

export interface ValidationSchema<T = any> {
	[key: string]: ValidationRule<T>[];
}

export interface ValidationOptions {
	validateOnChange?: boolean;
	validateOnBlur?: boolean;
	debounceMs?: number;
	showWarnings?: boolean;
	showInfo?: boolean;
}

export class ValidationError extends Error {
	constructor(
		message: string,
		public field: string,
		public value: any
	) {
		super(message);
		this.name = 'ValidationError';
	}
}

// Input sanitization functions
export const InputSanitizer = {
	// Remove HTML tags and dangerous characters
	stripHtml: (value: string): string => {
		return value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
	},

	// Normalize whitespace
	normalizeWhitespace: (value: string): string => {
		return value.replace(/\s+/g, ' ').trim();
	},

	// Remove special characters except allowed ones
	removeSpecialChars: (value: string, allowed: string[] = ['-', '_', '.', '@']): string => {
		const allowedSet = new Set(allowed);
		return value.replace(/[^\w\s]/g, (char) => allowedSet.has(char) ? char : '');
	},

	// Sanitize email
	sanitizeEmail: (value: string): string => {
		return value.toLowerCase().trim().replace(/\s+/g, '');
	},

	// Sanitize URL
	sanitizeUrl: (value: string): string => {
		if (!value.startsWith('http://') && !value.startsWith('https://')) {
			value = 'https://' + value;
		}
		return value.trim();
	},

	// Sanitize number
	sanitizeNumber: (value: string): string => {
		return value.replace(/[^\d.-]/g, '');
	},

	// Sanitize file name
	sanitizeFileName: (value: string): string => {
		return value.replace(/[<>:"/\\|?*]/g, '_');
	}
};

// Common validation rules
export const ValidationRules = {
	required: (message = 'This field is required'): ValidationRule => ({
		validate: (value) => {
			if (value === null || value === undefined) return false;
			if (typeof value === 'string') return value.trim().length > 0;
			if (Array.isArray(value)) return value.length > 0;
			return true;
		},
		message,
		severity: 'error',
	}),

	minLength: (min: number, message?: string): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true; // Let required rule handle empty values
			return value.length >= min;
		},
		message: message || `Must be at least ${min} characters long`,
		severity: 'error',
	}),

	maxLength: (max: number, message?: string): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			return value.length <= max;
		},
		message: message || `Must be no more than ${max} characters long`,
		severity: 'error',
	}),

	email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return emailRegex.test(value);
		},
		message,
		severity: 'error',
	}),

	url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			try {
				new URL(value);
				return true;
			} catch {
				return false;
			}
		},
		message,
		severity: 'error',
	}),

	pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			return regex.test(value);
		},
		message,
		severity: 'error',
	}),

	min: (min: number, message?: string): ValidationRule<number> => ({
		validate: (value) => {
			if (value === null || value === undefined) return true;
			return value >= min;
		},
		message: message || `Must be at least ${min}`,
		severity: 'error',
	}),

	max: (max: number, message?: string): ValidationRule<number> => ({
		validate: (value) => {
			if (value === null || value === undefined) return true;
			return value <= max;
		},
		message: message || `Must be no more than ${max}`,
		severity: 'error',
	}),

	range: (min: number, max: number, message?: string): ValidationRule<number> => ({
		validate: (value) => {
			if (value === null || value === undefined) return true;
			return value >= min && value <= max;
		},
		message: message || `Must be between ${min} and ${max}`,
		severity: 'error',
	}),

	positive: (message = 'Must be a positive number'): ValidationRule<number> => ({
		validate: (value) => {
			if (value === null || value === undefined) return true;
			return value > 0;
		},
		message,
		severity: 'error',
	}),

	integer: (message = 'Must be a whole number'): ValidationRule<number> => ({
		validate: (value) => {
			if (value === null || value === undefined) return true;
			return Number.isInteger(value);
		},
		message,
		severity: 'error',
	}),

	date: (message = 'Please enter a valid date'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			const date = new Date(value);
			return !isNaN(date.getTime());
		},
		message,
		severity: 'error',
	}),

	futureDate: (message = 'Date must be in the future'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			const date = new Date(value);
			return date > new Date();
		},
		message,
		severity: 'error',
	}),

	fileSize: (maxSizeMB: number, message?: string): ValidationRule<File> => ({
		validate: (value) => {
			if (!value) return true;
			return value.size <= maxSizeMB * 1024 * 1024;
		},
		message: message || `File size must be less than ${maxSizeMB}MB`,
		severity: 'error',
	}),

	fileType: (allowedTypes: string[], message?: string): ValidationRule<File> => ({
		validate: (value) => {
			if (!value) return true;
			return allowedTypes.includes(value.type);
		},
		message: message || `File type must be one of: ${allowedTypes.join(', ')}`,
		severity: 'error',
	}),

	// New validation rules with different severities
	passwordStrength: (message = 'Password should be stronger'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			const hasLower = /[a-z]/.test(value);
			const hasUpper = /[A-Z]/.test(value);
			const hasNumber = /\d/.test(value);
			const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
			return hasLower && hasUpper && hasNumber && hasSpecial;
		},
		message,
		severity: 'warning',
	}),

	usernameFormat: (message = 'Username should only contain letters, numbers, and underscores'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			return /^[a-zA-Z0-9_]+$/.test(value);
		},
		message,
		severity: 'warning',
	}),

	phoneFormat: (message = 'Phone number format could be improved'): ValidationRule<string> => ({
		validate: (value) => {
			if (!value) return true;
			const clean = value.replace(/\D/g, '');
			return clean.length >= 10 && clean.length <= 15;
		},
		message,
		severity: 'info',
	}),

	// Custom validation rule creator
	custom: <T>(validator: (value: T) => boolean | string, message: string, severity: 'error' | 'warning' | 'info' = 'error'): ValidationRule<T> => ({
		validate: validator,
		message,
		severity,
	}),
};

// Enhanced validation functions
export function validateField<T>(
	value: T,
	rules: ValidationRule<T>[],
	fieldName: string = 'field'
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const info: string[] = [];

	for (const rule of rules) {
		const result = rule.validate(value);
		if (result === false) {
			const message = rule.message;
			switch (rule.severity) {
				case 'warning':
					warnings.push(message);
					break;
				case 'info':
					info.push(message);
					break;
				default:
					errors.push(message);
			}
		} else if (typeof result === 'string') {
			errors.push(result);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		info,
	};
}

export function validateObject<T extends Record<string, any>>(
	obj: T,
	schema: ValidationSchema
): Record<string, ValidationResult> {
	const results: Record<string, ValidationResult> = {};

	for (const [field, rules] of Object.entries(schema)) {
		results[field] = validateField(obj[field], rules, field);
	}

	return results;
}

export function isFormValid(results: Record<string, ValidationResult>): boolean {
	return Object.values(results).every(result => result.errors.length === 0);
}

export function getFormErrors(results: Record<string, ValidationResult> | undefined): Record<string, string[]> {
	const errors: Record<string, string[]> = {};
	
	if (!results) return errors;
	
	for (const [field, result] of Object.entries(results)) {
		if (result.errors.length > 0) {
			errors[field] = result.errors;
		}
	}

	return errors;
}

export function getFormWarnings(results: Record<string, ValidationResult> | undefined): Record<string, string[]> {
	const warnings: Record<string, string[]> = {};
	
	if (!results) return warnings;
	
	for (const [field, result] of Object.entries(results)) {
		if (result.warnings.length > 0) {
			warnings[field] = result.warnings;
		}
	}

	return warnings;
}

export function getFormInfo(results: Record<string, ValidationResult> | undefined): Record<string, string[]> {
	const info: Record<string, string[]> = {};
	
	if (!results) return info;
	
	for (const [field, result] of Object.entries(results)) {
		if (result.info.length > 0) {
			info[field] = result.info;
		}
	}

	return info;
}

// Real-time validation with debouncing
export function createDebouncedValidator<T>(
	validator: (value: T) => ValidationResult,
	delayMs: number = 300
): (value: T) => Promise<ValidationResult> {
	let timeoutId: NodeJS.Timeout;
	
	return (value: T): Promise<ValidationResult> => {
		return new Promise((resolve) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				resolve(validator(value));
			}, delayMs);
		});
	};
}

// Assignment-specific validation rules
export const AssignmentValidation = {
	title: [
		ValidationRules.required('Assignment title is required'),
		ValidationRules.minLength(3, 'Title must be at least 3 characters long'),
		ValidationRules.maxLength(200, 'Title must be no more than 200 characters long'),
		ValidationRules.pattern(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters'),
	],

	description: [
		ValidationRules.required('Assignment description is required'),
		ValidationRules.minLength(10, 'Description must be at least 10 characters long'),
		ValidationRules.maxLength(5000, 'Description must be no more than 5000 characters long'),
	],

	dueDate: [
		ValidationRules.required('Due date is required'),
		ValidationRules.date('Please enter a valid due date'),
		ValidationRules.futureDate('Due date must be in the future'),
	],

	maxScore: [
		ValidationRules.required('Maximum score is required'),
		ValidationRules.positive('Maximum score must be positive'),
		ValidationRules.range(1, 1000, 'Maximum score must be between 1 and 1000'),
		ValidationRules.integer('Maximum score must be a whole number'),
	],

	weight: [
		ValidationRules.required('Weight is required'),
		ValidationRules.range(0, 100, 'Weight must be between 0 and 100'),
		ValidationRules.integer('Weight must be a whole number'),
	],

	requirements: [
		ValidationRules.required('At least one requirement is needed'),
		ValidationRules.custom(
			(value: string[]) => value.length > 0 && value.every(req => req.trim().length > 0),
			'All requirements must have content'
		),
	],

	maxSubmissions: [
		ValidationRules.required('Maximum submissions is required'),
		ValidationRules.positive('Maximum submissions must be positive'),
		ValidationRules.range(1, 100, 'Maximum submissions must be between 1 and 100'),
		ValidationRules.integer('Maximum submissions must be a whole number'),
	],

	maxGroupSize: [
		ValidationRules.required('Maximum group size is required'),
		ValidationRules.positive('Maximum group size must be positive'),
		ValidationRules.range(1, 50, 'Maximum group size must be between 1 and 50'),
		ValidationRules.integer('Maximum group size must be a whole number'),
	],
};

// Submission-specific validation rules
export const SubmissionValidation = {
	feedback: [
		ValidationRules.required('Feedback is required'),
		ValidationRules.minLength(10, 'Feedback must be at least 10 characters long'),
		ValidationRules.maxLength(2000, 'Feedback must be no more than 2000 characters long'),
	],

	grade: [
		ValidationRules.required('Grade is required'),
		ValidationRules.range(0, 100, 'Grade must be between 0 and 100'),
		ValidationRules.integer('Grade must be a whole number'),
	],

	rubricScores: [
		ValidationRules.custom(
			(value: Record<string, number>) => {
				if (!value || Object.keys(value).length === 0) return true;
				return Object.values(value).every(score => score >= 0 && score <= 100);
			},
			'Rubric scores must be between 0 and 100'
		),
	],
};

// User authentication validation rules
export const AuthValidation = {
	username: [
		ValidationRules.required('Username is required'),
		ValidationRules.minLength(3, 'Username must be at least 3 characters long'),
		ValidationRules.maxLength(30, 'Username must be no more than 30 characters long'),
		ValidationRules.usernameFormat('Username should only contain letters, numbers, and underscores'),
	],

	email: [
		ValidationRules.required('Email is required'),
		ValidationRules.email('Please enter a valid email address'),
	],

	password: [
		ValidationRules.required('Password is required'),
		ValidationRules.minLength(8, 'Password must be at least 8 characters long'),
		ValidationRules.passwordStrength('Password should include lowercase, uppercase, number, and special character'),
	],

	confirmPassword: [
		ValidationRules.required('Please confirm your password'),
		ValidationRules.custom(
			(value: string, formData?: any) => value === formData?.password,
			'Passwords do not match'
		),
	],

	firstName: [
		ValidationRules.required('First name is required'),
		ValidationRules.minLength(2, 'First name must be at least 2 characters long'),
		ValidationRules.maxLength(50, 'First name must be no more than 50 characters long'),
		ValidationRules.pattern(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
	],

	lastName: [
		ValidationRules.required('Last name is required'),
		ValidationRules.minLength(2, 'Last name must be at least 2 characters long'),
		ValidationRules.maxLength(50, 'Last name must be no more than 50 characters long'),
		ValidationRules.pattern(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
	],

	phone: [
		ValidationRules.phoneFormat('Phone number format could be improved'),
	],
};
