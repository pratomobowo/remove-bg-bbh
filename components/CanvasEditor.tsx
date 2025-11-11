'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, Image as FabricImage } from 'fabric';
import { CanvasEditorProps, Transform } from '@/lib/types';
import { composeImage, getDefaultTransform } from '@/lib/imageProcessing';

export default function CanvasEditor({
  sourceImage,
  processedImage,
  backgroundColor,
  backgroundImage,
  onTransformChange,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTransform, setCurrentTransform] = useState<Transform | null>(null);
  const hasInitializedTransform = useRef(false);
  const onTransformChangeRef = useRef(onTransformChange);

  // Keep ref in sync with the callback prop
  useEffect(() => {
    onTransformChangeRef.current = onTransformChange;
  }, [onTransformChange]);

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    // Calculate responsive canvas size
    const getCanvasSize = () => {
      const maxWidth = window.innerWidth < 640 ? window.innerWidth - 64 : 800;
      const maxHeight = window.innerWidth < 640 ? 400 : 600;
      return { width: Math.min(maxWidth, 800), height: Math.min(maxHeight, 600) };
    };

    const { width, height } = getCanvasSize();

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f3f4f6',
      selection: true,
    });

    fabricCanvasRef.current = canvas;
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Reset transform when image changes
  useEffect(() => {
    hasInitializedTransform.current = false;
    setCurrentTransform(null);
  }, [sourceImage, processedImage]);

  // Handle image rendering and composition
  useEffect(() => {
    if (!fabricCanvasRef.current || !isInitialized) return;

    const canvas = fabricCanvasRef.current;
    const imageToRender = processedImage || sourceImage;

    if (!imageToRender) {
      canvas.clear();
      canvas.backgroundColor = '#f3f4f6';
      canvas.renderAll();
      return;
    }

    // Determine background - priority: backgroundColor > backgroundImage > default white
    const background = backgroundColor
      ? { type: 'color' as const, value: backgroundColor }
      : backgroundImage
      ? { type: 'image' as const, value: backgroundImage }
      : { type: 'color' as const, value: '#ffffff' };

    // Use current transform or get default transform
    const transform = currentTransform || getDefaultTransform(
      imageToRender.width,
      imageToRender.height,
      canvas.width!,
      canvas.height!
    );

    // Compose image on canvas with background and transform
    composeImage(canvas, imageToRender, background, transform);

    // Store the transform if it's the first time (only once per image)
    if (!hasInitializedTransform.current) {
      hasInitializedTransform.current = true;
      setCurrentTransform(transform);
      onTransformChangeRef.current(transform);
    }

    // Optimize canvas rendering performance
    canvas.renderOnAddRemove = false; // Disable automatic rendering on add/remove
    canvas.skipOffscreen = true; // Skip rendering objects outside viewport

    // Setup event listeners for transform changes with debouncing for performance
    let rafId: number | null = null;
    
    const updateTransform = () => {
      // Use requestAnimationFrame to throttle updates for better performance
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject instanceof FabricImage) {
          const newTransform: Transform = {
            x: activeObject.left || 0,
            y: activeObject.top || 0,
            scale: activeObject.scaleX || 1,
            rotation: activeObject.angle || 0,
          };
          setCurrentTransform(newTransform);
          onTransformChangeRef.current(newTransform);
        }
        rafId = null;
      });
    };

    // Listen to all transform events for real-time preview updates
    canvas.on('object:modified', updateTransform);
    canvas.on('object:moving', updateTransform);
    canvas.on('object:scaling', updateTransform);
    canvas.on('object:rotating', updateTransform);

    return () => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      canvas.off('object:modified', updateTransform);
      canvas.off('object:moving', updateTransform);
      canvas.off('object:scaling', updateTransform);
      canvas.off('object:rotating', updateTransform);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sourceImage,
    processedImage,
    backgroundColor,
    backgroundImage,
    isInitialized,
  ]);

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3 sm:space-y-4">
      <div 
        className="relative border-2 border-gray-300 rounded-xl shadow-xl overflow-hidden bg-white ring-1 ring-gray-200 max-w-full focus-within:ring-4 focus-within:ring-blue-500 focus-within:border-blue-500"
        role="img"
        aria-label="Canvas editor for image manipulation"
      >
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto focus:outline-none" 
          tabIndex={0}
          aria-label="Interactive canvas - use arrow keys to move, plus/minus to scale"
          onKeyDown={(e) => {
            if (!fabricCanvasRef.current) return;
            const activeObject = fabricCanvasRef.current.getActiveObject();
            if (!activeObject) return;

            const step = e.shiftKey ? 10 : 1;
            let handled = false;

            switch (e.key) {
              case 'ArrowLeft':
                activeObject.set('left', (activeObject.left || 0) - step);
                handled = true;
                break;
              case 'ArrowRight':
                activeObject.set('left', (activeObject.left || 0) + step);
                handled = true;
                break;
              case 'ArrowUp':
                activeObject.set('top', (activeObject.top || 0) - step);
                handled = true;
                break;
              case 'ArrowDown':
                activeObject.set('top', (activeObject.top || 0) + step);
                handled = true;
                break;
              case '+':
              case '=':
                const newScaleUp = (activeObject.scaleX || 1) * 1.1;
                activeObject.scale(newScaleUp);
                handled = true;
                break;
              case '-':
              case '_':
                const newScaleDown = (activeObject.scaleX || 1) * 0.9;
                activeObject.scale(newScaleDown);
                handled = true;
                break;
            }

            if (handled) {
              e.preventDefault();
              activeObject.setCoords();
              fabricCanvasRef.current.renderAll();
              fabricCanvasRef.current.fire('object:modified', { target: activeObject });
            }
          }}
        />
        {/* Corner decoration - hidden on mobile */}
        <div className="hidden sm:block absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
        <div className="hidden sm:block absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
        <div className="hidden sm:block absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
      </div>
      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-full" role="status" aria-live="polite">
        <svg className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-medium text-gray-700 text-center">
          <span className="hidden sm:inline">Drag to move • Corners to resize • Handle to rotate • Arrow keys to nudge</span>
          <span className="sm:hidden">Drag • Resize • Rotate • Arrow keys</span>
        </p>
      </div>
    </div>
  );
}
