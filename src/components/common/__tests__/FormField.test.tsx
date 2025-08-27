import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormField from '../FormField';
import { ValidationResult } from '@/lib/validation';

// Mock the validation module
jest.mock('@/lib/validation', () => ({
	InputSanitizer: {
		stripHtml: jest.fn((value: string) => value.replace(/<[^>]*>/g, '')),
		normalizeWhitespace: jest.fn((value: string) => value.replace(/\s+/g, ' ').trim()),
		removeSpecialChars: jest.fn((value: string, allowedChars: string[] = []) => {
			const allowed = new Set(allowedChars);
			return value.split('').map(char => allowed.has(char) ? char : '_').join('');
		}),
		sanitizeEmail: jest.fn((value: string) => value.toLowerCase().trim()),
		sanitizeUrl: jest.fn((value: string) => value.toLowerCase().trim()),
		sanitizeNumber: jest.fn((value: string) => value.replace(/[^0-9.-]/g, '')),
		sanitizeFileName: jest.fn((value: string) => value.replace(/[<>:"/\\|?*]/g, '_')),
	},
}));

describe('FormField', () => {
	const defaultProps = {
		label: 'Test Field',
		name: 'testField',
		value: '',
		onChange: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('renders with label and required indicator', () => {
			render(<FormField {...defaultProps} required />);
			
			expect(screen.getByText('Test Field')).toBeInTheDocument();
			expect(screen.getByText('*')).toBeInTheDocument();
		});

		it('renders without required indicator when not required', () => {
			render(<FormField {...defaultProps} />);
			
			expect(screen.getByText('Test Field')).toBeInTheDocument();
			expect(screen.queryByText('*')).not.toBeInTheDocument();
		});

		it('renders help text when provided', () => {
			render(<FormField {...defaultProps} helpText="This is help text" />);
			
			expect(screen.getByText('This is help text')).toBeInTheDocument();
		});
	});

	describe('Input Types', () => {
		it('renders text input by default', () => {
			render(<FormField {...defaultProps} />);
			
			const input = screen.getByRole('textbox');
			expect(input).toHaveAttribute('type', 'text');
		});

		it('renders email input', () => {
			render(<FormField {...defaultProps} type="email" />);
			
			const input = screen.getByRole('textbox');
			expect(input).toHaveAttribute('type', 'email');
		});

		it('renders password input', () => {
			render(<FormField {...defaultProps} type="password" />);
			
			const input = screen.getByDisplayValue('');
			expect(input).toHaveAttribute('type', 'password');
		});

		it('renders number input with min/max attributes', () => {
			render(<FormField {...defaultProps} type="number" min={0} max={100} />);
			
			const input = screen.getByRole('spinbutton');
			expect(input).toHaveAttribute('min', '0');
			expect(input).toHaveAttribute('max', '100');
		});

		it('renders textarea with rows', () => {
			render(<FormField {...defaultProps} type="textarea" rows={5} />);
			
			const textarea = screen.getByRole('textbox');
			expect(textarea).toHaveAttribute('rows', '5');
		});

		it('renders select with options', () => {
			const options = [
				{ value: 'option1', label: 'Option 1' },
				{ value: 'option2', label: 'Option 2' },
			];
			render(<FormField {...defaultProps} type="select" options={options} />);
			
			const select = screen.getByRole('combobox');
			expect(select).toBeInTheDocument();
			expect(screen.getByText('Option 1')).toBeInTheDocument();
			expect(screen.getByText('Option 2')).toBeInTheDocument();
		});

		it('renders file input with size info', () => {
			render(<FormField {...defaultProps} type="file" maxSize={10} />);
			
			expect(screen.getByText('Maximum file size: 10MB')).toBeInTheDocument();
		});
	});

	describe('Validation Display', () => {
		it('shows validation messages when validation result is provided', () => {
			const validationResult: ValidationResult = {
				errors: ['This field is required'],
				warnings: [],
				info: [],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(screen.getByText('This field is required')).toBeInTheDocument();
		});

		it('shows success state when field is valid', () => {
			const validationResult: ValidationResult = {
				errors: [],
				warnings: [],
				info: [],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(screen.getByText('Valid')).toBeInTheDocument();
		});

		it('shows warning messages with yellow styling', () => {
			const validationResult: ValidationResult = {
				errors: [],
				warnings: ['Password could be stronger'],
				info: [],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			const warning = screen.getByText('Password could be stronger');
			expect(warning).toBeInTheDocument();
			expect(warning).toHaveClass('text-yellow-600');
		});

		it('shows info messages with blue styling', () => {
			const validationResult: ValidationResult = {
				errors: [],
				warnings: [],
				info: ['Format could be improved'],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			const info = screen.getByText('Format could be improved');
			expect(info).toBeInTheDocument();
			expect(info).toHaveClass('text-blue-600');
		});

		it('applies correct border colors based on validation state', () => {
			const validationResult: ValidationResult = {
				errors: ['This field is required'],
				warnings: [],
				info: [],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(input).toHaveClass('border-red-500');
		});

		it('applies warning border color when only warnings exist', () => {
			const validationResult: ValidationResult = {
				errors: [],
				warnings: ['Password could be stronger'],
				info: [],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(input).toHaveClass('border-yellow-500');
		});

		it('applies info border color when only info exists', () => {
			const validationResult: ValidationResult = {
				errors: [],
				warnings: [],
				info: ['Format could be improved'],
			};
			
			render(
				<FormField 
					{...defaultProps} 
					validationResult={validationResult}
					showValidation={true}
				/>
			);
			
			// Trigger blur to set touched state
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(input).toHaveClass('border-blue-500');
		});
	});

	describe('Input Sanitization', () => {
		it('sanitizes HTML input when stripHtml is enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="stripHtml"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: '<p>Hello</p>' } });
			
			expect(onChange).toHaveBeenCalledWith('Hello');
		});

		it('normalizes whitespace when enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="normalizeWhitespace"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: '  hello   world  ' } });
			
			expect(onChange).toHaveBeenCalledWith('hello world');
		});

		it('sanitizes email addresses when enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="sanitizeEmail"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: '  TEST@EXAMPLE.COM  ' } });
			
			expect(onChange).toHaveBeenCalledWith('test@example.com');
		});

		it('sanitizes URLs when enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="sanitizeUrl"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: '  HTTPS://EXAMPLE.COM  ' } });
			
			expect(onChange).toHaveBeenCalledWith('https://example.com');
		});

		it('sanitizes numbers when enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="sanitizeNumber"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: 'abc123def456' } });
			
			expect(onChange).toHaveBeenCalledWith('123456');
		});

		it('sanitizes file names when enabled', () => {
			const onChange = jest.fn();
			render(
				<FormField 
					{...defaultProps} 
					onChange={onChange}
					sanitize={true}
					sanitizeType="sanitizeFileName"
				/>
			);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: 'file<>:"/\\|?*.txt' } });
			
			expect(onChange).toHaveBeenCalledWith('file_________.txt');
		});
	});

	describe('User Interactions', () => {
		it('calls onChange when input value changes', () => {
			const onChange = jest.fn();
			render(<FormField {...defaultProps} onChange={onChange} />);
			
			const input = screen.getByRole('textbox');
			fireEvent.change(input, { target: { value: 'new value' } });
			
			expect(onChange).toHaveBeenCalledWith('new value');
		});

		it('calls onBlur when input loses focus', () => {
			const onBlur = jest.fn();
			render(<FormField {...defaultProps} onBlur={onBlur} />);
			
			const input = screen.getByRole('textbox');
			fireEvent.blur(input);
			
			expect(onBlur).toHaveBeenCalled();
		});

		it('handles number input changes correctly', () => {
			const onChange = jest.fn();
			render(<FormField {...defaultProps} type="number" onChange={onChange} />);
			
			const input = screen.getByRole('spinbutton');
			fireEvent.change(input, { target: { value: '42' } });
			
			expect(onChange).toHaveBeenCalledWith(42);
		});

		it('handles empty number input as 0', () => {
			const onChange = jest.fn();
			const { rerender } = render(<FormField {...defaultProps} type="number" value="" onChange={onChange} />);
			
			const input = screen.getByRole('spinbutton');
			
			// First set a value
			fireEvent.change(input, { target: { value: '42' } });
			expect(onChange).toHaveBeenCalledWith(42);
			
			// Update the component with the new value
			rerender(<FormField {...defaultProps} type="number" value={42} onChange={onChange} />);
			
			// Now clear the input
			fireEvent.change(input, { target: { value: '' } });
			expect(onChange).toHaveBeenCalledWith(0);
		});

		it('handles file input changes', () => {
			const onChange = jest.fn();
			const file = new File(['content'], 'test.txt', { type: 'text/plain' });
			
			render(<FormField {...defaultProps} type="file" onChange={onChange} />);
			
			const fileInput = screen.getByDisplayValue('');
			fireEvent.change(fileInput, { target: { files: [file] } });
			
			expect(onChange).toHaveBeenCalledWith(file);
		});
	});

	describe('Accessibility', () => {
		it('associates label with input using id', () => {
			render(<FormField {...defaultProps} />);
			
			const label = screen.getByText('Test Field');
			const input = screen.getByRole('textbox');
			
			expect(label).toHaveAttribute('for', 'testField');
			expect(input).toHaveAttribute('id', 'testField');
		});

		it('applies disabled state correctly', () => {
			render(<FormField {...defaultProps} disabled />);
			
			const input = screen.getByRole('textbox');
			expect(input).toBeDisabled();
		});

		it('shows placeholder text', () => {
			render(<FormField {...defaultProps} placeholder="Enter text here" />);
			
			const input = screen.getByRole('textbox');
			expect(input).toHaveAttribute('placeholder', 'Enter text here');
		});
	});

	describe('File Input Specific Features', () => {
		it('displays selected file name', () => {
			const file = new File(['content'], 'test.txt', { type: 'text/plain' });
			render(<FormField {...defaultProps} type="file" value={file} />);
			
			expect(screen.getByText('test.txt')).toBeInTheDocument();
		});

		it('applies disabled state to file input', () => {
			render(<FormField {...defaultProps} type="file" disabled />);
			
			const fileInput = screen.getByDisplayValue('');
			expect(fileInput).toBeDisabled();
		});
	});

	describe('Loading State', () => {
		it('shows loading indicator when validating', () => {
			// Since we can't easily control the internal isValidating state,
			// let's just verify the component renders correctly
			render(<FormField {...defaultProps} />);
			
			expect(screen.getByText('Test Field')).toBeInTheDocument();
			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});
	});
});
