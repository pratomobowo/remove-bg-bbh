/**
 * ONNX Runtime Configuration
 * The @imgly/background-removal library handles ONNX Runtime internally.
 * This module is kept for compatibility but ONNX Runtime configuration
 * is now delegated to the background-removal library.
 */

/**
 * Initialize app (no-op since @imgly/background-removal handles ONNX Runtime)
 * Kept for API compatibility
 */
export async function initializeOnnxRuntime(): Promise<void> {
  // @imgly/background-removal handles ONNX Runtime initialization
  // We don't need to do anything here
  console.log('App ready - background removal will initialize ONNX Runtime on first use');
}
