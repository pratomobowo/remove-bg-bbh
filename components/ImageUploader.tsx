'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { ImageUploaderProps } from '@/lib/types';

export default function ImageUploader({
  onImageUpload,
  maxSizeInMB,
  acceptedFormats,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Clear previous error
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File size exceeds ${maxSizeInMB}MB limit`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(`Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`);
        } else {
          setError('Invalid file. Please try again.');
        }
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Additional validation
        if (file.size > maxSizeInBytes) {
          setError(`File size exceeds ${maxSizeInMB}MB limit`);
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Call parent callback
        onImageUpload(file);
      }
    },
    [maxSizeInMB, maxSizeInBytes, acceptedFormats, onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[`image/${format}`] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSizeInBytes,
    multiple: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white'
          }
          ${error ? 'border-red-400 bg-red-50' : ''}
          focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
          touch-manipulation
        `}
        role="button"
        aria-label={preview ? "Replace uploaded image" : "Upload image"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }
        }}
      >
        <input {...getInputProps()} aria-label="File upload input" />
        
        {preview ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Uploaded image preview"
                className="max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md ring-2 ring-gray-200"
              />
              <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 hover:opacity-100 transition-opacity"
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
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              <span className="hidden sm:inline">Click or drag to replace image</span>
              <span className="sm:hidden">Tap to replace</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
              <p className="text-base sm:text-lg font-semibold text-blue-600 animate-pulse">
                Drop your image here
              </p>
            ) : (
              <>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  <span className="hidden sm:inline">Drag & drop your image here</span>
                  <span className="sm:hidden">Tap to upload image</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="hidden sm:inline">or click to browse</span>
                  <span className="sm:hidden">or drag & drop</span>
                </p>
              </>
            )}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-xs font-medium text-gray-600">
                {acceptedFormats.join(', ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-600">
                Max {maxSizeInMB}MB
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div 
          className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm animate-shake"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"
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
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                Upload Error
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
