"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { usePointerDrag } from "@/hooks/usePointerDrag";
import { HERO_SLIDES } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/SiteContainer";

export function HeroSlider() {
  const total = HERO_SLIDES.length;
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const suppressClick = useRef(false);

  const snapThreshold = 50;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(index, total - 1)));
    },
    [total],
  );

  const next = useCallback(
    () => goTo(currentRef.current + 1 >= total ? 0 : currentRef.current + 1),
    [goTo, total],
  );
  const prev = useCallback(
    () => goTo(currentRef.current - 1 < 0 ? total - 1 : currentRef.current - 1),
    [goTo, total],
  );

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    viewportWidthRef.current = viewportWidth;
  }, [viewportWidth]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const applyTrackTransform = useCallback(
    (translate: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = animate
        ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      track.style.transform = `translate3d(${translate}px, 0, 0)`;
    },
    [],
  );

  useEffect(() => {
    if (isDragging || viewportWidth === 0) return;
    applyTrackTransform(-current * viewportWidth, true);
  }, [current, viewportWidth, isDragging, applyTrackTransform]);

  const getResistance = useCallback((dx: number) => {
    const slideIndex = currentRef.current;
    if (
      (slideIndex === 0 && dx > 0) ||
      (slideIndex === total - 1 && dx < 0)
    ) {
      return 0.35;
    }
    return 1;
  }, [total]);

  const { onPointerDown, dragStart } = usePointerDrag({
    dragThreshold: 8,
    onDragStart: () => {
      suppressClick.current = false;
      setIsDragging(true);
    },
    onDragMove: (dx) => {
      const width = viewportWidthRef.current;
      if (width === 0) return;
      applyTrackTransform(
        -currentRef.current * width + dx * getResistance(dx),
        false,
      );
    },
    onDragEnd: (dx, _dy, moved) => {
      setIsDragging(false);
      const width = viewportWidthRef.current;

      if (!moved || width === 0) return;

      suppressClick.current = true;

      if (dx < -snapThreshold) next();
      else if (dx > snapThreshold) prev();
      else applyTrackTransform(-currentRef.current * width, true);
    },
  });

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
      dragStart.current.moved = false;
    }
  }, [dragStart]);

  return (
    <section className="relative bg-white">
      <SiteContainer>
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className={`snap-carousel relative aspect-[16/7] w-full min-h-[450px] max-h-[730px] overflow-hidden sm:aspect-[21/9] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div
            ref={trackRef}
            className="flex h-full"
            style={{
              width: viewportWidth > 0 ? viewportWidth * total : "100%",
            }}
          >
            {HERO_SLIDES.map((s) => (
              <div
                key={s.id}
                className="relative h-full shrink-0"
                style={{ width: viewportWidth > 0 ? viewportWidth : "100%" }}
              >
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="pointer-events-none object-cover"
                  priority={s.id === HERO_SLIDES[0].id}
                  sizes="(max-width: 1800px) 100vw, 1800px"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/20" />

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
                  <h2 className="text-3xl font-semibold uppercase tracking-[0.2em] sm:text-4xl md:text-5xl">
                    {s.title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm font-light tracking-wide sm:text-base">
                    {s.subtitle}
                  </p>
                  <Link
                    href={s.href}
                    className="pointer-events-auto mt-8 border border-white px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] transition duration-300 hover:border-brand hover:bg-brand hover:text-white"
                  >
                    Смотреть
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Предыдущий слайд"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:left-6"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Следующий слайд"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-2 text-white/80 transition hover:text-white sm:right-6"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        </div>

        <div className="flex justify-center gap-2 py-4">
          {HERO_SLIDES.map((s, index) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Слайд ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === current ? "bg-[#260402]" : "bg-stone-300"
              }`}
            />
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
