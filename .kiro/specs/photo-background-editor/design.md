# Design Document - Photo Background Editor

## Overview

Photo Background Editor adalah aplikasi Next.js yang menggunakan App Router dengan client-side image processing. Aplikasi ini memanfaatkan `@imgly/background-removal` untuk ML-based background removal dan HTML Canvas API untuk image manipulation. Arsitektur dirancang untuk memberikan pengalaman yang cepat dengan processing di client-side, menghindari upload ke server untuk privacy dan performance.

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Background Removal**: @imgly/background-removal
- **Image Manipulation**: HTML Canvas API + fabric.js
- **File Upload**: react-dropzone
- **State Management**: React hooks (useState, useReducer)
- **UI Components**: shadcn/ui (optional, untuk consistent UI)

### Application Structure

```
app/
├── page.tsx                    # Main editor page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
components/
├── ImageUploader.tsx           # Drag & drop upload component
├── CanvasEditor.tsx            # Main canvas for image editing
├── BackgroundSelector.tsx      # Background color/image picker
├── ToolBar.tsx                 # Edit controls (resize, position)
├── DownloadButton.tsx          # Export functionality
└── LoadingOverlay.tsx          # Processing indicator
lib/
├── backgroundRemoval.ts        # Background removal logic
├── imageProcessing.ts          # Image manipulation utilities
├── canvasUtils.ts              # Canvas helper functions
└── types.ts                    # TypeScript types
public/
└── backgrounds/                # Sample background images (optional)
```

## Components and Interfaces

### 1. ImageUploader Component

**Purpose**: Handle file upload dengan drag-and-drop dan validasi

**Props**:
```typescript
interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  maxSizeInMB: number;
  acceptedFormats: string[];
}
```

**Behavior**:
- Menggunakan react-dropzone untuk drag & drop
- Validasi format (JPG, PNG, WEBP) dan ukuran (max 10MB)
- Preview thumbnail setelah upload
- Error handling untuk invalid files

### 2. CanvasEditor Component

**Purpose**: Main canvas untuk display dan manipulasi gambar

**Props**:
```typescript
interface CanvasEditorProps {
  sourceImage: HTMLImageElement | null;
  processedImage: HTMLImageElement | null;
  backgroundColor: string | null;
  backgroundImage: HTMLImageElement | null;
  onTransformChange: (transform: Transform) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

**Behavior**:
- Menggunakan fabric.js untuk canvas manipulation
- Support drag untuk reposition
- Support pinch/scroll untuk zoom
- Real-time preview saat adjustment
- Export canvas ke berbagai format

### 3. BackgroundSelector Component

**Purpose**: UI untuk memilih background replacement

**Props**:
```typescript
interface BackgroundSelectorProps {
  onColorSelect: (color: string) => void;
  onImageSelect: (file: File) => void;
  currentBackground: string | File | null;
}
```

**Behavior**:
- Color picker untuk solid colors
- Upload button untuk custom background image
- Preview grid dengan preset backgrounds
- Clear button untuk transparent background

### 4. ToolBar Component

**Purpose**: Controls untuk editing operations

**Props**:
```typescript
interface ToolBarProps {
  onRemoveBackground: () => void;
  onReset: () => void;
  onScaleChange: (scale: number) => void;
  isProcessing: boolean;
  hasProcessedImage: boolean;
}
```

**Behavior**:
- "Remove Background" button
- Scale slider (50% - 200%)
- Reset button
- Disabled state saat processing

### 5. DownloadButton Component

**Purpose**: Export hasil editing

**Props**:
```typescript
interface DownloadButtonProps {
  canvas: fabric.Canvas | null;
  onDownload: (format: 'png' | 'jpg' | 'webp') => void;
  disabled: boolean;
}
```

**Behavior**:
- Dropdown untuk pilih format
- Generate filename dengan timestamp
- Trigger browser download
- Handle quality settings per format

## Data Models

### EditorState

```typescript
interface EditorState {
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
  canvasRef: fabric.Canvas | null;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

### Actions

```typescript
type EditorAction =
  | { type: 'SET_SOURCE_IMAGE'; payload: { image: HTMLImageElement; file: File } }
  | { type: 'SET_PROCESSED_IMAGE'; payload: { image: HTMLImageElement; blob: Blob } }
  | { type: 'SET_BACKGROUND_COLOR'; payload: string }
  | { type: 'SET_BACKGROUND_IMAGE'; payload: HTMLImageElement }
  | { type: 'UPDATE_TRANSFORM'; payload: Partial<Transform> }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };
```

## Core Logic Flow

### Background Removal Process

```typescript
// lib/backgroundRemoval.ts

import { removeBackground } from '@imgly/background-removal';

export async function processBackgroundRemoval(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    const blob = await removeBackground(imageFile, {
      progress: (key, current, total) => {
        const progress = (current / total) * 100;
        onProgress?.(progress);
      },
      model: 'medium', // Balance between speed and quality
      output: {
        format: 'image/png',
        quality: 0.9,
      },
    });
    
    return blob;
  } catch (error) {
    throw new Error('Background removal failed: ' + error.message);
  }
}
```

### Canvas Composition

```typescript
// lib/imageProcessing.ts

export function composeImage(
  canvas: fabric.Canvas,
  foreground: HTMLImageElement,
  background: { type: 'color' | 'image'; value: string | HTMLImageElement },
  transform: Transform
): void {
  // Clear canvas
  canvas.clear();
  
  // Set background
  if (background.type === 'color') {
    canvas.setBackgroundColor(background.value as string, canvas.renderAll.bind(canvas));
  } else {
    const bgImage = new fabric.Image(background.value as HTMLImageElement, {
      scaleX: canvas.width! / (background.value as HTMLImageElement).width,
      scaleY: canvas.height! / (background.value as HTMLImageElement).height,
    });
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
  }
  
  // Add foreground with transform
  const fgImage = new fabric.Image(foreground, {
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
```

### Export Functionality

```typescript
// lib/canvasUtils.ts

export function exportCanvas(
  canvas: fabric.Canvas,
  format: 'png' | 'jpg' | 'webp',
  quality: number = 0.9
): void {
  const mimeType = `image/${format}`;
  const dataURL = canvas.toDataURL({
    format: format,
    quality: quality,
    multiplier: 1, // Use actual canvas size
  });
  
  // Convert to blob and download
  fetch(dataURL)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-photo-${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    });
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  BROWSER_SUPPORT_ERROR = 'BROWSER_SUPPORT_ERROR',
}

interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
}
```

### Error Handling Strategy

1. **Upload Errors**:
   - File size validation sebelum processing
   - Format validation dengan MIME type check
   - User-friendly error messages

2. **Processing Errors**:
   - Try-catch wrapper untuk background removal
   - Retry mechanism (max 2 attempts)
   - Fallback ke manual selection jika ML gagal

3. **Browser Compatibility**:
   - Check WebGL support untuk ML model
   - Check Canvas API support
   - Graceful degradation message

4. **Memory Management**:
   - Cleanup blob URLs setelah digunakan
   - Revoke object URLs untuk prevent memory leaks
   - Limit max image size untuk prevent browser crash

## Testing Strategy

### Unit Tests

- `backgroundRemoval.ts`: Mock @imgly/background-removal, test error handling
- `imageProcessing.ts`: Test canvas composition logic
- `canvasUtils.ts`: Test export functionality dengan different formats

### Integration Tests

- Upload flow: File selection → Validation → Preview
- Processing flow: Remove background → Progress tracking → Result display
- Export flow: Format selection → Download trigger

### E2E Tests (Optional)

- Complete user journey: Upload → Remove BG → Replace BG → Download
- Error scenarios: Invalid file, processing failure, browser incompatibility

### Performance Tests

- Measure background removal time untuk different image sizes
- Monitor memory usage during processing
- Test canvas rendering performance

## Performance Optimizations

1. **Model Caching**: ML model di-cache setelah first load
2. **Image Optimization**: Resize large images sebelum processing (max 2048px)
3. **Lazy Loading**: Load fabric.js hanya saat dibutuhkan
4. **Web Workers**: Offload heavy processing ke worker thread (future enhancement)
5. **Progressive Enhancement**: Show low-res preview saat processing

## Security Considerations

1. **Client-Side Processing**: Semua processing di browser, no server upload
2. **File Validation**: Strict validation untuk prevent malicious files
3. **CSP Headers**: Content Security Policy untuk prevent XSS
4. **CORS**: Proper CORS handling untuk external background images

## Accessibility

1. **Keyboard Navigation**: Semua controls accessible via keyboard
2. **Screen Reader**: Proper ARIA labels untuk semua interactive elements
3. **Focus Management**: Clear focus indicators
4. **Alt Text**: Descriptive alt text untuk images
5. **Color Contrast**: WCAG AA compliant color contrast
