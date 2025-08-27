import { ValidationRules, validateField, validateObject, isFormValid, getFormErrors, getFormWarnings, getFormInfo, ValidationError, InputSanitizer, createDebouncedValidator, AuthValidation } from '../validation';

describe('Validation System', () => {
	describe('ValidationRules', () => {
		describe('required', () => {
			it('validates required string values', () => {
				const rule = ValidationRules.required();
				expect(rule.validate('test')).toBe(true);
				expect(rule.validate('')).toBe(false);
				expect(rule.validate('   ')).toBe(false);
			});

			it('validates required array values', () => {
				const rule = ValidationRules.required();
				expect(rule.validate([1, 2, 3])).toBe(true);
				expect(rule.validate([])).toBe(false);
			});

			it('validates required non-string values', () => {
				const rule = ValidationRules.required();
				expect(rule.validate(0)).toBe(true);
				expect(rule.validate(false)).toBe(true);
				expect(rule.validate(null)).toBe(false);
				expect(rule.validate(undefined)).toBe(false);
			});

			it('uses custom error message', () => {
				const rule = ValidationRules.required('Custom message');
				expect(rule.message).toBe('Custom message');
			});

			it('has error severity by default', () => {
				const rule = ValidationRules.required();
				expect(rule.severity).toBe('error');
			});
		});

		describe('minLength', () => {
			it('validates minimum length for strings', () => {
				const rule = ValidationRules.minLength(3);
				expect(rule.validate('abc')).toBe(true);
				expect(rule.validate('abcd')).toBe(true);
				expect(rule.validate('ab')).toBe(false);
			});

			it('allows empty values (handled by required rule)', () => {
				const rule = ValidationRules.minLength(3);
				expect(rule.validate('')).toBe(true);
				expect(rule.validate(null as any)).toBe(true);
			});

			it('uses custom error message', () => {
				const rule = ValidationRules.minLength(5, 'Custom min length message');
				expect(rule.message).toBe('Custom min length message');
			});
		});

		describe('maxLength', () => {
			it('validates maximum length for strings', () => {
				const rule = ValidationRules.maxLength(5);
				expect(rule.validate('abc')).toBe(true);
				expect(rule.validate('abcde')).toBe(true);
				expect(rule.validate('abcdef')).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.maxLength(5);
				expect(rule.validate('')).toBe(true);
				expect(rule.validate(null as any)).toBe(true);
			});

			it('uses custom error message', () => {
				const rule = ValidationRules.maxLength(10, 'Custom max length message');
				expect(rule.message).toBe('Custom max length message');
			});
		});

		describe('email', () => {
			it('validates email format', () => {
				const rule = ValidationRules.email();
				expect(rule.validate('test@example.com')).toBe(true);
				expect(rule.validate('user.name@domain.co.uk')).toBe(true);
				expect(rule.validate('invalid-email')).toBe(false);
				expect(rule.validate('test@')).toBe(false);
				expect(rule.validate('@example.com')).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.email();
				expect(rule.validate('')).toBe(true);
				expect(rule.validate(null as any)).toBe(true);
			});
		});

		describe('url', () => {
			it('validates URL format', () => {
				const rule = ValidationRules.url();
				expect(rule.validate('https://example.com')).toBe(true);
				expect(rule.validate('http://sub.domain.com/path')).toBe(true);
				expect(rule.validate('ftp://files.example.org')).toBe(true);
				expect(rule.validate('invalid-url')).toBe(false);
				expect(rule.validate('not-a-url')).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.url();
				expect(rule.validate('')).toBe(true);
				expect(rule.validate(null as any)).toBe(true);
			});
		});

		describe('pattern', () => {
			it('validates regex pattern', () => {
				const rule = ValidationRules.pattern(/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone format');
				expect(rule.validate('123-456-7890')).toBe(true);
				expect(rule.validate('1234567890')).toBe(false);
				expect(rule.validate('123-45-67890')).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.pattern(/^\d+$/, 'Numbers only');
				expect(rule.validate('')).toBe(true);
				expect(rule.validate(null as any)).toBe(true);
			});
		});

		describe('min', () => {
			it('validates minimum numeric values', () => {
				const rule = ValidationRules.min(10);
				expect(rule.validate(15)).toBe(true);
				expect(rule.validate(10)).toBe(true);
				expect(rule.validate(5)).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.min(10);
				expect(rule.validate(null as any)).toBe(true);
				expect(rule.validate(undefined as any)).toBe(true);
			});
		});

		describe('max', () => {
			it('validates maximum numeric values', () => {
				const rule = ValidationRules.max(100);
				expect(rule.validate(50)).toBe(true);
				expect(rule.validate(100)).toBe(true);
				expect(rule.validate(150)).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.max(100);
				expect(rule.validate(null as any)).toBe(true);
				expect(rule.validate(undefined as any)).toBe(true);
			});
		});

		describe('range', () => {
			it('validates value within range', () => {
				const rule = ValidationRules.range(1, 10);
				expect(rule.validate(5)).toBe(true);
				expect(rule.validate(1)).toBe(true);
				expect(rule.validate(10)).toBe(true);
				expect(rule.validate(0)).toBe(false);
				expect(rule.validate(11)).toBe(false);
			});

			it('allows empty values', () => {
				const rule = ValidationRules.range(1, 10);
				expect(rule.validate(null as any)).toBe(true);
				expect(rule.validate(undefined as any)).toBe(true);
			});
		});

		describe('custom', () => {
			it('validates with custom function', () => {
				const rule = ValidationRules.custom(
					(value: string) => value === 'special',
					'Value must be "special"'
				);
				expect(rule.validate('special')).toBe(true);
				expect(rule.validate('other')).toBe(false);
			});

			it('allows custom severity levels', () => {
				const rule = ValidationRules.custom(
					(value: string) => value === 'special',
					'Value must be "special"',
					'warning'
				);
				expect(rule.severity).toBe('warning');
			});
		});

		describe('new validation rules', () => {
			describe('passwordStrength', () => {
				it('validates strong passwords', () => {
					const rule = ValidationRules.passwordStrength();
					expect(rule.validate('StrongPass123!')).toBe(true);
					expect(rule.validate('weakpass')).toBe(false);
					expect(rule.validate('WeakPass123')).toBe(false);
				});

				it('has warning severity', () => {
					const rule = ValidationRules.passwordStrength();
					expect(rule.severity).toBe('warning');
				});
			});

			describe('usernameFormat', () => {
				it('validates username format', () => {
					const rule = ValidationRules.usernameFormat();
					expect(rule.validate('user123')).toBe(true);
					expect(rule.validate('user_name')).toBe(true);
					expect(rule.validate('user-name')).toBe(false);
					expect(rule.validate('user@name')).toBe(false);
				});

				it('has warning severity', () => {
					const rule = ValidationRules.usernameFormat();
					expect(rule.severity).toBe('warning');
				});
			});

			describe('phoneFormat', () => {
				it('validates phone number format', () => {
					const rule = ValidationRules.phoneFormat();
					expect(rule.validate('123-456-7890')).toBe(true);
					expect(rule.validate('1234567890')).toBe(true);
					expect(rule.validate('123-45-6789')).toBe(false);
				});

				it('has info severity', () => {
					const rule = ValidationRules.phoneFormat();
					expect(rule.severity).toBe('info');
				});
			});
		});
	});

	describe('InputSanitizer', () => {
		describe('stripHtml', () => {
			it('removes HTML tags', () => {
				expect(InputSanitizer.stripHtml('<p>Hello</p>')).toBe('Hello');
				expect(InputSanitizer.stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
			});

			it('removes dangerous characters', () => {
				expect(InputSanitizer.stripHtml('Hello<>World')).toBe('HelloWorld');
			});
		});

		describe('normalizeWhitespace', () => {
			it('normalizes multiple spaces', () => {
				expect(InputSanitizer.normalizeWhitespace('  Hello   World  ')).toBe('Hello World');
			});
		});

		describe('removeSpecialChars', () => {
			it('removes special characters except allowed ones', () => {
				expect(InputSanitizer.removeSpecialChars('Hello-World!', ['-'])).toBe('Hello-World');
				expect(InputSanitizer.removeSpecialChars('user@domain.com', ['@', '.'])).toBe('user@domain.com');
			});
		});

		describe('sanitizeEmail', () => {
			it('sanitizes email addresses', () => {
				expect(InputSanitizer.sanitizeEmail('  USER@DOMAIN.COM  ')).toBe('user@domain.com');
			});
		});

		describe('sanitizeUrl', () => {
			it('adds https protocol if missing', () => {
				expect(InputSanitizer.sanitizeUrl('example.com')).toBe('https://example.com');
				expect(InputSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com');
			});
		});

		describe('sanitizeNumber', () => {
			it('removes non-numeric characters', () => {
				expect(InputSanitizer.sanitizeNumber('123abc456')).toBe('123456');
				expect(InputSanitizer.sanitizeNumber('12.34-56')).toBe('12.34-56');
			});
		});

		describe('sanitizeFileName', () => {
			it('removes invalid file name characters', () => {
				expect(InputSanitizer.sanitizeFileName('file<>:"/\\|?*.txt')).toBe('file_________.txt');
			});
		});
	});

	describe('validateField', () => {
		it('validates single field with single rule', () => {
			const result = validateField('abc', [ValidationRules.minLength(3)]);
			expect(result.errors.length).toBe(0);
			expect(result.errors).toEqual([]);
			expect(result.warnings).toEqual([]);
			expect(result.info).toEqual([]);
		});

		it('validates single field with multiple rules', () => {
			const result = validateField('abc', [
				ValidationRules.minLength(3),
				ValidationRules.maxLength(5),
			]);
			expect(result.errors.length).toBe(0);
		});

		it('returns errors when validation fails', () => {
			const result = validateField('ab', [
				ValidationRules.minLength(3),
				ValidationRules.maxLength(5),
			]);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors).toContain('Must be at least 3 characters long');
		});

		it('categorizes messages by severity', () => {
			const result = validateField('weakpass', [
				ValidationRules.required(),
				ValidationRules.passwordStrength(),
			]);
			expect(result.errors.length).toBe(0); // No errors, only warnings
			expect(result.errors).toEqual([]);
			expect(result.warnings).toContain('Password should be stronger');
		});

		it('handles empty values correctly', () => {
			const result = validateField('', [ValidationRules.minLength(3)]);
			expect(result.errors.length).toBe(0);
		});

		it('handles null values correctly', () => {
			const result = validateField(null as any, [ValidationRules.minLength(3)]);
			expect(result.errors.length).toBe(0);
		});
	});

	describe('validateObject', () => {
		const testSchema = {
			name: [ValidationRules.required(), ValidationRules.minLength(2)],
			email: [ValidationRules.email()],
			age: [ValidationRules.range(18, 65)],
		};

		it('validates object with valid data', () => {
			const data = {
				name: 'John Doe',
				email: 'john@example.com',
				age: 25,
			};

			const result = validateObject(data, testSchema);
			expect(result.name.errors.length).toBe(0);
			expect(result.email.errors.length).toBe(0);
			expect(result.age.errors.length).toBe(0);
		});

		it('validates object with invalid data', () => {
			const data = {
				name: 'J', // Too short
				email: 'invalid-email', // Invalid email
				age: 16, // Too young
			};

			const result = validateObject(data, testSchema);
			expect(result.name.errors.length).toBeGreaterThan(0);
			expect(result.email.errors.length).toBeGreaterThan(0);
			expect(result.age.errors.length).toBeGreaterThan(0);
			expect(result.name.errors).toContain('Must be at least 2 characters long');
			expect(result.email.errors).toContain('Please enter a valid email address');
			expect(result.age.errors).toContain('Must be between 18 and 65');
		});

		it('handles missing fields', () => {
			const data = {
				name: 'John Doe',
				// email missing
				age: 25,
			};

			const result = validateObject(data, testSchema);
			expect(result.name.errors.length).toBe(0);
			expect(result.email.errors.length).toBe(0); // Email is not required, just validated if present
			expect(result.age.errors.length).toBe(0);
		});

		it('handles empty object', () => {
			const result = validateObject({}, testSchema);
			expect(result.name.errors.length).toBeGreaterThan(0);
			expect(result.email.errors.length).toBe(0); // Email is not required
			expect(result.age.errors.length).toBe(0); // Age is not required
			expect(result.name.errors).toContain('This field is required');
		});

		it('handles partial validation', () => {
			const partialSchema = {
				name: [ValidationRules.required()],
			};

			const data = {
				name: 'John Doe',
				email: 'invalid-email', // Not in schema, should be ignored
			};

			const result = validateObject(data, partialSchema);
			expect(result.name.errors.length).toBe(0);
			expect(Object.keys(result)).toHaveLength(1);
		});
	});

	describe('isFormValid', () => {
		it('returns true for valid form data', () => {
			const results = {
						name: { errors: [], warnings: [], info: [] },
		email: { errors: [], warnings: [], info: [] },
			};

			expect(isFormValid(results)).toBe(true);
		});

		it('returns false for invalid form data', () => {
			const results = {
						name: { errors: ['Required field'], warnings: [], info: [] },
		email: { errors: [], warnings: [], info: [] },
			};

			expect(isFormValid(results)).toBe(false);
		});

		it('returns true for empty errors object', () => {
			expect(isFormValid({})).toBe(true);
		});

		it('returns false when any field has errors', () => {
			const results = {
						name: { errors: [], warnings: [], info: [] },
		email: { errors: ['Invalid email'], warnings: [], info: [] },
			};

			expect(isFormValid(results)).toBe(false);
		});

		it('ignores warnings and info when determining validity', () => {
			const results = {
						name: { errors: [], warnings: ['Weak password'], info: [] },
		email: { errors: [], warnings: [], info: ['Format could be improved'] },
			};

			expect(isFormValid(results)).toBe(true);
		});
	});

	describe('getFormErrors', () => {
		it('returns all errors from validation result', () => {
			const validationResult = {
				name: { errors: ['Required field'], warnings: [], info: [] },
				email: { errors: ['Invalid email format'], warnings: [], info: [] },
			};

			const errors = getFormErrors(validationResult);
			expect(errors).toEqual({
				name: ['Required field'],
				email: ['Invalid email format'],
			});
		});

		it('returns empty object for valid result', () => {
			const validationResult = {
				name: { errors: [], warnings: [], info: [] },
				email: { errors: [], warnings: [], info: [] },
			};

			const errors = getFormErrors(validationResult);
			expect(errors).toEqual({});
		});

		it('handles undefined validation result', () => {
			const errors = getFormErrors(undefined as any);
			expect(errors).toEqual({});
		});
	});

	describe('getFormWarnings', () => {
		it('returns all warnings from validation result', () => {
			const validationResult = {
				name: { errors: [], warnings: ['Weak password'], info: [] },
				email: { errors: [], warnings: ['Format could be improved'], info: [] },
			};

			const warnings = getFormWarnings(validationResult);
			expect(warnings).toEqual({
				name: ['Weak password'],
				email: ['Format could be improved'],
			});
		});

		it('returns empty object when no warnings', () => {
			const validationResult = {
				name: { errors: [], warnings: [], info: [] },
				email: { errors: [], warnings: [], info: [] },
			};

			const warnings = getFormWarnings(validationResult);
			expect(warnings).toEqual({});
		});
	});

	describe('getFormInfo', () => {
		it('returns all info messages from validation result', () => {
			const validationResult = {
				name: { errors: [], warnings: [], info: ['Format could be improved'] },
				email: { errors: [], warnings: [], info: ['Consider using a different format'] },
			};

			const info = getFormInfo(validationResult);
			expect(info).toEqual({
				name: ['Format could be improved'],
				email: ['Consider using a different format'],
			});
		});

		it('returns empty object when no info messages', () => {
			const validationResult = {
				name: { errors: [], warnings: [], info: [] },
				email: { errors: [], warnings: [], info: [] },
			};

			const info = getFormInfo(validationResult);
			expect(info).toEqual({});
		});
	});

	describe('ValidationError', () => {
		it('creates validation error with correct properties', () => {
			const error = new ValidationError('Invalid value', 'testField', 'bad-value');

			expect(error.message).toBe('Invalid value');
			expect(error.field).toBe('testField');
			expect(error.value).toBe('bad-value');
			expect(error.name).toBe('ValidationError');
		});

		it('inherits from Error', () => {
			const error = new ValidationError('Test message', 'field', 'value');
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe('createDebouncedValidator', () => {
		it('creates a debounced validator function', async () => {
			const mockValidator = jest.fn().mockReturnValue({ errors: [], warnings: [], info: [] });
			const debouncedValidator = createDebouncedValidator(mockValidator, 100);

			// Call multiple times quickly
			const promises = [
				debouncedValidator('test'),
				debouncedValidator('test2'),
				debouncedValidator('test3'),
			];

			// Wait for debounce
			await new Promise(resolve => setTimeout(resolve, 150));

			// Only the last call should execute
			expect(mockValidator).toHaveBeenCalledTimes(1);
			expect(mockValidator).toHaveBeenCalledWith('test3');
		});
	});

	describe('AuthValidation', () => {
		describe('username', () => {
			it('validates username requirements', () => {
				const result = validateField('user123', AuthValidation.username);
				expect(result.errors.length).toBe(0);
			});

			it('validates username format warnings', () => {
				const result = validateField('user-name', AuthValidation.username);
				expect(result.errors.length).toBe(0);
				expect(result.warnings).toContain('Username should only contain letters, numbers, and underscores');
			});
		});

		describe('password', () => {
			it('validates password requirements', () => {
				const result = validateField('StrongPass123!', AuthValidation.password);
				expect(result.errors.length).toBe(0);
			});

			it('shows password strength warnings', () => {
				const result = validateField('weakpass', AuthValidation.password);
				expect(result.errors.length).toBe(0);
				expect(result.warnings).toContain('Password should include lowercase, uppercase, number, and special character');
			});
		});

		describe('email', () => {
			it('validates email format', () => {
				const result = validateField('test@example.com', AuthValidation.email);
				expect(result.errors.length).toBe(0);
			});
		});
	});

	describe('Integration Tests', () => {
		it('validates complex form data with different severities', () => {
			const schema = {
				username: [
					ValidationRules.required(),
					ValidationRules.minLength(3),
					ValidationRules.maxLength(20),
					ValidationRules.usernameFormat(),
				],
				email: [
					ValidationRules.required(),
					ValidationRules.email(),
				],
				password: [
					ValidationRules.required(),
					ValidationRules.minLength(8),
					ValidationRules.passwordStrength(),
				],
				age: [
					ValidationRules.range(13, 120),
				],
			};

			const validData = {
				username: 'john_doe123',
				email: 'john@example.com',
				password: 'SecurePass123',
				age: 25,
			};

			const result = validateObject(validData, schema);
			expect(result.username.errors.length).toBe(0);
			expect(result.email.errors.length).toBe(0);
			expect(result.password.errors.length).toBe(0);
			expect(result.age.errors.length).toBe(0);
		});

		it('handles nested validation scenarios with warnings and info', () => {
			const schema = {
				firstName: [ValidationRules.required(), ValidationRules.minLength(2)],
				lastName: [ValidationRules.required(), ValidationRules.minLength(2)],
				phone: [ValidationRules.phoneFormat()],
			};

			const data = {
				firstName: 'John',
				lastName: 'Doe',
				phone: '123-45-6789', // This should trigger the info message
			};

			const result = validateObject(data, schema);
			expect(result.firstName.errors.length).toBe(0);
			expect(result.lastName.errors.length).toBe(0);
			expect(result.phone.errors.length).toBe(0);
			expect(result.phone.info).toContain('Phone number format could be improved');
		});
	});
});
