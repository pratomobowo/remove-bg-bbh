'use client';

import { useState } from 'react';
import { ToolBarProps } from '@/lib/types';

export default function ToolBar({
  onRemoveBackground,
  onReset,
  onScaleChange,
  isProcessing,
  hasProcessedImage,
  processingProgress = 0,
}: ToolBarProps) {
  const [currentScale, setCurrentScale] = useState(1);
  return (
    <div className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-md p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Remove Background Button */}
        <div>
          <button
            onClick={onRemoveBackground}
            disabled={isProcessing}
            className={`
              w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-white text-sm sm:text-base
              transition-all duration-200 transform
              ${isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              shadow-md
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-label="Remove background from image"
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="hidden sm:inline">Processing...</span>
                <span className="sm:hidden">Processing</span>
              </>
            ) : (
              <>
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
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
                <span className="hidden sm:inline">Remove Background</span>
                <span className="sm:hidden">Remove BG</span>
              </>
            )}
          </button>

          {/* Progress Indicator */}
          {isProcessing && processingProgress > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100" role="status" aria-live="polite">
              <div className="flex justify-between text-sm font-medium text-blue-900 mb-2">
                <span>Processing</span>
                <span className="tabular-nums" aria-label={`${Math.round(processingProgress)} percent complete`}>{Math.round(processingProgress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden shadow-inner" role="progressbar" aria-valuenow={Math.round(processingProgress)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scale Slider */}
        <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
          <label
            htmlFor="scale-slider"
            className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3"
          >
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Scale
            </span>
            <span className="text-blue-600 font-bold tabular-nums text-sm sm:text-base" aria-live="polite">{Math.round(currentScale * 100)}%</span>
          </label>
          <input
            id="scale-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={currentScale}
            onChange={(e) => {
              const newScale = parseFloat(e.target.value);
              setCurrentScale(newScale);
              onScaleChange(newScale);
            }}
            disabled={isProcessing || !hasProcessedImage}
            className={`
              w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer shadow-inner
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
              ${isProcessing || !hasProcessedImage ? 'opacity-50 cursor-not-allowed' : 'hover:h-3 transition-all'}
            `}
            style={{
              background: isProcessing || !hasProcessedImage
                ? '#e5e7eb'
                : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentScale - 0.5) / 1.5) * 100}%, #e5e7eb ${((currentScale - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`,
            }}
            aria-label="Scale image"
            aria-valuemin={50}
            aria-valuemax={200}
            aria-valuenow={Math.round(currentScale * 100)}
            aria-valuetext={`${Math.round(currentScale * 100)} percent`}
          />
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
            <span className="text-gray-600">50%</span>
            <span className="text-gray-700">100%</span>
            <span className="text-gray-600">200%</span>
          </div>
        </div>

        {/* Reset Button */}
        <div>
          <button
            onClick={onReset}
            disabled={isProcessing || !hasProcessedImage}
            className={`
              w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
              transition-all duration-200 transform
              ${isProcessing || !hasProcessedImage
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-gray-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-label="Reset image to original state"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
