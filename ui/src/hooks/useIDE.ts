/**
 * useResizablePanel Hook
 * Handles draggable panel resizing with constraints
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelProps {
  initialSize: number;
  minSize: number;
  maxSize: number;
  onResize?: (size: number) => void;
}

export function useResizablePanel({
  initialSize,
  minSize,
  maxSize,
  onResize,
}: UseResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newSize = e.clientX - rect.left;
      const constrainedSize = Math.max(minSize, Math.min(maxSize, newSize));

      setSize(constrainedSize);
      onResize?.(constrainedSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minSize, maxSize, onResize]);

  return {
    size,
    setSize,
    isDragging,
    containerRef,
    handleMouseDown,
  };
}

/**
 * useZoomControl Hook
 * Manages zoom level for ladder workspace
 */

interface UseZoomControlProps {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

export function useZoomControl({
  initialZoom = 1,
  minZoom = 0.25,
  maxZoom = 3,
  step = 0.1,
}: UseZoomControlProps = {}) {
  const [zoom, setZoom] = useState(initialZoom);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + step, maxZoom));
  }, [maxZoom, step]);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - step, minZoom));
  }, [minZoom, step]);

  const resetZoom = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  const fitToScreen = useCallback(() => {
    setZoom(1);
  }, []);

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
  };
}

/**
 * usePanControl Hook
 * Manages pan/scroll for ladder workspace
 */

interface UsePanControlProps {
  onPan?: (x: number, y: number) => void;
}

export function usePanControl({ onPan }: UsePanControlProps = {}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on middle mouse button
    if (e.button !== 1) return;
    
    setIsPanning(true);
    setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    setPan({ x: newX, y: newY });
    onPan?.(newX, newY);
  }, [isPanning, startPos, onPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const reset = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    pan,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    reset,
  };
}

/**
 * useDebugState Hook
 * Tracks IDE state for debugging
 */

export function useIDEState() {
  const [state, setState] = useState({
    isProcessing: false,
    currentStep: '',
    processedCount: 0,
  });

  const setProcessing = useCallback((isProcessing: boolean, step?: string) => {
    setState(prev => ({
      ...prev,
      isProcessing,
      currentStep: step || prev.currentStep,
    }));
  }, []);

  return { state, setProcessing };
}
