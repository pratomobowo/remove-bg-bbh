'use client';

import { useState } from 'react';
import { DownloadButtonProps } from '@/lib/types';

export default function DownloadButton({
  blob,
  onDownload,
  disabled,
}: DownloadButtonProps) {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDownload = () => {
    if (!blob || disabled) return;

    try {
      // Create object URL from blob
      const url = URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-photo-${Date.now()}.${selectedFormat}`;

      // Ensure the link is in the DOM for some browsers
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      onDownload(selectedFormat);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formats = [
    { value: 'png' as const, label: 'PNG', description: 'Best quality, supports transparency' },
    { value: 'jpg' as const, label: 'JPG', description: 'Smaller file size, no transparency' },
    { value: 'webp' as const, label: 'WEBP', description: 'Modern format, good compression' },
  ];

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Main Download Button */}
        <button
          onClick={handleDownload}
          disabled={disabled}
          className={`
            flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-white text-sm sm:text-base
            transition-all duration-200 transform
            ${disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
            shadow-md
            focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2
          `}
          aria-label={`Download image as ${selectedFormat.toUpperCase()}`}
        >
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="hidden sm:inline">Download {selectedFormat.toUpperCase()}</span>
          <span className="sm:hidden">{selectedFormat.toUpperCase()}</span>
        </button>

        {/* Format Selector Dropdown */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className={`
            px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl font-semibold text-white
            transition-all duration-200 transform
            ${disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-md
            focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2
          `}
          aria-label="Select download format"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <svg
            className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown Content */}
          <div 
            className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden animate-slideDown"
            role="menu"
            aria-label="Download format options"
          >
            <div className="p-2">
              <div className="text-xs font-bold text-gray-800 px-3 py-2 uppercase tracking-wide">
                Select Format
              </div>
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => {
                    setSelectedFormat(format.value);
                    setIsDropdownOpen(false);
                  }}
                  role="menuitem"
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    ${selectedFormat === format.value
                      ? 'bg-green-50 text-green-800 border border-green-200 shadow-sm'
                      : 'text-gray-800 hover:bg-gray-50 border border-transparent'
                    }
                  `}
                  aria-current={selectedFormat === format.value ? 'true' : 'false'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{format.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {format.description}
                      </div>
                    </div>
                    {selectedFormat === format.value && (
                      <div className="flex-shrink-0 ml-3">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
