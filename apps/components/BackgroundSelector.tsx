'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { BackgroundSelectorProps } from '@/lib/types';

export default function BackgroundSelector({
  onColorSelect,
  onImageSelect,
  currentBackground,
}: BackgroundSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<'color' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preset colors
  const presetColors = [
    '#ffffff', // White
    '#000000', // Black
    '#f3f4f6', // Light Gray
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setError(null);
    onColorSelect(color);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File size exceeds 10MB limit');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file format. Please use JPG, PNG, or WEBP');
        } else {
          setError('Invalid file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Call parent callback
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleClear = () => {
    setSelectedColor('#ffffff');
    setImagePreview(null);
    setError(null);
    onColorSelect('#ffffff');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          Background
        </h3>
        <button
          onClick={handleClear}
          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Clear background selection"
        >
          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </div>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg" role="tablist" aria-label="Background type selection">
        <button
          onClick={() => setSelectedTab('color')}
          role="tab"
          aria-selected={selectedTab === 'color'}
          aria-controls="color-panel"
          className={`
            flex-1 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedTab === 'color'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="hidden sm:inline">Solid Color</span>
            <span className="sm:hidden">Color</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('image')}
          role="tab"
          aria-selected={selectedTab === 'image'}
          aria-controls="image-panel"
          className={`
            flex-1 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedTab === 'image'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Custom Image</span>
            <span className="sm:hidden">Image</span>
          </div>
        </button>
      </div>

      {/* Color Picker Tab */}
      {selectedTab === 'color' && (
        <div className="space-y-4" role="tabpanel" id="color-panel" aria-labelledby="color-tab">
          {/* Preset Colors Grid */}
          <div className="grid grid-cols-5 gap-3" role="group" aria-label="Preset color options">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`
                  relative w-full aspect-square rounded-xl border-2 transition-all duration-200
                  hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
                  ${selectedColor === color
                    ? 'border-blue-500 ring-4 ring-blue-200 scale-105 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400 shadow-sm'
                  }
                `}
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Select ${color === '#ffffff' ? 'white' : color === '#000000' ? 'black' : color} background color`}
                aria-pressed={selectedColor === color}
              >
                {color === '#ffffff' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 rounded-lg" />
                  </div>
                )}
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label htmlFor="custom-color-picker" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">
              Custom Color
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <input
                  id="custom-color-picker"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="h-10 w-16 sm:h-12 sm:w-20 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Custom color picker"
                />
              </div>
              <input
                id="custom-color-hex"
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg font-mono text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all"
                aria-label="Custom color hex code"
              />
            </div>
          </div>

          {/* Current Background Preview */}
          {currentBackground && typeof currentBackground === 'string' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Current Background
              </label>
              <div
                className="w-full h-24 rounded-xl border-2 border-gray-300 shadow-inner"
                style={{ backgroundColor: currentBackground }}
              />
            </div>
          )}
        </div>
      )}

      {/* Image Upload Tab */}
      {selectedTab === 'image' && (
        <div className="space-y-4" role="tabpanel" id="image-panel" aria-labelledby="image-tab">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white'
              }
              ${error ? 'border-red-400 bg-red-50' : ''}
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
            `}
            role="button"
            aria-label={imagePreview ? "Replace background image" : "Upload background image"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }
            }}
          >
            <input {...getInputProps()} aria-label="Background image file upload" />

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Background preview"
                    className="max-h-32 mx-auto rounded-lg shadow-md ring-2 ring-gray-200"
                  />
                  <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <svg
                      className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Click or drag to replace background image
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isDragActive ? (
                  <p className="text-base font-medium text-blue-600">
                    Drop your background image here
                  </p>
                ) : (
                  <>
                    <p className="text-base font-medium text-gray-900">
                      Upload background image
                    </p>
                    <p className="text-sm text-gray-500">
                      Drag & drop or click to browse
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-400">
                  JPG, PNG, WEBP (max 10MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-400 mt-0.5"
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
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Background Image Preview */}
          {currentBackground && currentBackground instanceof File && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Background
              </label>
              <div className="w-full h-32 rounded-lg border-2 border-gray-300 overflow-hidden">
                <img
                  src={imagePreview || ''}
                  alt="Current background"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
