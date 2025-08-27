import React, { useState, useEffect, useCallback } from 'react';
import { ValidationResult, InputSanitizer, ValidationOptions } from '@/lib/validation';

export interface FormFieldOption {
	value: string;
	label: string;
}

export interface FormFieldProps {
	label: string;
	name: string;
	value: string | number | File | null;
	onChange: (value: string | number | File | null) => void;
	onBlur?: () => void;
	type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'file' | 'date';
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	helpText?: string;
	className?: string;
	validationResult?: ValidationResult;
	showValidation?: boolean;
	validationOptions?: ValidationOptions;
	// Input-specific props
	min?: number;
	max?: number;
	step?: number;
	rows?: number;
	options?: FormFieldOption[];
	accept?: string;
	maxSize?: number; // in MB
	// Sanitization options
	sanitize?: boolean;
	sanitizeType?: 'stripHtml' | 'normalizeWhitespace' | 'removeSpecialChars' | 'sanitizeEmail' | 'sanitizeUrl' | 'sanitizeNumber' | 'sanitizeFileName';
	allowedChars?: string[];
}

const FormField: React.FC<FormFieldProps> = ({
	label,
	name,
	value,
	onChange,
	onBlur,
	type = 'text',
	required = false,
	disabled = false,
	placeholder,
	helpText,
	className = '',
	validationResult,
	showValidation = false,
	validationOptions = {},
	min,
	max,
	step,
	rows = 3,
	options = [],
	accept,
	maxSize,
	sanitize = false,
	sanitizeType,
	allowedChars,
}) => {
	const [touched, setTouched] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const shouldShowValidation = showValidation && touched && validationResult;

	// Sanitize input value based on type
	const sanitizeValue = useCallback((inputValue: string): string => {
		if (!sanitize || !inputValue) return inputValue;
		
		switch (sanitizeType) {
			case 'stripHtml':
				return InputSanitizer.stripHtml(inputValue);
			case 'normalizeWhitespace':
				return InputSanitizer.normalizeWhitespace(inputValue);
			case 'removeSpecialChars':
				return InputSanitizer.removeSpecialChars(inputValue, allowedChars);
			case 'sanitizeEmail':
				return InputSanitizer.sanitizeEmail(inputValue);
			case 'sanitizeUrl':
				return InputSanitizer.sanitizeUrl(inputValue);
			case 'sanitizeNumber':
				return InputSanitizer.sanitizeNumber(inputValue);
			case 'sanitizeFileName':
				return InputSanitizer.sanitizeFileName(inputValue);
			default:
				return inputValue;
		}
	}, [sanitize, sanitizeType, allowedChars]);

	const handleBlur = () => {
		setTouched(true);
		onBlur?.();
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const target = e.target;
		let newValue: string | number | File | null;

		if (target.type === 'file') {
			const fileInput = target as HTMLInputElement;
			newValue = fileInput.files?.[0] || null;
		} else if (target.type === 'number') {
			newValue = target.value === '' ? 0 : Number(target.value);
		} else {
			let stringValue = target.value;
			if (sanitize) {
				stringValue = sanitizeValue(stringValue);
			}
			newValue = stringValue;
		}

		onChange(newValue);
	};

	const renderInput = () => {
		const baseClasses = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
			disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
		}`;

		// Enhanced validation styling
		let validationClasses = 'border-gray-300';
		if (shouldShowValidation) {
			if (validationResult?.errors.length === 0) {
				if (validationResult?.warnings.length > 0) {
					validationClasses = 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500';
				} else if (validationResult?.info.length > 0) {
					validationClasses = 'border-blue-500 focus:ring-blue-500 focus:border-blue-500';
				} else {
					validationClasses = 'border-green-500 focus:ring-green-500 focus:border-green-500';
				}
			} else {
				validationClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
			}
		}

		const inputClasses = `${baseClasses} ${validationClasses}`;

		switch (type) {
			case 'textarea':
				return (
					<textarea
						id={name}
						name={name}
						value={value as string || ''}
						onChange={handleChange}
						onBlur={handleBlur}
						disabled={disabled}
						placeholder={placeholder}
						rows={rows}
						className={inputClasses}
					/>
				);

			case 'select':
				return (
					<select
						id={name}
						name={name}
						value={value as string || ''}
						onChange={handleChange}
						onBlur={handleBlur}
						disabled={disabled}
						className={inputClasses}
					>
						<option value="">{placeholder || 'Select an option'}</option>
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				);

			case 'file':
				return (
					<div>
						<input
							id={name}
							name={name}
							type="file"
							onChange={handleChange}
							onBlur={handleBlur}
							disabled={disabled}
							accept={accept}
							className="hidden"
						/>
						<label
							htmlFor={name}
							className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
								disabled ? 'opacity-50 cursor-not-allowed' : ''
							}`}
						>
							<svg
								className="-ml-1 mr-2 h-5 w-5 text-gray-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							Choose File
						</label>
						{value && (
							<span className="ml-3 text-sm text-gray-500">
								{(value as File).name}
							</span>
						)}
					</div>
				);

			default:
				return (
					<input
						id={name}
						name={name}
						type={type}
						value={value as string | number || ''}
						onChange={handleChange}
						onBlur={handleBlur}
						disabled={disabled}
						placeholder={placeholder}
						min={min}
						max={max}
						step={step}
						className={inputClasses}
					/>
				);
		}
	};

	const renderValidationMessages = () => {
		if (!shouldShowValidation || !validationResult) return null;

		const { errors, warnings, info } = validationResult;

		return (
			<div className="space-y-1">
				{/* Success state */}
				{errors.length === 0 && warnings.length === 0 && info.length === 0 && (
					<p className="text-sm text-green-600 flex items-center">
						<svg
							className="w-4 h-4 mr-1"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clipRule="evenodd"
							/>
						</svg>
						Valid
					</p>
				)}

				{/* Error messages */}
				{errors.map((error, index) => (
					<p key={`error-${index}`} className="text-sm text-red-600 flex items-center">
						<svg
							className="w-4 h-4 mr-1"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						{error}
					</p>
				))}

				{/* Warning messages */}
				{warnings.map((warning, index) => (
					<p key={`warning-${index}`} className="text-sm text-yellow-600 flex items-center">
						<svg
							className="w-4 h-4 mr-1"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						{warning}
					</p>
				))}

				{/* Info messages */}
				{info.map((infoMsg, index) => (
					<p key={`info-${index}`} className="text-sm text-blue-600 flex items-center">
						<svg
							className="w-4 h-4 mr-1"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clipRule="evenodd"
							/>
						</svg>
						{infoMsg}
					</p>
				))}
			</div>
		);
	};

	return (
		<div className={`space-y-2 ${className}`}>
			<label htmlFor={name} className="block text-sm font-medium text-gray-700">
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>

			{renderInput()}

			{/* Help Text */}
			{helpText && (
				<p className="text-sm text-gray-500">{helpText}</p>
			)}

			{/* File Size Info */}
			{type === 'file' && maxSize && (
				<p className="text-sm text-gray-500">
					Maximum file size: {maxSize}MB
				</p>
			)}

			{/* Validation Messages */}
			{renderValidationMessages()}

			{/* Loading indicator for real-time validation */}
			{isValidating && (
				<div className="flex items-center text-sm text-gray-500">
					<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
					Validating...
				</div>
			)}
		</div>
	);
};

export default FormField;
