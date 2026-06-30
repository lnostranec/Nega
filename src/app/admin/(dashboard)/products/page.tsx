import Link from "next/link";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { listAdminProducts } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  const items = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: Number(product.price),
    stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    isActive: product.isActive,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Товары</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-stone-900 px-4 py-2 text-sm text-white transition hover:bg-stone-800"
        >
          + Добавить товар
        </Link>
      </div>

      <p className="mt-2 text-sm text-stone-500">
        Отключённые товары не показываются в каталоге на сайте
      </p>

      <AdminProductsTable products={items} />
    </div>
  );
}
