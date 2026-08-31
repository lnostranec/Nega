"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { useSnapCarousel } from "@/hooks/useSnapCarousel";
import { BestsellerCard, type BestsellerProduct } from "./BestsellerCard";

type BestsellersCarouselProps = {
  products: BestsellerProduct[];
};

export function BestsellersCarousel({ products }: BestsellersCarouselProps) {
  const {
    viewportRef,
    trackRef,
    index,
    maxIndex,
    isDragging,
    itemWidth,
    goTo,
    handlers,
    trackStyle,
  } = useSnapCarousel({ itemCount: products.length });

  if (products.length === 0) {
    return (
      <section className="bg-white py-16">
        <h2 className="text-center text-base font-semibold uppercase tracking-[0.25em] text-[#260402]">
          Наши бестселлеры
        </h2>
        <p className="mt-8 text-center text-sm text-stone-500">
          Товары появятся после подключения базы данных
        </p>
      </section>
    );
  }

  const dotsCount = maxIndex + 1;

  return (
    <section className="bg-white py-12 md:py-16">
      <h2 className="text-center text-base font-semibold uppercase tracking-[0.25em] text-[#260402]">
        Наши бестселлеры
      </h2>

      <SiteContainer className="relative mt-10">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Назад"
          className="absolute -left-1 top-[40%] z-10 hidden -translate-y-1/2 cursor-pointer text-stone-400 transition hover:text-[#260402] disabled:cursor-not-allowed disabled:opacity-30 sm:block lg:left-0"
        >
          <ChevronLeftIcon className="h-8 w-8" />
        </button>

        <div
          ref={viewportRef}
          {...handlers}
          className={`snap-carousel overflow-hidden pb-4 ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          <div ref={trackRef} className="flex" style={trackStyle}>
            {products.map((product) => (
              <div
                key={product.slug}
                className="shrink-0"
                style={{ width: itemWidth > 0 ? itemWidth : undefined }}
              >
                <BestsellerCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= maxIndex}
          aria-label="Вперёд"
          className="absolute -right-1 top-[40%] z-10 hidden -translate-y-1/2 cursor-pointer text-stone-400 transition hover:text-[#260402] disabled:cursor-not-allowed disabled:opacity-30 sm:block lg:right-0"
        >
          <ChevronRightIcon className="h-8 w-8" />
        </button>
      </SiteContainer>

      {dotsCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: dotsCount }).map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Страница ${dotIndex + 1}`}
              onClick={() => goTo(dotIndex)}
              className={`h-2 w-2 cursor-pointer rounded-full transition ${
                dotIndex === index ? "bg-[#260402]" : "bg-stone-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
