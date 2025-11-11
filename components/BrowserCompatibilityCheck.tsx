'use client';

import { useEffect, useState } from 'react';

interface CompatibilityIssue {
  feature: string;
  supported: boolean;
  required: boolean;
  message: string;
}

interface BrowserCompatibilityCheckProps {
  children: React.ReactNode;
}

/**
 * Check if WebGL is supported in the browser
 */
function checkWebGLSupport(): CompatibilityIssue {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    const supported = !!gl;
    
    return {
      feature: 'WebGL',
      supported,
      required: true,
      message: supported
        ? 'WebGL is supported'
        : 'WebGL is not supported. This is required for AI background removal.',
    };
  } catch {
    return {
      feature: 'WebGL',
      supported: false,
      required: true,
      message: 'Failed to check WebGL support. This feature is required for AI background removal.',
    };
  }
}

/**
 * Check if Canvas API is supported
 */
function checkCanvasSupport(): CompatibilityIssue {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const supported = !!(
      ctx &&
      typeof canvas.toDataURL === 'function' &&
      typeof canvas.toBlob === 'function'
    );
    
    return {
      feature: 'Canvas API',
      supported,
      required: true,
      message: supported
        ? 'Canvas API is supported'
        : 'Canvas API is not fully supported. This is required for image editing.',
    };
  } catch {
    return {
      feature: 'Canvas API',
      supported: false,
      required: true,
      message: 'Failed to check Canvas API support. This feature is required for image editing.',
    };
  }
}

/**
 * Check if File API is supported
 */
function checkFileAPISupport(): CompatibilityIssue {
  const supported = !!(
    window.File &&
    window.FileReader &&
    window.FileList &&
    window.Blob
  );
  
  return {
    feature: 'File API',
    supported,
    required: true,
    message: supported
      ? 'File API is supported'
      : 'File API is not supported. This is required for image upload.',
  };
}

/**
 * Check if IndexedDB is supported (for ML model caching)
 */
function checkIndexedDBSupport(): CompatibilityIssue {
  const supported = !!window.indexedDB;
  
  return {
    feature: 'IndexedDB',
    supported,
    required: false,
    message: supported
      ? 'IndexedDB is supported'
      : 'IndexedDB is not supported. ML model caching will be disabled, which may affect performance.',
  };
}

/**
 * Check if localStorage is supported
 */
function checkLocalStorageSupport(): CompatibilityIssue {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    return {
      feature: 'localStorage',
      supported: true,
      required: false,
      message: 'localStorage is supported',
    };
  } catch {
    return {
      feature: 'localStorage',
      supported: false,
      required: false,
      message: 'localStorage is not available. Some features may not work properly.',
    };
  }
}

/**
 * Detect browser name and version
 */
function detectBrowser(): { name: string; version: string; supported: boolean } {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  let supported = true;

  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    supported = parseInt(version) >= 90;
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    supported = parseInt(version) >= 90;
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    supported = parseInt(version) >= 88;
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    supported = parseInt(version) >= 14;
  }

  return { name, version, supported };
}

/**
 * Component that checks browser compatibility and displays warnings
 */
export default function BrowserCompatibilityCheck({ children }: BrowserCompatibilityCheckProps) {
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [browserInfo, setBrowserInfo] = useState<{ name: string; version: string; supported: boolean } | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize ONNX Runtime early in the app lifecycle
      try {
        const { initializeOnnxRuntime } = await import('@/lib/onnxConfig');
        console.log('Initializing ONNX Runtime...');
        await initializeOnnxRuntime();
      } catch (error) {
        console.warn('ONNX Runtime initialization warning (app will continue):', error);
      }

      // Run all compatibility checks
      const checks = [
        checkWebGLSupport(),
        checkCanvasSupport(),
        checkFileAPISupport(),
        checkIndexedDBSupport(),
        checkLocalStorageSupport(),
      ];

      const detectedIssues = checks.filter(check => !check.supported);
      setIssues(detectedIssues);

      // Detect browser
      const browser = detectBrowser();
      setBrowserInfo(browser);

      // Show warning if there are critical issues or unsupported browser
      const hasCriticalIssues = detectedIssues.some(issue => issue.required);
      setShowWarning(hasCriticalIssues || !browser.supported);
    };

    initializeApp().catch(error => {
      console.error('Failed to initialize app:', error);
    });
  }, []);

  // If no issues, render children normally
  if (!showWarning) {
    return <>{children}</>;
  }

  // Render compatibility warning
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" role="alert" aria-live="polite">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-gray-900 text-center">
          Browser Compatibility Issue
        </h2>

        <p className="mt-2 text-gray-600 text-center">
          Your browser may not support all features required for this application.
        </p>

        {/* Browser Information */}
        {browserInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Detected Browser
            </h3>
            <p className="text-sm text-gray-700">
              {browserInfo.name} {browserInfo.version}
            </p>
            {!browserInfo.supported && (
              <p className="mt-2 text-sm text-yellow-700">
                This browser version may not be fully supported. Please update to the latest version.
              </p>
            )}
          </div>
        )}

        {/* Compatibility Issues */}
        {issues.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Compatibility Issues
            </h3>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    issue.required
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        issue.required ? 'text-red-600' : 'text-yellow-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        issue.required ? 'text-red-900' : 'text-yellow-900'
                      }`}>
                        {issue.feature} {issue.required ? '(Required)' : '(Optional)'}
                      </p>
                      <p className={`mt-1 text-sm ${
                        issue.required ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {issue.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Browsers */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Recommended Browsers
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Google Chrome 90 or later</li>
            <li>• Microsoft Edge 90 or later</li>
            <li>• Mozilla Firefox 88 or later</li>
            <li>• Safari 14 or later</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowWarning(false)}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Continue despite compatibility warnings"
          >
            Continue Anyway
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Reload the page"
          >
            Reload Page
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Some features may not work properly if you continue with an unsupported browser.
        </p>
      </div>
    </div>
  );
}
