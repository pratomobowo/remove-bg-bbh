interface LoadingOverlayProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}

export default function LoadingOverlay({
  isVisible,
  progress,
  message = 'Processing...',
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
      aria-describedby="loading-description"
    >
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleIn">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Loading Spinner */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20" role="status" aria-label="Loading">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
              style={{
                animationDuration: '0.8s',
              }}
              aria-hidden="true"
            ></div>
            <div className="absolute inset-2 border-4 border-blue-300 rounded-full border-b-transparent animate-spin"
              style={{
                animationDuration: '1.2s',
                animationDirection: 'reverse',
              }}
              aria-hidden="true"
            ></div>
          </div>

          {/* Progress Percentage */}
          <div 
            id="loading-title"
            className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {Math.round(progress)}%
          </div>

          {/* Status Message */}
          <p 
            id="loading-description"
            className="text-sm sm:text-base text-gray-800 text-center font-medium"
          >
            {message}
          </p>

          {/* Progress Bar */}
          <div 
            className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Processing progress"
          >
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
