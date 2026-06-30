import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { getCollectionBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  let collection: Awaited<ReturnType<typeof getCollectionBySlug>> = null;

  try {
    collection = await getCollectionBySlug(slug);
  } catch {
    notFound();
  }

  if (!collection) notFound();

  const products = collection.products.map((pc) => pc.product);

  return (
    <SiteContainer className="py-10">
      <h1 className="font-serif text-4xl text-stone-900">{collection.name}</h1>
      {collection.description && (
        <p className="mt-2 text-stone-500">{collection.description}</p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            variant="compact"
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={Number(product.price)}
            comparePrice={
              product.comparePrice ? Number(product.comparePrice) : null
            }
            imageUrl={product.images[0]?.url}
          />
        ))}
      </div>
    </SiteContainer>
  );
}
