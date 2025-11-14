'use client';

import { useState, useCallback } from 'react';
import { parseVideoUrl, convertToBestFormat } from '@/lib/urlUtils';

interface VideoUrlInputProps {
  value?: string;
  onChange: (url: string, isValid: boolean, error?: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

/**
 * Video URL Input Component
 * Handles YouTube, Google Drive, and direct video URLs
 * Automatically validates and converts URLs to embeddable format
 */
export function VideoUrlInput({
  value = '',
  onChange,
  placeholder = 'Paste YouTube or Google Drive link here...',
  className = '',
  label = 'Video URL',
}: VideoUrlInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);

  const handleChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
      setError(undefined);

      // If empty, clear error and call onChange with empty
      if (!newValue.trim()) {
        onChange('', false);
        return;
      }

      // Parse the URL
      const parsed = parseVideoUrl(newValue.trim());

      if (!parsed.isValid) {
        setError(parsed.error);
        onChange(newValue, false, parsed.error);
        return;
      }

      // Convert Google Drive URLs to embeddable format
      const displayUrl = convertToBestFormat(newValue.trim());

      // Call onChange with the converted URL
      onChange(displayUrl, true);
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      console.log('📋 URL pasted:', pastedText);
      console.log('📋 Pasted text length:', pastedText.length);

      // Small delay to let the paste complete
      setTimeout(() => {
        handleChange(pastedText);
      }, 0);
    },
    [handleChange]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      handleChange(inputValue);
    }
  }, [inputValue, handleChange]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="url"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          // Clear error on typing
          if (error) setError(undefined);
        }}
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={isValidating}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {inputValue && !error && (
        <p className="mt-1 text-sm text-green-600">
          ✓ Valid {parseVideoUrl(inputValue).type === 'youtube' ? 'YouTube' : 
                   parseVideoUrl(inputValue).type === 'google-drive' ? 'Google Drive' : 
                   'video'} URL
        </p>
      )}
    </div>
  );
}

