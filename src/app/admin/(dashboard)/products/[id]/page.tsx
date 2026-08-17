import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import {
  getAdminProduct,
  listAdminProductOptions,
} from "@/lib/admin-products";
import { getCollections } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, collections, productOptions] = await Promise.all([
    getAdminProduct(id),
    getCollections(),
    listAdminProductOptions(id),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-stone-500 hover:text-stone-900">
        ← К списку товаров
      </Link>
      <h1 className="mt-4 text-2xl font-medium">Редактирование: {product.name}</h1>
      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6">
        <ProductForm
          productId={product.id}
          collections={collections.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          productOptions={productOptions}
          initial={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            composition: product.composition ?? "",
            care: product.care ?? "",
            style: product.style ?? "",
            country: product.country ?? "",
            material: product.material ?? "",
            price: Number(product.price),
            comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
            sku: product.sku ?? "",
            isActive: product.isActive,
            collectionIds: product.collections.map((pc) => pc.collectionId),
            imageUrls: product.images.map((img) => img.url),
            variants: product.variants.map((v) => ({
              size: v.size,
              color: v.color,
              stock: v.stock,
              sku: v.sku,
              part: v.part,
            })),
            bottomModels: product.bottomModels.map((m) => ({
              name: m.name,
              isActive: m.isActive,
              sortOrder: m.sortOrder,
            })),
            setAddons: product.setAddons.map((a) => ({
              name: a.name,
              price: Number(a.price),
              imageUrl: a.imageUrl,
              note: a.note,
              isActive: a.isActive,
              sortOrder: a.sortOrder,
            })),
            relatedProductIds: product.relatedProducts.map(
              (r) => r.relatedProductId,
            ),
          }}
        />
      </div>
    </div>
  );
}
