import React, { useState, useCallback, useEffect } from 'react';
import { 
	ValidationSchema, 
	ValidationResult, 
	validateObject, 
	isFormValid, 
	getFormErrors, 
	getFormWarnings, 
	getFormInfo,
	createDebouncedValidator,
	ValidationOptions 
} from '@/lib/validation';

export interface ValidatedFormProps<T extends Record<string, any>> {
	initialData: T;
	schema: ValidationSchema;
	onSubmit: (data: T) => Promise<void> | void;
	onCancel?: () => void;
	children: (props: ValidatedFormRenderProps<T>) => React.ReactNode;
	validationOptions?: ValidationOptions;
	className?: string;
}

export interface ValidatedFormRenderProps<T> {
	formData: T;
	errors: Record<string, string[]>;
	warnings: Record<string, string[]>;
	info: Record<string, string[]>;
	isValid: boolean;
	isSubmitting: boolean;
	handleChange: (field: keyof T, value: any) => void;
	handleBlur: (field: keyof T) => void;
	handleSubmit: (e: React.FormEvent) => void;
	handleCancel: () => void;
	getFieldValidation: (field: keyof T) => ValidationResult | undefined;
	validateField: (field: keyof T) => void;
	validateForm: () => boolean;
	resetForm: () => void;
}

export function ValidatedForm<T extends Record<string, any>>({
	initialData,
	schema,
	onSubmit,
	onCancel,
	children,
	validationOptions = {},
	className = '',
}: ValidatedFormProps<T>) {
	const [formData, setFormData] = useState<T>(initialData);
	const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
	const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasSubmitted, setHasSubmitted] = useState(false);

	const {
		validateOnChange = false,
		validateOnBlur = true,
		debounceMs = 300,
		showWarnings = true,
		showInfo = true,
	} = validationOptions;

	// Create debounced validator for real-time validation
	const debouncedValidator = useCallback(
		createDebouncedValidator(
			(value: T) => validateObject(value, schema),
			debounceMs
		),
		[schema, debounceMs]
	);

	// Validate a single field
	const validateField = useCallback((field: keyof T) => {
		if (!schema[field as string]) return;

		const fieldRules = schema[field as string];
		const fieldValue = formData[field];
		
		// Import validateField function here to avoid circular dependency
		const { validateField: validateSingleField } = require('@/lib/validation');
		const result = validateSingleField(fieldValue, fieldRules, field as string);
		
		setValidationResults(prev => ({
			...prev,
			[field]: result,
		}));
	}, [formData, schema]);

	// Validate entire form
	const validateForm = useCallback(() => {
		const results = validateObject(formData, schema);
		setValidationResults(results);
		return isFormValid(results);
	}, [formData, schema]);

	// Real-time validation on change
	useEffect(() => {
		if (validateOnChange && Object.keys(touchedFields).length > 0) {
			const timeoutId = setTimeout(() => {
				debouncedValidator(formData).then((results) => {
					if (results) {
						setValidationResults(results);
					}
				});
			}, debounceMs);

			return () => clearTimeout(timeoutId);
		}
	}, [formData, validateOnChange, touchedFields, debouncedValidator, debounceMs]);

	// Handle field changes
	const handleChange = useCallback((field: keyof T, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		
		// Mark field as touched
		setTouchedFields(prev => new Set([...prev, field]));
		
		// Immediate validation for critical fields
		if (validateOnChange) {
			validateField(field);
		}
	}, [validateOnChange, validateField]);

	// Handle field blur
	const handleBlur = useCallback((field: keyof T) => {
		setTouchedFields(prev => new Set([...prev, field]));
		
		if (validateOnBlur) {
			validateField(field);
		}
	}, [validateOnBlur, validateField]);

	// Handle form submission
	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		
		setHasSubmitted(true);
		const isValid = validateForm();
		
		if (!isValid) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(formData);
		} catch (error) {
			console.error('Form submission error:', error);
		} finally {
			setIsSubmitting(false);
		}
	}, [formData, onSubmit, validateForm]);

	// Handle form cancellation
	const handleCancel = useCallback(() => {
		onCancel?.();
	}, [onCancel]);

	// Reset form to initial state
	const resetForm = useCallback(() => {
		setFormData(initialData);
		setValidationResults({});
		setTouchedFields(new Set());
		setHasSubmitted(false);
		setIsSubmitting(false);
	}, [initialData]);

	// Get validation result for a specific field
	const getFieldValidation = useCallback((field: keyof T): ValidationResult | undefined => {
		return validationResults[field as string];
	}, [validationResults]);

	// Compute derived state
	const errors = getFormErrors(validationResults);
	const warnings = showWarnings ? getFormWarnings(validationResults) : {};
	const info = showInfo ? getFormInfo(validationResults) : {};
	const isValid = isFormValid(validationResults);

	// Show validation for fields that have been touched or if form has been submitted
	const shouldShowValidation = (field: keyof T) => {
		return touchedFields.has(field) || hasSubmitted;
	};

	const renderProps: ValidatedFormRenderProps<T> = {
		formData,
		errors,
		warnings,
		info,
		isValid,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		handleCancel,
		getFieldValidation,
		validateField,
		validateForm,
		resetForm,
	};

	return (
		<form onSubmit={handleSubmit} className={className}>
			{children(renderProps)}
		</form>
	);
}

// Hook for using validated form logic
export function useValidatedForm<T extends Record<string, any>>(
	initialData: T,
	schema: ValidationSchema,
	validationOptions?: ValidationOptions
) {
	const [formData, setFormData] = useState<T>(initialData);
	const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
	const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

	const {
		validateOnChange = false,
		validateOnBlur = true,
		debounceMs = 300,
	} = validationOptions || {};

	// Create debounced validator
	const debouncedValidator = useCallback(
		createDebouncedValidator(
			(value: T) => validateObject(value, schema),
			debounceMs
		),
		[schema, debounceMs]
	);

	// Validate a single field
	const validateField = useCallback((field: keyof T) => {
		if (!schema[field as string]) return;

		const fieldRules = schema[field as string];
		const fieldValue = formData[field];
		
		const { validateField: validateSingleField } = require('@/lib/validation');
		const result = validateSingleField(fieldValue, fieldRules, field as string);
		
		setValidationResults(prev => ({
			...prev,
			[field]: result,
		}));
	}, [formData, schema]);

	// Validate entire form
	const validateForm = useCallback(() => {
		const results = validateObject(formData, schema);
		setValidationResults(results);
		return isFormValid(results);
	}, [formData, schema]);

	// Handle field changes
	const handleChange = useCallback((field: keyof T, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		setTouchedFields(prev => new Set([...prev, field]));
		
		if (validateOnChange) {
			validateField(field);
		}
	}, [validateOnChange, validateField]);

	// Handle field blur
	const handleBlur = useCallback((field: keyof T) => {
		setTouchedFields(prev => new Set([...prev, field]));
		
		if (validateOnBlur) {
			validateField(field);
		}
	}, [validateOnBlur, validateField]);

	// Reset form
	const resetForm = useCallback(() => {
		setFormData(initialData);
		setValidationResults({});
		setTouchedFields(new Set());
	}, [initialData]);

	// Get validation result for a field
	const getFieldValidation = useCallback((field: keyof T): ValidationResult | undefined => {
		return validationResults[field as string];
	}, [validationResults]);

	// Check if field should show validation
	const shouldShowValidation = useCallback((field: keyof T) => {
		return touchedFields.has(field);
	}, [touchedFields]);

	// Compute derived state
	const errors = getFormErrors(validationResults);
	const warnings = getFormWarnings(validationResults);
	const info = getFormInfo(validationResults);
	const isValid = isFormValid(validationResults);

	return {
		formData,
		errors,
		warnings,
		info,
		isValid,
		handleChange,
		handleBlur,
		validateField,
		validateForm,
		resetForm,
		getFieldValidation,
		shouldShowValidation,
	};
}
