import Link from "next/link";
import { buildCatalogUrl } from "@/lib/catalog";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  collection?: string;
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

function pageRange(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export function CatalogPagination({
  page,
  totalPages,
  collection,
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
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageRange(page, totalPages);
  const urlParams = {
    collection,
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

  return (
    <nav aria-label="Пагинация каталога" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={buildCatalogUrl({ ...urlParams, page: page - 1 })}
          className="px-3 py-2 text-sm text-stone-600 transition hover:text-[#260402]"
        >
          ←
        </Link>
      )}

      {pages.map((pageNumber, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev && pageNumber - prev > 1;

        return (
          <span key={pageNumber} className="flex items-center gap-2">
            {showEllipsis && <span className="px-1 text-stone-400">…</span>}
            <Link
              href={buildCatalogUrl({
                ...urlParams,
                page: pageNumber,
              })}
              className={`min-w-10 px-3 py-2 text-center text-sm transition ${
                pageNumber === page
                  ? "bg-[#260402] text-white"
                  : "text-stone-600 hover:text-[#260402]"
              }`}
            >
              {pageNumber}
            </Link>
          </span>
        );
      })}

      {page < totalPages && (
        <Link
          href={buildCatalogUrl({ ...urlParams, page: page + 1 })}
          className="px-3 py-2 text-sm text-stone-600 transition hover:text-[#260402]"
        >
          →
        </Link>
      )}
    </nav>
  );
}
