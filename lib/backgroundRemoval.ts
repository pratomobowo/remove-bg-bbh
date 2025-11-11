/**
 * Server-side background removal using Python rembg
 * This module interfaces with the Next.js API endpoint for background removal
 */

/**
 * Model caching configuration
 * Note: Caching is now handled server-side
 */
export const MODEL_CACHE_CONFIG = {
  enabled: true,
  defaultModel: 'medium' as const,
  cacheKeyPrefix: 'background-removal',
  preloadOnInit: false, // No preload needed with server-side processing
};

/**
 * Progress callback type for background removal process
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Configuration options for background removal
 */
export interface BackgroundRemovalOptions {
  onProgress?: ProgressCallback;
  maxRetries?: number;
  model?: 'small' | 'medium' | 'large';
  quality?: number;
}

/**
 * Error class for background removal failures
 */
export class BackgroundRemovalError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'BackgroundRemovalError';
  }
}

/**
 * Process background removal on an image file with progress tracking and retry logic
 * 
 * @param imageFile - The source image file to process
 * @param options - Configuration options including progress callback and retry settings
 * @returns Promise resolving to a Blob containing the processed image with transparent background
 * @throws BackgroundRemovalError if processing fails after all retry attempts
 */
export async function processBackgroundRemoval(
  imageFile: File,
  options: BackgroundRemovalOptions = {}
): Promise<Blob> {
  const { onProgress, maxRetries = 2 } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;

      // Report progress: starting
      onProgress?.(5);

      // Create form data with the image
      const formData = new FormData();
      formData.append('image', imageFile);

      // Report progress: uploading
      onProgress?.(15);

      // Simulate progress updates while waiting for processing
      let progressInterval: NodeJS.Timeout | null = null;
      let currentProgress = 15;

      const progressUpdater = () => {
        currentProgress += Math.random() * 15;
        if (currentProgress < 85) {
          onProgress?.(Math.min(currentProgress, 85));
        }
      };

      progressInterval = setInterval(progressUpdater, 500);

      try {
        const response = await fetch('/api/remove-background', {
          method: 'POST',
          body: formData,
        });

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        // Report progress: finalizing
        onProgress?.(90);

        // Get the result blob
        const blob = await response.blob();

        // Ensure we got a valid blob
        if (!blob || blob.size === 0) {
          throw new Error('Background removal produced empty result');
        }

        // Success - report complete
        onProgress?.(100);
        return blob;
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        throw error;
      }
    } catch (error) {
      lastError = error;

      // Log the error for debugging
      console.error(`Background removal attempt ${attempt} failed:`, error);

      // If this was the last attempt, throw the error
      if (attempt >= maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed - throw a user-friendly error
  const errorMessage =
    lastError instanceof Error ? lastError.message : 'Unknown error occurred';

  throw new BackgroundRemovalError(
    `Failed to remove background after ${maxRetries} attempts: ${errorMessage}`,
    lastError,
    true
  );
}

/**
 * Detailed browser support check result
 */
export interface BrowserSupportResult {
  supported: boolean;
  issues: string[];
}

/**
 * Validate if the browser supports background removal with detailed feedback
 * Checks for WebGL support which is required by the ML model
 * 
 * @returns Object with support status and list of issues
 */
export function checkBrowserSupport(): BrowserSupportResult {
  const issues: string[] = [];

  try {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      issues.push('WebGL is not supported. This is required for AI background removal.');
    }

    // Check for required Canvas API features
    if (!canvas.toDataURL) {
      issues.push('Canvas toDataURL is not supported.');
    }
    
    if (!canvas.toBlob) {
      issues.push('Canvas toBlob is not supported.');
    }

    // Check for File API
    if (!window.File || !window.FileReader || !window.Blob) {
      issues.push('File API is not fully supported.');
    }

    return {
      supported: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('Browser support check failed:', error);
    return {
      supported: false,
      issues: ['Failed to check browser compatibility. Please use a modern browser.'],
    };
  }
}

/**
 * Validate if the browser supports background removal (simple boolean check)
 * Checks for WebGL support which is required by the ML model
 * 
 * @returns true if browser supports background removal, false otherwise
 */
export function isBrowserSupported(): boolean {
  return checkBrowserSupport().supported;
}

/**
 * Check if the ML model is likely cached in browser storage
 * Note: This is a heuristic check and may not be 100% accurate
 * 
 * @returns true if model appears to be cached
 */
export function isModelCached(): boolean {
  try {
    // Check if IndexedDB has entries related to the model
    // The library uses IndexedDB for caching
    if (!window.indexedDB) {
      return false;
    }

    // We can't directly check IndexedDB synchronously, so we check localStorage
    // for any indication that the model has been loaded before
    const cacheIndicator = localStorage.getItem(`${MODEL_CACHE_CONFIG.cacheKeyPrefix}-loaded`);
    return cacheIndicator === 'true';
  } catch (error) {
    console.warn('Failed to check model cache status:', error);
    return false;
  }
}

/**
 * Mark the model as cached in localStorage
 * This is called after successful model load
 */
function markModelAsCached(): void {
  try {
    localStorage.setItem(`${MODEL_CACHE_CONFIG.cacheKeyPrefix}-loaded`, 'true');
  } catch (error) {
    console.warn('Failed to mark model as cached:', error);
  }
}

/**
 * Clear the model cache indicator
 * Note: This doesn't clear the actual model from IndexedDB,
 * just the indicator in localStorage
 */
export function clearCacheIndicator(): void {
  try {
    localStorage.removeItem(`${MODEL_CACHE_CONFIG.cacheKeyPrefix}-loaded`);
  } catch (error) {
    console.warn('Failed to clear cache indicator:', error);
  }
}

/**
 * Preload the ML model to improve performance on first use
 * This should be called early in the application lifecycle
 * 
 * @returns Promise that resolves when model is cached
 */
export async function preloadModel(): Promise<void> {
  try {
    // With server-side processing, model loads on first request
    // No preload needed - mark as ready
    markModelAsCached();
    console.log('Server-side background removal ready');
  } catch (error) {
    console.warn('Preload check failed:', error);
    // Don't throw - preloading is optional
  }
}

/**
 * Initialize background removal with caching
 * Call this function when the app starts to set up model caching
 * 
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeBackgroundRemoval(): Promise<void> {
  if (!MODEL_CACHE_CONFIG.enabled) {
    console.log('Model caching is disabled');
    return;
  }

  if (!isBrowserSupported()) {
    console.warn('Browser does not support background removal (WebGL required)');
    return;
  }

  // Check if model is already cached
  if (isModelCached()) {
    console.log('ML model already cached, skipping preload');
    return;
  }

  // Preload model if configured to do so
  if (MODEL_CACHE_CONFIG.preloadOnInit) {
    console.log('Preloading ML model for caching...');
    await preloadModel();
  }
}
