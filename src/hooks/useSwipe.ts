"use client";

import { useCallback, useRef } from "react";

type SwipeOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
};

export function useSwipe<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeOptions) {
  const ref = useRef<T>(null);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    if (e.button !== 0) return;
    startX.current = e.clientX;
    moved.current = false;
    ref.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    if (startX.current === null) return;
    if (Math.abs(e.clientX - startX.current) > 10) {
      moved.current = true;
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<T>) => {
      if (startX.current === null) return;

      const diff = e.clientX - startX.current;
      if (diff > threshold) {
        onSwipeRight();
      } else if (diff < -threshold) {
        onSwipeLeft();
      }

      startX.current = null;
      if (ref.current?.hasPointerCapture(e.pointerId)) {
        ref.current.releasePointerCapture(e.pointerId);
      }
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }, []);

  return {
    ref,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  };
}
