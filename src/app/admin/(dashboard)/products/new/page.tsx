import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCollections } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const collections = await getCollections();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-stone-500 hover:text-stone-900">
        ← К списку товаров
      </Link>
      <h1 className="mt-4 text-2xl font-medium">Новый товар</h1>
      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6">
        <ProductForm
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          initial={{
            name: "",
            price: 0,
            comparePrice: null,
            sku: "",
            description: "",
            composition: "",
            care: "",
            style: "",
            country: "",
            material: "",
            isActive: true,
            collectionIds: [],
            imageUrls: [],
            variants: [],
          }}
        />
      </div>
    </div>
  );
}
