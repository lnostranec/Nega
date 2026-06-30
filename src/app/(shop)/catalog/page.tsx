import { Suspense } from "react";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { CATALOG_SORT_OPTIONS, type CatalogSort } from "@/lib/catalog";
import { getCatalogPageData } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    collection?: string;
    q?: string;
    sort?: string;
    page?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    style?: string;
    country?: string;
    material?: string;
    pattern?: string;
  }>;
};

function parseSort(value?: string): CatalogSort {
  if (value && CATALOG_SORT_OPTIONS.some((o) => o.value === value)) {
    return value as CatalogSort;
  }
  return "default";
}

function parsePrice(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const collection = params.collection;
  const q = params.q;
  const sort = parseSort(params.sort);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const color = params.color;
  const minPrice = parsePrice(params.minPrice);
  const maxPrice = parsePrice(params.maxPrice);
  const inStock = params.inStock === "1";
  const style = params.style;
  const country = params.country;
  const material = params.material;
  const pattern = params.pattern;

  const data = await getCatalogPageData({
    collectionSlug: collection,
    search: q,
    sort,
    page,
    color,
    minPrice,
    maxPrice,
    inStock,
    style,
    country,
    material,
    pattern,
  });

  const start =
    data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1;
  const end = Math.min(data.page * data.perPage, data.total);

  const filterProps = {
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
    <SiteContainer className="py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Каталог" }]}
      />

      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="text-2xl font-medium uppercase tracking-[0.15em] text-[#260402] sm:text-3xl">
            Каталог
          </h1>
          <CatalogSidebar
            categories={data.categories}
            activeSlug={collection ?? ""}
            search={q}
            sort={sort !== "default" ? sort : undefined}
            {...filterProps}
          />
        </div>

        <div>
          <Suspense fallback={null}>
            <CatalogFilterBar
              facets={data.facets}
              currentSort={sort}
              currentColor={color}
              currentMinPrice={minPrice}
              currentMaxPrice={maxPrice}
              inStock={inStock}
              currentStyle={style}
              currentCountry={country}
              currentMaterial={material}
              currentPattern={pattern}
            />
          </Suspense>

          <p className="mt-4 border-b border-stone-200 pb-4 text-sm text-stone-600">
            {data.total > 0
              ? `Показано ${start}–${end} из ${data.total} ${
                  data.total === 1 ? "результата" : "результатов"
                }`
              : q
                ? "Ничего не найдено"
                : "Нет товаров в этой категории"}
          </p>

          {data.products.length > 0 ? (
            <>
              <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    variant="compact"
                    productId={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    comparePrice={product.comparePrice}
                    imageUrl={product.imageUrl}
                  />
                ))}
              </div>

              <CatalogPagination
                page={data.page}
                totalPages={data.totalPages}
                collection={collection}
                search={q}
                sort={sort !== "default" ? sort : undefined}
                {...filterProps}
              />
            </>
          ) : (
            <p className="mt-16 text-center text-stone-500">
              {q
                ? "По вашему запросу ничего не найдено. Попробуйте изменить фильтры."
                : "В этой категории пока нет товаров."}
            </p>
          )}
        </div>
      </div>
    </SiteContainer>
  );
}
