'use client';
import React, { useMemo, useCallback } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  showPrevNext = true,
  className = '',
  size = 'md',
  disabled = false,
}) => {
  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  // Check if we can go to first/last pages
  const canGoFirst = currentPage > 1;
  const canGoLast = currentPage < totalPages;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Size classes
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-sm',
      icon: 'h-4 w-4',
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'h-5 w-5',
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
    },
  };

  const handlePageChange = useCallback((page: number) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [disabled, totalPages, currentPage, onPageChange]);

  const handleFirst = useCallback(() => handlePageChange(1), [handlePageChange]);
  const handleLast = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages]);
  const handlePrev = useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);
  const handleNext = useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center justify-center space-x-1 ${className}`} aria-label="Pagination">
      {/* First Page Button */}
      {showFirstLast && (
        <button
          onClick={handleFirst}
          disabled={disabled || !canGoFirst}
          className={`
            ${sizeClasses[size].button} rounded-md font-medium transition-colors
            ${canGoFirst
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-300 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label="Go to first page"
        >
          <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Previous Page Button */}
      {showPrevNext && (
        <button
          onClick={handlePrev}
          disabled={disabled || !canGoPrev}
          className={`
            ${sizeClasses[size].button} rounded-md font-medium transition-colors
            ${canGoPrev
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-300 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label="Go to previous page"
        >
          <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Page Numbers */}
      {visiblePages.map((page) => {
        const isCurrentPage = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={disabled}
            className={`
              ${sizeClasses[size].button} rounded-md font-medium transition-colors
              ${isCurrentPage
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-current={isCurrentPage ? 'page' : undefined}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Page Button */}
      {showPrevNext && (
        <button
          onClick={handleNext}
          disabled={disabled || !canGoNext}
          className={`
            ${sizeClasses[size].button} rounded-md font-medium transition-colors
            ${canGoNext
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-300 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label="Go to next page"
        >
          <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Last Page Button */}
      {showFirstLast && (
        <button
          onClick={handleLast}
          disabled={disabled || !canGoLast}
          className={`
            ${sizeClasses[size].button} rounded-md font-medium transition-colors
            ${canGoLast
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-300 cursor-not-allowed'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label="Go to last page"
        >
          <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Page Info (Screen Reader Only) */}
      <span className="sr-only">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
};
