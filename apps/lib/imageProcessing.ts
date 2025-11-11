import { Canvas, Image as FabricImage } from 'fabric';
import { Transform } from './types';

/**
 * Compose image on canvas with background and transform
 * @param canvas - Fabric canvas instance
 * @param foreground - Foreground image (processed image with removed background)
 * @param background - Background configuration (color or image)
 * @param transform - Transform settings for foreground
 */
export function composeImage(
  canvas: Canvas,
  foreground: HTMLImageElement,
  background: { type: 'color' | 'image'; value: string | HTMLImageElement },
  transform: Transform
): void {
  // Clear canvas
  canvas.clear();
  
  // Set background
  if (background.type === 'color') {
    canvas.backgroundColor = background.value as string;
  } else {
    const bgImg = background.value as HTMLImageElement;
    const bgImage = new FabricImage(bgImg, {
      scaleX: canvas.width! / bgImg.width,
      scaleY: canvas.height! / bgImg.height,
      selectable: false,
      evented: false,
    });
    canvas.backgroundImage = bgImage;
  }
  
  // Add foreground with transform
  const fgImage = new FabricImage(foreground, {
    left: transform.x,
    top: transform.y,
    scaleX: transform.scale,
    scaleY: transform.scale,
    angle: transform.rotation,
    selectable: true,
    hasControls: true,
  });
  
  canvas.add(fgImage);
  canvas.centerObject(fgImage);
  canvas.renderAll();
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in MB
 * @param acceptedFormats - Array of accepted MIME types
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeInMB: number,
  acceptedFormats: string[]
): { valid: boolean; error?: string } {
  // Check file type
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`,
    };
  }
  
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit`,
    };
  }
  
  return { valid: true };
}

/**
 * Resize image if it exceeds maximum dimensions
 * @param image - HTMLImageElement to resize
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Promise resolving to resized image blob
 */
export function resizeImage(
  image: HTMLImageElement,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    let { width, height } = image;
    
    // Calculate new dimensions while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw resized image
    ctx.drawImage(image, 0, 0, width, height);
    
    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      0.9
    );
  });
}

/**
 * Check if image needs resizing
 * @param image - HTMLImageElement to check
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns True if image needs resizing
 */
export function needsResize(
  image: HTMLImageElement,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): boolean {
  return image.width > maxWidth || image.height > maxHeight;
}

/**
 * Get default transform for an image
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @returns Default transform
 */
export function getDefaultTransform(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): Transform {
  // Calculate scale to fit image in canvas while maintaining aspect ratio
  const scaleX = canvasWidth / imageWidth;
  const scaleY = canvasHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    scale,
    rotation: 0,
  };
}

/**
 * Create a thumbnail from an image
 * @param image - HTMLImageElement
 * @param maxSize - Maximum thumbnail size
 * @returns Data URL of thumbnail
 */
export function createThumbnail(
  image: HTMLImageElement,
  maxSize: number = 200
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  const aspectRatio = image.width / image.height;
  let width = maxSize;
  let height = maxSize;
  
  if (aspectRatio > 1) {
    height = maxSize / aspectRatio;
  } else {
    width = maxSize * aspectRatio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}
