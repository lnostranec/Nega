import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { getProductBySlug, getRelatedProductsForProduct } from "@/lib/data";
import { toCatalogItem } from "@/lib/product-display";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { buildCatalogUrl, CATALOG_CATEGORIES } from "@/lib/catalog";
import { isSetsCollectionSlug } from "@/lib/product-sets";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ collection?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Товар" };
}

function resolveBreadcrumbCollection(
  productCollections: { collection: { name: string; slug: string } }[],
  fromCollectionSlug?: string,
) {
  if (fromCollectionSlug) {
    const matched = productCollections.find(
      (pc) => pc.collection.slug === fromCollectionSlug,
    );
    if (matched) return matched.collection;

    const catalogCategory = CATALOG_CATEGORIES.find(
      (c) => c.slug === fromCollectionSlug,
    );
    if (catalogCategory?.slug) {
      return { name: catalogCategory.name, slug: catalogCategory.slug };
    }
  }
  return productCollections[0]?.collection ?? null;
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { collection: fromCollection } = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const mainImage = product.images[0]?.url ?? PLACEHOLDER_PRODUCT;
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const collection = resolveBreadcrumbCollection(
    product.collections,
    fromCollection,
  );
  const isSet = product.collections.some((pc) =>
    isSetsCollectionSlug(pc.collection.slug),
  );

  const composition = product.composition ?? "";
  const care = product.care ?? "";

  const relatedProducts = await getRelatedProductsForProduct(product.id, {
    excludeSlug: slug,
    limit: 4,
    fallbackCollectionSlug: collection?.slug,
  });
  const relatedItems = relatedProducts.map(toCatalogItem);

  return (
    <SiteContainer className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          ...(collection
            ? [
                {
                  label: collection.name,
                  href: buildCatalogUrl({ collection: collection.slug }),
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,518px)_1fr] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,576px)_1fr]">
        <ProductGallery
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || product.name,
          }))}
          productName={product.name}
        />

        <ProductInfo
          productId={product.id}
          slug={product.slug}
          name={product.name}
          price={price}
          comparePrice={comparePrice}
          sku={product.sku ?? ""}
          description={product.description ?? ""}
          composition={
            composition ||
            "Состав будет указан после загрузки карточки в админке."
          }
          care={care || "Рекомендации по уходу будут добавлены позже."}
          style={product.style}
          country={product.country}
          material={product.material}
          imageUrl={mainImage}
          variants={product.variants}
          isSet={isSet}
          bottomModels={
            "bottomModels" in product
              ? product.bottomModels.map((m) => ({ id: m.id, name: m.name }))
              : []
          }
          setAddons={
            "setAddons" in product
              ? product.setAddons.map((a) => ({
                  id: a.id,
                  name: a.name,
                  price: Number(a.price),
                  imageUrl: a.imageUrl,
                  note: a.note,
                }))
              : []
          }
        />
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-12">
          <div className="flex flex-nowrap items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#260402] sm:text-sm sm:tracking-[0.25em]">
              Вам может понравиться
            </h2>
            <Link
              href="/catalog"
              className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-widest text-stone-500 hover:text-[#260402] sm:text-xs"
            >
              В каталог →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6">
            {relatedItems.map((item) => (
              <ProductCard
                key={item.id}
                productId={item.id}
                slug={item.slug}
                name={item.name}
                price={item.price}
                comparePrice={item.comparePrice}
                imageUrl={item.imageUrl}
              />
            ))}
          </div>
        </section>
      )}
    </SiteContainer>
  );
}
