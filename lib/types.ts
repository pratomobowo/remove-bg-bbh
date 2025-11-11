import { Canvas } from 'fabric';

// Transform interface for image manipulation
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Error types
export enum ErrorType {
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  BROWSER_SUPPORT_ERROR = 'BROWSER_SUPPORT_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
}

// Editor state
export interface EditorState {
  // Source image
  sourceImage: HTMLImageElement | null;
  sourceFile: File | null;
  
  // Processed image (after background removal)
  processedImage: HTMLImageElement | null;
  processedBlob: Blob | null;
  
  // Background
  backgroundColor: string | null;
  backgroundImage: HTMLImageElement | null;
  
  // Transform
  transform: Transform;
  
  // UI State
  isProcessing: boolean;
  processingProgress: number;
  error: string | null;
  
  // Canvas
  canvasRef: Canvas | null;
}

// Editor actions
export type EditorAction =
  | { type: 'SET_SOURCE_IMAGE'; payload: { image: HTMLImageElement; file: File } }
  | { type: 'SET_PROCESSED_IMAGE'; payload: { image: HTMLImageElement; blob: Blob } }
  | { type: 'SET_BACKGROUND_COLOR'; payload: string }
  | { type: 'SET_BACKGROUND_IMAGE'; payload: HTMLImageElement }
  | { type: 'UPDATE_TRANSFORM'; payload: Partial<Transform> }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Component props interfaces

export interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  maxSizeInMB: number;
  acceptedFormats: string[];
}

export interface CanvasEditorProps {
  sourceImage: HTMLImageElement | null;
  processedImage: HTMLImageElement | null;
  backgroundColor: string | null;
  backgroundImage: HTMLImageElement | null;
  onTransformChange: (transform: Transform) => void;
}

export interface BackgroundSelectorProps {
  onColorSelect: (color: string) => void;
  onImageSelect: (file: File) => void;
  currentBackground: string | File | null;
}

export interface ToolBarProps {
  onRemoveBackground: () => void;
  onReset: () => void;
  onScaleChange: (scale: number) => void;
  isProcessing: boolean;
  hasProcessedImage: boolean;
  processingProgress?: number;
}

export interface DownloadButtonProps {
  blob: Blob | null;
  onDownload: (format: 'png' | 'jpg' | 'webp') => void;
  disabled: boolean;
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}
