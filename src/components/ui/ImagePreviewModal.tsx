"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useIsClient } from "@/hooks/useIsClient";

type ImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  ariaLabel?: string;
  frameClassName?: string;
  imageClassName?: string;
  imageSizes?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
};

export function ImagePreviewModal({
  open,
  onClose,
  src,
  alt,
  ariaLabel,
  frameClassName = "bg-white",
  imageClassName = "object-contain p-6",
  imageSizes = "(max-width: 640px) 98vw, 840px",
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: ImagePreviewModalProps) {
  const mounted = useIsClient();
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const showNavigation = Boolean(onPrevious && onNext);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (event.key === "ArrowLeft" && onPrevious && canGoPrevious) {
        event.preventDefault();
        onPrevious();
        return;
      }

      if (event.key === "ArrowRight" && onNext && canGoNext) {
        event.preventDefault();
        onNext();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onPrevious, onNext, canGoPrevious, canGoNext]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, 300);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null || !showNavigation) return;

    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) return;

    const delta = touchEndX - touchStartX.current;
    if (delta > 50 && canGoPrevious) onPrevious?.();
    if (delta < -50 && canGoNext) onNext?.();
    touchStartX.current = null;
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? alt}
        className={`inline-flex flex-col items-end transition-all duration-300 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Закрыть"
          className="mb-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-stone-500 shadow-md transition hover:text-[#260402]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {showNavigation ? (
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label="Предыдущее фото"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-stone-600 shadow-md transition hover:text-[#260402] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          ) : null}

          <div
            className={`relative h-[min(81vh,686px)] overflow-hidden border border-stone-200 sm:h-[min(86vh,713px)] ${
              showNavigation
                ? "w-[min(calc(100vw-5rem),810px)] sm:w-[min(calc(100vw-8rem),840px)]"
                : "w-[min(calc(100vw-2rem),810px)] sm:w-[840px]"
            } ${frameClassName}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              key={src}
              src={src}
              alt={alt}
              fill
              className={`${imageClassName} transition-opacity duration-300`}
              sizes={imageSizes}
            />
          </div>

          {showNavigation ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-label="Следующее фото"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-stone-600 shadow-md transition hover:text-[#260402] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
