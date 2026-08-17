"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CATALOG_FOR_YOU_LABEL,
  CATALOG_SORT_OPTIONS,
} from "@/lib/catalog";
import type { CatalogFacets } from "@/lib/catalog-facets";
import { countActiveCatalogFilters } from "@/lib/catalog-facets";
import { formatPrice } from "@/lib/format";
import { FilterChip } from "./FilterChip";
import { PriceRangeSlider } from "./PriceRangeSlider";

type CatalogFilterBarProps = {
  facets: CatalogFacets;
  currentSort: string;
  currentColor?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  inStock?: boolean;
  currentStyle?: string;
  currentMaterial?: string;
  currentPattern?: string;
  currentSize?: string;
};

type OpenPanel =
  | "forYou"
  | "color"
  | "price"
  | "material"
  | "style"
  | "pattern"
  | null;

export function CatalogFilterBar({
  facets,
  currentSort,
  currentColor,
  currentMinPrice,
  currentMaxPrice,
  inStock,
  currentStyle,
  currentMaterial,
  currentPattern,
  currentSize,
}: CatalogFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const priceMin = facets.priceMin;
  const priceMax = facets.priceMax;
  const sliderMin = currentMinPrice ?? priceMin;
  const sliderMax = currentMaxPrice ?? priceMax;

  const activeCount = useMemo(
    () =>
      countActiveCatalogFilters({
        sort: currentSort,
        color: currentColor,
        inStock,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        style: currentStyle,
        material: currentMaterial,
        pattern: currentPattern,
        size: currentSize,
      }),
    [
      currentSort,
      currentColor,
      inStock,
      currentMinPrice,
      currentMaxPrice,
      currentStyle,
      currentMaterial,
      currentPattern,
      currentSize,
    ],
  );

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/catalog?${query}` : "/catalog");
  }

  function setParam(key: string, value: string | null) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setOpenPanel(null);
  }

  function toggleInStock() {
    pushParams((params) => {
      if (params.get("inStock") === "1") params.delete("inStock");
      else params.set("inStock", "1");
    });
  }

  function clearAll() {
    pushParams((params) => {
      params.delete("sort");
      params.delete("color");
      params.delete("minPrice");
      params.delete("maxPrice");
      params.delete("inStock");
      params.delete("style");
      params.delete("country");
      params.delete("material");
      params.delete("pattern");
      params.delete("size");
    });
    setOpenPanel(null);
  }

  function priceLabel() {
    if (currentMinPrice !== undefined || currentMaxPrice !== undefined) {
      const from = currentMinPrice ?? priceMin;
      const to = currentMaxPrice ?? priceMax;
      return `Цена: ${formatPrice(from)} – ${formatPrice(to)}`;
    }
    return "Цена";
  }

  const sortLabel =
    CATALOG_SORT_OPTIONS.find((o) => o.value === currentSort)?.label ??
    CATALOG_SORT_OPTIONS[0].label;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentSize ? (
          <button
            type="button"
            onClick={() => setParam("size", null)}
            className="inline-flex items-center rounded-md border border-[#260402] bg-[#260402] px-4 py-2.5 text-sm text-white"
          >
            Размер: {currentSize}
            <span className="ml-2 text-white/70">×</span>
          </button>
        ) : null}
        <FilterChip
          label={
            currentSort !== "default"
              ? `${CATALOG_FOR_YOU_LABEL}: ${sortLabel}`
              : CATALOG_FOR_YOU_LABEL
          }
          active={currentSort !== "default"}
          open={openPanel === "forYou"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "forYou" ? null : "forYou"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <ul className="space-y-1">
            {CATALOG_SORT_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    pushParams((params) => {
                      if (option.value === "default") params.delete("sort");
                      else params.set("sort", option.value);
                    });
                    setOpenPanel(null);
                  }}
                  className={`block w-full rounded px-2 py-2 text-left text-sm transition hover:bg-stone-50 ${
                    currentSort === option.value
                      ? "font-medium text-[#260402]"
                      : "text-stone-700"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </FilterChip>

        <FilterChip
          label={currentColor ? `Цвет: ${currentColor}` : "Цвет"}
          active={Boolean(currentColor)}
          open={openPanel === "color"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "color" ? null : "color"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => setParam("color", null)}
                className="block w-full rounded px-2 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                Все цвета
              </button>
            </li>
            {facets.colors.map((color) => (
              <li key={color}>
                <button
                  type="button"
                  onClick={() => setParam("color", color)}
                  className={`block w-full rounded px-2 py-2 text-left text-sm hover:bg-stone-50 ${
                    currentColor === color
                      ? "font-medium text-[#260402]"
                      : "text-stone-700"
                  }`}
                >
                  {color}
                </button>
              </li>
            ))}
          </ul>
        </FilterChip>

        <button
          type="button"
          onClick={toggleInStock}
          className={`inline-flex items-center rounded-md border px-4 py-2.5 text-sm transition ${
            inStock
              ? "border-[#260402] bg-[#260402] text-white"
              : "border-stone-300 bg-white text-stone-800 hover:border-stone-400"
          }`}
        >
          В наличии
        </button>

        <FilterChip
          label={priceLabel()}
          active={
            currentMinPrice !== undefined || currentMaxPrice !== undefined
          }
          open={openPanel === "price"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "price" ? null : "price"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            valueMin={sliderMin}
            valueMax={sliderMax}
            onChange={(minValue, maxValue) => {
              pushParams((params) => {
                if (minValue <= priceMin) params.delete("minPrice");
                else params.set("minPrice", String(minValue));
                if (maxValue >= priceMax) params.delete("maxPrice");
                else params.set("maxPrice", String(maxValue));
              });
            }}
          />
          <button
            type="button"
            onClick={() => {
              pushParams((params) => {
                params.delete("minPrice");
                params.delete("maxPrice");
              });
              setOpenPanel(null);
            }}
            className="mt-2 text-xs text-stone-500 underline hover:text-[#260402]"
          >
            Сбросить цену
          </button>
        </FilterChip>

        <FilterChip
          label={currentMaterial ? `Материал: ${currentMaterial}` : "Материал"}
          active={Boolean(currentMaterial)}
          open={openPanel === "material"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "material" ? null : "material"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <OptionList
            options={facets.materials}
            current={currentMaterial}
            onSelect={(value) => setParam("material", value)}
            allLabel="Все материалы"
          />
        </FilterChip>

        <FilterChip
          label={currentStyle ? `Коллекция: ${currentStyle}` : "Коллекция"}
          active={Boolean(currentStyle)}
          open={openPanel === "style"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "style" ? null : "style"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <OptionList
            options={facets.styles}
            current={currentStyle}
            onSelect={(value) => setParam("style", value)}
            allLabel="Все коллекции"
          />
        </FilterChip>

        <FilterChip
          label={currentPattern ? `Принт: ${currentPattern}` : "Принт"}
          active={Boolean(currentPattern)}
          open={openPanel === "pattern"}
          onToggle={() =>
            setOpenPanel((panel) => (panel === "pattern" ? null : "pattern"))
          }
          onClose={() => setOpenPanel(null)}
        >
          <OptionList
            options={facets.patterns}
            current={currentPattern}
            onSelect={(value) => setParam("pattern", value)}
            allLabel="Все принты"
          />
        </FilterChip>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs uppercase tracking-widest text-stone-500 underline hover:text-[#260402]"
        >
          Сбросить все фильтры ({activeCount})
        </button>
      )}
    </div>
  );
}

function OptionList({
  options,
  current,
  onSelect,
  allLabel,
}: {
  options: string[];
  current?: string;
  onSelect: (value: string | null) => void;
  allLabel: string;
}) {
  return (
    <ul className="max-h-56 space-y-1 overflow-y-auto">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="block w-full rounded px-2 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
        >
          {allLabel}
        </button>
      </li>
      {options.map((option) => (
        <li key={option}>
          <button
            type="button"
            onClick={() => onSelect(option)}
            className={`block w-full rounded px-2 py-2 text-left text-sm hover:bg-stone-50 ${
              current === option
                ? "font-medium text-[#260402]"
                : "text-stone-700"
            }`}
          >
            {option}
          </button>
        </li>
      ))}
    </ul>
  );
}
