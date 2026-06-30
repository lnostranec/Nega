"use client";

import { useCallback, useRef } from "react";

type PointerDragHandlers = {
  onDragStart?: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: (dx: number, dy: number, moved: boolean) => void;
  dragThreshold?: number;
};

export function usePointerDrag(handlers: PointerDragHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const dragStart = useRef({ x: 0, y: 0, moved: false });
  const isActiveRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;

    dragStart.current = { x: e.clientX, y: e.clientY, moved: false };
    isActiveRef.current = true;
    handlersRef.current.onDragStart?.();

    const threshold = handlersRef.current.dragThreshold ?? 8;

    const handleMove = (ev: PointerEvent) => {
      if (!isActiveRef.current) return;

      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;

      if (
        !dragStart.current.moved &&
        (Math.abs(dx) > threshold || Math.abs(dy) > threshold)
      ) {
        dragStart.current.moved = true;
      }

      if (!dragStart.current.moved) return;

      ev.preventDefault();
      handlersRef.current.onDragMove(dx, dy);
    };

    const handleEnd = (ev: PointerEvent) => {
      if (!isActiveRef.current) return;

      isActiveRef.current = false;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      const moved = dragStart.current.moved;
      dragStart.current.moved = false;

      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleEnd);
      document.removeEventListener("pointercancel", handleEnd);

      handlersRef.current.onDragEnd(dx, dy, moved);
    };

    document.addEventListener("pointermove", handleMove, { passive: false });
    document.addEventListener("pointerup", handleEnd);
    document.addEventListener("pointercancel", handleEnd);
  }, []);

  return {
    onPointerDown,
    isActiveRef,
    dragStart,
  };
}
