'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { EditorState, EditorAction, Transform } from '@/lib/types';
import { needsResize, resizeImage } from '@/lib/imageProcessing';

// Lazy load ONNX Runtime dependent modules to avoid initialization errors
const lazyImportBackgroundRemoval = async () => {
  const backgroundRemovalModule = await import('@/lib/backgroundRemoval');
  return backgroundRemovalModule;
};
import ImageUploader from '@/components/ImageUploader';
import CanvasEditor from '@/components/CanvasEditor';
import BackgroundSelector from '@/components/BackgroundSelector';
import ToolBar from '@/components/ToolBar';
import DownloadButton from '@/components/DownloadButton';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotification from '@/components/ErrorNotification';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Initial state for the editor
const initialState: EditorState = {
  sourceImage: null,
  sourceFile: null,
  processedImage: null,
  processedBlob: null,
  backgroundColor: null,
  backgroundImage: null,
  transform: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  },
  isProcessing: false,
  processingProgress: 0,
  error: null,
  canvasRef: null,
};

// Helper function to revoke blob URL from image src
function revokeBlobUrl(image: HTMLImageElement | null) {
  if (image && image.src && image.src.startsWith('blob:')) {
    URL.revokeObjectURL(image.src);
  }
}

// Reducer function for state management
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_SOURCE_IMAGE':
      // Clean up previous source image blob URL
      revokeBlobUrl(state.sourceImage);
      
      return {
        ...state,
        sourceImage: action.payload.image,
        sourceFile: action.payload.file,
        error: null,
      };

    case 'SET_PROCESSED_IMAGE':
      // Clean up previous processed image blob URL
      revokeBlobUrl(state.processedImage);
      
      return {
        ...state,
        processedImage: action.payload.image,
        processedBlob: action.payload.blob,
        isProcessing: false,
        processingProgress: 0,
        error: null,
      };

    case 'SET_BACKGROUND_COLOR':
      // Clean up background image blob URL when switching to color
      revokeBlobUrl(state.backgroundImage);
      
      return {
        ...state,
        backgroundColor: action.payload,
        backgroundImage: null, // Clear background image when color is selected
      };

    case 'SET_BACKGROUND_IMAGE':
      // Clean up previous background image blob URL
      revokeBlobUrl(state.backgroundImage);
      
      return {
        ...state,
        backgroundImage: action.payload,
        backgroundColor: null, // Clear background color when image is selected
      };

    case 'UPDATE_TRANSFORM':
      return {
        ...state,
        transform: {
          ...state.transform,
          ...action.payload,
        },
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_PROGRESS':
      return {
        ...state,
        processingProgress: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
        processingProgress: 0,
      };

    case 'RESET':
      // Clean up all blob URLs to prevent memory leaks
      revokeBlobUrl(state.processedImage);
      revokeBlobUrl(state.backgroundImage);
      
      return {
        ...initialState,
        sourceImage: state.sourceImage,
        sourceFile: state.sourceFile,
      };

    default:
      return state;
  }
}

function PhotoBackgroundEditorContent() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const lastFailedOperationRef = useRef<(() => void) | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Track blob URLs for cleanup
  const trackBlobUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      blobUrlsRef.current.add(url);
    }
  }, []);

  const revokeBlobUrlTracked = useCallback((url: string) => {
    if (url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  }, []);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const { isBrowserSupported } = await lazyImportBackgroundRemoval();
        if (!isBrowserSupported()) {
          dispatch({
            type: 'SET_ERROR',
            payload: 'Your browser does not support this application. Please use a modern browser with WebGL support.',
          });
        }
      } catch (error) {
        console.error('Failed to check browser support:', error);
      }
    };
    checkSupport();
  }, []);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke all tracked blob URLs to prevent memory leaks
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // Reset state when new image is uploaded
      dispatch({ type: 'RESET' });
      
      // Create image element from file
      const imageUrl = URL.createObjectURL(file);
      trackBlobUrl(imageUrl);
      const img = new Image();

      img.onload = async () => {
        try {
          // Check if image needs resizing for optimization (max 2048px)
          let processedFile = file;
          
          if (needsResize(img, 2048, 2048)) {
            console.log(`Resizing large image from ${img.width}x${img.height} to max 2048px`);
            
            // Resize the image to optimize processing
            const resizedBlob = await resizeImage(img, 2048, 2048);
            processedFile = new File([resizedBlob], file.name, { type: 'image/png' });
            
            // Create new image element from resized blob
            const resizedUrl = URL.createObjectURL(resizedBlob);
            trackBlobUrl(resizedUrl);
            const resizedImg = new Image();
            
            resizedImg.onload = () => {
              dispatch({
                type: 'SET_SOURCE_IMAGE',
                payload: { image: resizedImg, file: processedFile },
              });
              revokeBlobUrlTracked(resizedUrl);
            };
            
            resizedImg.onerror = () => {
              dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to process resized image. Please try another file.',
              });
              revokeBlobUrlTracked(resizedUrl);
            };
            
            resizedImg.src = resizedUrl;
          } else {
            // Image is within size limits, use as-is
            dispatch({
              type: 'SET_SOURCE_IMAGE',
              payload: { image: img, file: processedFile },
            });
          }
          
          revokeBlobUrlTracked(imageUrl);
        } catch (error) {
          console.error('Image optimization failed:', error);
          dispatch({
            type: 'SET_ERROR',
            payload: 'Failed to optimize image. Please try a smaller file.',
          });
          revokeBlobUrlTracked(imageUrl);
        }
      };

      img.onerror = () => {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load image. Please try another file.',
        });
        revokeBlobUrlTracked(imageUrl);
      };

      img.src = imageUrl;
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to upload image. Please try again.',
      });
    }
  }, [trackBlobUrl, revokeBlobUrlTracked]);

  // Process background removal (actual logic)
  const processRemoveBackground = useCallback(async () => {
    if (!state.sourceFile) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please upload an image first.',
      });
      return;
    }

    // Store this operation for retry
    lastFailedOperationRef.current = processRemoveBackground;

    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_PROGRESS', payload: 0 });

      // Lazy load background removal module
      const { processBackgroundRemoval } = await lazyImportBackgroundRemoval();

      // Process background removal with progress tracking
      const blob = await processBackgroundRemoval(state.sourceFile, {
        onProgress: (progress) => {
          dispatch({ type: 'SET_PROGRESS', payload: progress });
        },
        maxRetries: 2,
        model: 'medium',
        quality: 0.9,
      });

      // Create image element from blob
      const imageUrl = URL.createObjectURL(blob);
      trackBlobUrl(imageUrl);
      const img = new Image();

      img.onload = () => {
        dispatch({
          type: 'SET_PROCESSED_IMAGE',
          payload: { image: img, blob },
        });
        revokeBlobUrlTracked(imageUrl);
        // Clear the failed operation on success
        lastFailedOperationRef.current = null;
      };

      img.onerror = () => {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load processed image. Please try again.',
        });
        revokeBlobUrlTracked(imageUrl);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('Background removal failed:', error);

      // Provide user-friendly error message
      let errorMessage = 'Failed to remove background. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('WebGL')) {
          errorMessage = 'Your browser does not support the required features. Please try a different browser.';
        } else if (error.message.includes('memory')) {
          errorMessage = 'The image is too large to process. Please try a smaller image.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage,
      });
    }
  }, [state.sourceFile, trackBlobUrl, revokeBlobUrlTracked]);

  // Handle background removal - show confirmation dialog
  const handleRemoveBackground = useCallback(() => {
    if (!state.sourceFile) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please upload an image first.',
      });
      return;
    }
    setShowConfirmDialog(true);
  }, [state.sourceFile]);

  // Handle background color selection
  const handleColorSelect = useCallback((color: string) => {
    dispatch({ type: 'SET_BACKGROUND_COLOR', payload: color });
  }, []);

  // Handle background image selection
  const handleImageSelect = useCallback(async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      trackBlobUrl(imageUrl);
      const img = new Image();

      img.onload = () => {
        dispatch({ type: 'SET_BACKGROUND_IMAGE', payload: img });
        revokeBlobUrlTracked(imageUrl);
      };

      img.onerror = () => {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load background image. Please try another file.',
        });
        revokeBlobUrlTracked(imageUrl);
      };

      img.src = imageUrl;
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to upload background image. Please try again.',
      });
    }
  }, [trackBlobUrl, revokeBlobUrlTracked]);

  // Handle transform changes
  const handleTransformChange = useCallback((transform: Transform) => {
    dispatch({ type: 'UPDATE_TRANSFORM', payload: transform });
  }, []);

  // Handle scale changes from toolbar
  const handleScaleChange = useCallback((scale: number) => {
    dispatch({ type: 'UPDATE_TRANSFORM', payload: { scale } });
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Handle download
  const handleDownload = useCallback((format: 'png' | 'jpg' | 'webp') => {
    console.log(`Downloaded image as ${format}`);
  }, []);

  // Handle retry for failed operations
  const handleRetry = useCallback(() => {
    if (lastFailedOperationRef.current) {
      lastFailedOperationRef.current();
    }
  }, []);

  // Handle error dismissal
  const handleDismissError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 shadow-lg" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg" aria-hidden="true">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">
                Photo Background Editor
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 hidden sm:block">
                Remove and replace photo backgrounds with AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8" role="main">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-4 sm:space-y-6" role="region" aria-label="Image editing controls">
            {/* Image Uploader */}
            <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-bold" aria-hidden="true">1</span>
                  <span className="hidden sm:inline">Upload Image</span>
                  <span className="sm:hidden">Upload</span>
                </h2>
                {state.sourceImage && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200" role="status">
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Complete</span>
                    <span className="sm:hidden">✓</span>
                  </span>
                )}
              </div>
              <ImageUploader
                onImageUpload={handleImageUpload}
                maxSizeInMB={10}
                acceptedFormats={['jpeg', 'jpg', 'png', 'webp']}
              />
            </section>

            {/* Toolbar */}
            {state.sourceImage && (
              <section>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-bold" aria-hidden="true">2</span>
                    <span className="hidden sm:inline">Remove Background</span>
                    <span className="sm:hidden">Remove BG</span>
                  </h2>
                  {state.processedImage && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200" role="status">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Complete</span>
                      <span className="sm:hidden">✓</span>
                    </span>
                  )}
                </div>
                <ToolBar
                  onRemoveBackground={handleRemoveBackground}
                  onReset={handleReset}
                  onScaleChange={handleScaleChange}
                  isProcessing={state.isProcessing}
                  hasProcessedImage={!!state.processedImage}
                  processingProgress={state.processingProgress}
                />
              </section>
            )}

            {/* Background Selector */}
            {state.processedImage && (
              <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-bold" aria-hidden="true">3</span>
                    <span className="hidden sm:inline">Replace Background</span>
                    <span className="sm:hidden">Replace BG</span>
                  </h2>
                  {(state.backgroundColor || state.backgroundImage) && (
                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200" role="status">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Complete</span>
                      <span className="sm:hidden">✓</span>
                    </span>
                  )}
                </div>
                <BackgroundSelector
                  onColorSelect={handleColorSelect}
                  onImageSelect={handleImageSelect}
                  currentBackground={state.backgroundColor || null}
                />
                <p className="text-xs text-gray-500 mt-3">
                  Optional: Leave transparent or choose a background
                </p>
              </section>
            )}

            {/* Download Button */}
            {state.processedImage && (
              <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-bold" aria-hidden="true">4</span>
                  <span className="hidden sm:inline">Download Result</span>
                  <span className="sm:hidden">Download</span>
                </h2>
                <DownloadButton
                  blob={state.processedBlob}
                  onDownload={handleDownload}
                  disabled={!state.processedBlob}
                />
              </section>
            )}
          </div>

          {/* Right Column - Canvas Editor */}
          <div className="lg:col-span-2 order-first lg:order-last" role="region" aria-label="Image preview">
            <section className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </h2>
              {!state.sourceImage ? (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-center p-4 sm:p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-md mb-3 sm:mb-4">
                      <svg
                        className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-gray-700">
                      Upload an image to get started
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Your preview will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <CanvasEditor
                  sourceImage={state.sourceImage}
                  processedImage={state.processedImage}
                  backgroundColor={state.backgroundColor}
                  backgroundImage={state.backgroundImage}
                  onTransformChange={handleTransformChange}
                />
              )}
            </section>
          </div>
        </div>

        {/* Error Notification */}
        <ErrorNotification
          error={state.error}
          onDismiss={handleDismissError}
          onRetry={lastFailedOperationRef.current ? handleRetry : undefined}
        />
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={state.isProcessing}
        progress={state.processingProgress}
        message="Removing background..."
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="🤩 Konfirmasi"
        message="Kalau mau hapus background foto, akui dulu bowo ganteng! Klik oke untuk akui sekarang"
        confirmText="Akui 🙏"
        cancelText="Batal"
        onConfirm={() => {
          setShowConfirmDialog(false);
          processRemoveBackground();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}

// Wrap the main component with ErrorBoundary
export default function PhotoBackgroundEditor() {
  return (
    <ErrorBoundary>
      <PhotoBackgroundEditorContent />
    </ErrorBoundary>
  );
}
