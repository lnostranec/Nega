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
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const visible = term
    ? products.filter((product) =>
        [product.name, product.sku ?? "", product.slug].some((value) =>
          value.toLowerCase().includes(term),
        ),
      )
    : products;

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
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, артикулу или slug"
            aria-label="Поиск товаров"
            className="w-full rounded border border-stone-300 px-3 py-2 pr-8 text-sm outline-none focus:border-stone-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer px-1 text-stone-400 transition hover:text-stone-700"
            >
              ×
            </button>
          )}
        </div>
        <span className="text-sm text-stone-500">
          {term
            ? `Найдено ${visible.length} из ${products.length}`
            : `Всего ${products.length}`}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
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
            {visible.map((product) => (
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  {term
                    ? `По запросу «${query.trim()}» ничего не найдено`
                    : "Нет товаров"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
