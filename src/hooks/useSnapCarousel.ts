"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePointerDrag } from "./usePointerDrag";

function getVisibleCount(width: number) {
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

function getGap(width: number) {
  return width >= 640 ? 24 : 16;
}

type UseSnapCarouselOptions = {
  itemCount: number;
  threshold?: number;
};

export function useSnapCarousel({ itemCount, threshold = 50 }: UseSnapCarouselOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const indexRef = useRef(0);
  const maxIndexRef = useRef(0);
  const stepRef = useRef(0);
  const suppressClick = useRef(false);

  const visibleCount = getVisibleCount(viewportWidth);
  const gap = getGap(viewportWidth);
  const itemWidth =
    viewportWidth > 0
      ? (viewportWidth - gap * (visibleCount - 1)) / visibleCount
      : 0;
  const step = itemWidth + gap;
  const maxIndex = Math.max(0, itemCount - visibleCount);
  const safeIndex = Math.min(index, maxIndex);

  useEffect(() => {
    indexRef.current = safeIndex;
  }, [safeIndex]);

  useEffect(() => {
    maxIndexRef.current = maxIndex;
  }, [maxIndex]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(next, maxIndex)));
    },
    [maxIndex],
  );

  const applyTrackTransform = useCallback(
    (translate: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = animate
        ? "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      track.style.transform = `translate3d(${translate}px, 0, 0)`;
    },
    [],
  );

  const getResistance = useCallback((dx: number) => {
    const currentIndex = indexRef.current;
    const max = maxIndexRef.current;
    if ((currentIndex <= 0 && dx > 0) || (currentIndex >= max && dx < 0)) {
      return 0.35;
    }
    return 1;
  }, []);

  const { onPointerDown } = usePointerDrag({
    dragThreshold: 8,
    onDragStart: () => {
      suppressClick.current = false;
      setIsDragging(true);
    },
    onDragMove: (dx) => {
      const stepSize = stepRef.current;
      if (stepSize === 0) return;
      applyTrackTransform(
        -indexRef.current * stepSize + dx * getResistance(dx),
        false,
      );
    },
    onDragEnd: (dx, _dy, moved) => {
      setIsDragging(false);
      const stepSize = stepRef.current;
      const currentIndex = indexRef.current;
      const max = maxIndexRef.current;

      if (!moved || stepSize === 0) return;

      suppressClick.current = true;

      let nextIndex = currentIndex;
      if (dx < -threshold) nextIndex = Math.min(currentIndex + 1, max);
      else if (dx > threshold) nextIndex = Math.max(currentIndex - 1, 0);

      if (nextIndex !== currentIndex) {
        goTo(nextIndex);
      } else {
        applyTrackTransform(-currentIndex * stepSize, true);
      }
    },
  });

  useEffect(() => {
    if (isDragging || step === 0) return;
    applyTrackTransform(-safeIndex * step, true);
  }, [safeIndex, step, isDragging, applyTrackTransform]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  }, []);

  const onDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return {
    viewportRef,
    trackRef,
    index: safeIndex,
    maxIndex,
    isDragging,
    itemWidth,
    gap,
    goTo,
    handlers: {
      onPointerDown,
      onClickCapture,
      onDragStart,
    },
    trackStyle: {
      gap: `${gap}px`,
    } as React.CSSProperties,
  };
}
