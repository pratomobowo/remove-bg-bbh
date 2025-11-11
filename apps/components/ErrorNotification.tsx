'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ErrorNotificationProps {
  error: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
}

/**
 * Error notification component with auto-hide and retry functionality
 * Displays user-friendly error messages with optional retry action
 */
export default function ErrorNotification({
  error,
  onDismiss,
  onRetry,
  autoHideDuration = 0, // 0 means no auto-hide
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for animation to complete
  }, [onDismiss]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      // Auto-hide after duration if specified
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHideDuration, handleDismiss]);

  const handleRetry = () => {
    handleDismiss();
    if (onRetry) {
      setTimeout(() => {
        onRetry();
      }, 300); // Wait for animation to complete
    }
  };

  if (!error) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-md z-50
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Error Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-red-800">Error</h3>
            <p className="mt-1 text-xs sm:text-sm text-red-700 break-words">{error}</p>

            {/* Action Buttons */}
            {onRetry && (
              <div className="mt-2 sm:mt-3">
                <button
                  onClick={handleRetry}
                  className="text-xs sm:text-sm font-medium text-red-800 hover:text-red-900 underline touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  aria-label="Retry failed operation"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors p-1 touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            aria-label="Dismiss error notification"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
