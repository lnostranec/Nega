"use client";

import { useCallback, useRef, useState } from "react";

type DragScrollOptions = {
  onScrollEnd?: () => void;
  threshold?: number;
};

export function useDragScroll<T extends HTMLElement>(options?: DragScrollOptions) {
  const ref = useRef<T>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const threshold = options?.threshold ?? 8;
  const onScrollEndRef = useRef(options?.onScrollEnd);
  onScrollEndRef.current = options?.onScrollEnd;

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el || e.button !== 0) return;

    dragState.current = {
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    suppressClickRef.current = false;
    isDraggingRef.current = true;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!isDraggingRef.current || !el) return;

      const dx = e.clientX - dragState.current.startX;
      if (Math.abs(dx) > threshold) {
        dragState.current.moved = true;
        suppressClickRef.current = true;
        e.preventDefault();
      }

      el.scrollLeft = dragState.current.scrollLeft - dx;
    },
    [threshold],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el || !isDraggingRef.current) return;

    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    onScrollEndRef.current?.();
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      dragState.current.moved = false;
    }
  }, []);

  return {
    ref,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  };
}
