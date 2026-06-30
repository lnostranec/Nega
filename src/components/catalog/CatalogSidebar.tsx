import Link from "next/link";
import { buildCatalogUrl } from "@/lib/catalog";

type CatalogSidebarProps = {
  categories: { name: string; slug: string }[];
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
};

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
}: CatalogSidebarProps) {
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
  };

  return (
    <nav aria-label="Категории каталога">
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
        Категории
      </h2>
      <ul className="mt-5 space-y-1">
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
    </nav>
  );
}
