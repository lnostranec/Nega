"use client";

import Link from "next/link";
import { useState } from "react";
import { buildCatalogUrl } from "@/lib/catalog";
import { ChevronDownIcon } from "@/components/icons";

type Category = { name: string; slug: string };

type CatalogSidebarProps = {
  categories: Category[];
  activeSlug?: string;
  search?: string;
  sort?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  style?: string;
  country?: string;
  material?: string;
  pattern?: string;
  size?: string;
};

function CategoryList({
  categories,
  activeSlug,
  urlParams,
  onNavigate,
  className = "",
}: {
  categories: Category[];
  activeSlug: string;
  urlParams: Record<string, string | number | boolean | undefined>;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={className}>
      {categories.map((category) => {
        const isActive = (activeSlug || "") === category.slug;
        return (
          <li key={category.slug || "all"}>
            <Link
              href={buildCatalogUrl({
                collection: category.slug || undefined,
                page: 1,
                ...urlParams,
              })}
              onClick={onNavigate}
              className={`block py-2 text-sm transition ${
                isActive
                  ? "font-medium text-[#260402]"
                  : "text-stone-600 hover:text-[#260402]"
              }`}
            >
              {category.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CatalogSidebar({
  categories,
  activeSlug = "",
  search,
  sort,
  color,
  minPrice,
  maxPrice,
  inStock,
  style,
  country,
  material,
  pattern,
  size,
}: CatalogSidebarProps) {
  const [open, setOpen] = useState(false);

  const urlParams = {
    q: search,
    sort,
    color,
    minPrice,
    maxPrice,
    inStock,
    style,
    country,
    material,
    pattern,
    size,
  };

  const activeName =
    categories.find((c) => c.slug === (activeSlug || ""))?.name ?? "Все товары";

  return (
    <nav aria-label="Категории каталога" className="mt-6 lg:mt-8">
      {/* Мобилка: аккордеон */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between border-b border-stone-200 py-3 text-left"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
            {activeName}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-[#260402] transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        {open ? (
          <CategoryList
            categories={categories}
            activeSlug={activeSlug}
            urlParams={urlParams}
            onNavigate={() => setOpen(false)}
            className="mt-3 space-y-1"
          />
        ) : null}
      </div>

      {/* ПК: всегда открыто */}
      <div className="hidden lg:block">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
          Категории
        </h2>
        <CategoryList
          categories={categories}
          activeSlug={activeSlug}
          urlParams={urlParams}
          className="mt-5 space-y-1"
        />
      </div>
    </nav>
  );
}
