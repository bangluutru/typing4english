import { useState, useCallback, useRef, useEffect } from 'react';

export interface KeyRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export type KeyboardGeometry = Record<string, KeyRect>;

export const useKeyboardGeometry = (stageRef: React.RefObject<HTMLDivElement | null>) => {
  const [geometry, setGeometry] = useState<KeyboardGeometry>({});
  const keysRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Callback ref register function for each key
  const registerKey = useCallback((key: string) => (el: HTMLElement | null) => {
    const cleanKey = key.toLowerCase();
    if (el) {
      keysRefs.current.set(cleanKey, el);
    } else {
      keysRefs.current.delete(cleanKey);
    }
  }, []);

  const measureGeometry = useCallback(() => {
    if (!stageRef.current) return;
    
    const stageRect = stageRef.current.getBoundingClientRect();
    const newGeometry: KeyboardGeometry = {};

    keysRefs.current.forEach((el, key) => {
      const keyRect = el.getBoundingClientRect();
      const x = keyRect.left - stageRect.left;
      const y = keyRect.top - stageRect.top;
      
      newGeometry[key] = {
        key,
        x,
        y,
        width: keyRect.width,
        height: keyRect.height,
        centerX: x + keyRect.width / 2,
        centerY: y + keyRect.height / 2,
      };
    });

    setGeometry(newGeometry);
  }, [stageRef]);

  // Handle ResizeObserver to measure instantly when container scaling changes
  useEffect(() => {
    const stageElement = stageRef.current;
    if (!stageElement) return;

    // Trigger initial calculation
    const handleInitial = () => {
      measureGeometry();
    };
    
    // Call next tick to ensure DOM is painted
    const frameId = requestAnimationFrame(handleInitial);

    const resizeObserver = new ResizeObserver(() => {
      measureGeometry();
    });

    resizeObserver.observe(stageElement);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [stageRef, measureGeometry]);

  return {
    geometry,
    registerKey,
    measureGeometry,
  };
};
export default useKeyboardGeometry;
