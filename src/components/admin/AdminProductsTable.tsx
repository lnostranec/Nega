"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
};

type AdminProductsTableProps = {
  products: AdminProductListItem[];
};

export function AdminProductsTable({ products: initial }: AdminProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleActive(product: AdminProductListItem) {
    const nextActive = !product.isActive;
    setLoadingId(product.id);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (!response.ok) return;

      const data = await response.json();
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, isActive: data.product.isActive }
            : item,
        ),
      );
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50">
          <tr>
            <th className="px-4 py-3 font-medium">Название</th>
            <th className="px-4 py-3 font-medium">Артикул</th>
            <th className="px-4 py-3 font-medium">Цена</th>
            <th className="px-4 py-3 font-medium">Остаток</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-stone-100">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-stone-500">{product.sku || "—"}</td>
              <td className="px-4 py-3">{formatPrice(product.price)}</td>
              <td className="px-4 py-3">{product.stock}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleActive(product)}
                  disabled={loadingId === product.id}
                  className={`cursor-pointer rounded px-2 py-1 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
                    product.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {product.isActive ? "Активен" : "Отключён"}
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                Нет товаров
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
