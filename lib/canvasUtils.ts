import { Canvas } from 'fabric';

/**
 * Export canvas to a downloadable file
 * Note: This function is no longer used - we download the blob directly from the API
 * @deprecated Use server-side API for background removal instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function exportCanvas(_canvas: Canvas, _format: 'png' | 'jpg' | 'webp'): void {
  // This function is deprecated and no longer used
  // Background removal processing is now done server-side with Python/rembg
  // Downloads use the blob returned from the API directly
  console.warn('exportCanvas is deprecated - use server-side API instead');
}

/**
 * Initialize canvas with proper dimensions
 * @param canvasElement - HTML canvas element
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Fabric Canvas instance
 */
export function initializeCanvas(
  canvasElement: HTMLCanvasElement,
  width: number,
  height: number
): Canvas {
  const canvas = new Canvas(canvasElement, {
    width,
    height,
    backgroundColor: '#ffffff',
  });
  
  return canvas;
}

/**
 * Clear canvas and reset to default state
 * @param canvas - Fabric canvas instance
 */
export function clearCanvas(canvas: Canvas): void {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
}

/**
 * Get optimal canvas dimensions based on image size
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param maxWidth - Maximum canvas width
 * @param maxHeight - Maximum canvas height
 * @returns Optimal dimensions
 */
export function getOptimalCanvasDimensions(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number = 1200,
  maxHeight: number = 800
): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight;
  
  let width = imageWidth;
  let height = imageHeight;
  
  // Scale down if image is larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Convert blob to HTMLImageElement
 * @param blob - Image blob
 * @returns Promise resolving to HTMLImageElement
 */
export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };
    
    img.src = url;
  });
}

/**
 * Convert file to HTMLImageElement
 * @param file - Image file
 * @returns Promise resolving to HTMLImageElement
 */
export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from file'));
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
