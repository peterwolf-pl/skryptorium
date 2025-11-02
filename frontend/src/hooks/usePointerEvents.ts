import { useCallback, useEffect, useRef, useState } from 'react';

type UniversalPointerEvent = PointerEvent | MouseEvent | TouchEvent;

export interface PointerHandlers {
  onStart?: (event: UniversalPointerEvent) => void;
  onMove?: (event: UniversalPointerEvent) => void;
  onEnd?: (event: UniversalPointerEvent) => void;
}

export interface UsePointerEventsResult<T extends HTMLElement> {
  ref: (node: T | null) => void;
  isActive: boolean;
}

export function usePointerEvents<T extends HTMLElement>(
  handlers: PointerHandlers = {}
): UsePointerEventsResult<T> {
  const targetRef = useRef<T | null>(null);
  const handlersRef = useRef(handlers);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const attachRef = useCallback((node: T | null) => {
    targetRef.current = node;
  }, []);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === 'undefined') {
      return;
    }

    const latestHandlers = () => handlersRef.current;
    const supportsPointerEvents = window.PointerEvent !== undefined;

    if (supportsPointerEvents) {
      let pointerId: number | null = null;

      const handlePointerDown = (event: PointerEvent) => {
        pointerId = event.pointerId;
        setIsActive(true);
        latestHandlers().onStart?.(event);
        if (node.setPointerCapture) {
          try {
            node.setPointerCapture(event.pointerId);
          } catch (error) {
            // ignore inability to capture pointer, e.g. non-primary button
          }
        }
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (pointerId !== null && event.pointerId === pointerId) {
          latestHandlers().onMove?.(event);
        }
      };

      const endInteraction = (event: PointerEvent) => {
        if (pointerId !== null && event.pointerId === pointerId) {
          latestHandlers().onEnd?.(event);
          setIsActive(false);
          pointerId = null;
          if (node.hasPointerCapture?.(event.pointerId)) {
            node.releasePointerCapture(event.pointerId);
          }
        }
      };

      node.addEventListener('pointerdown', handlePointerDown);
      node.addEventListener('pointermove', handlePointerMove);
      node.addEventListener('pointerup', endInteraction);
      node.addEventListener('pointercancel', endInteraction);

      return () => {
        node.removeEventListener('pointerdown', handlePointerDown);
        node.removeEventListener('pointermove', handlePointerMove);
        node.removeEventListener('pointerup', endInteraction);
        node.removeEventListener('pointercancel', endInteraction);
      };
    }

    let isPointerActive = false;

    const handleMouseDown = (event: MouseEvent) => {
      isPointerActive = true;
      setIsActive(true);
      latestHandlers().onStart?.(event);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerActive) {
        return;
      }
      latestHandlers().onMove?.(event);
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isPointerActive) {
        return;
      }
      isPointerActive = false;
      setIsActive(false);
      latestHandlers().onEnd?.(event);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (event: TouchEvent) => {
      isPointerActive = true;
      setIsActive(true);
      latestHandlers().onStart?.(event);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isPointerActive) {
        return;
      }
      latestHandlers().onMove?.(event);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isPointerActive) {
        return;
      }
      isPointerActive = false;
      setIsActive(false);
      latestHandlers().onEnd?.(event);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };

    node.addEventListener('mousedown', handleMouseDown);
    node.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      node.removeEventListener('mousedown', handleMouseDown);
      node.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return { ref: attachRef, isActive };
}
