import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { getProductBySlug, getProducts } from "@/lib/data";
import { toCatalogItem } from "@/lib/product-display";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Товар" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const mainImage = product.images[0]?.url ?? PLACEHOLDER_PRODUCT;
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const collection = product.collections[0]?.collection;

  const composition = product.composition ?? "";
  const care = product.care ?? "";

  const relatedProducts = await getProducts({
    collectionSlug: collection?.slug,
    excludeSlug: slug,
    limit: 4,
  });

  const relatedItems =
    relatedProducts.length > 0
      ? relatedProducts.map(toCatalogItem)
      : (
          await getProducts({ excludeSlug: slug, limit: 4 })
        ).map(toCatalogItem);

  return (
    <SiteContainer className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          ...(collection
            ? [{ label: collection.name, href: `/catalog/${collection.slug}` }]
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
        />
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#260402]">
              Вам может понравиться
            </h2>
            <Link
              href="/catalog"
              className="text-xs uppercase tracking-widest text-stone-500 hover:text-[#260402]"
            >
              В каталог →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
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
