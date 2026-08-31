"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import type { AdminBestsellerItem } from "@/lib/admin-bestsellers";
import type { AdminProductOption } from "@/lib/admin-products";

export function AdminBestsellersManager({
  initial,
  productOptions,
}: {
  initial: AdminBestsellerItem[];
  productOptions: AdminProductOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectedIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  );

  const query = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return [];
    return productOptions
      .filter((option) => !selectedIds.has(option.id))
      .filter(
        (option) =>
          option.name.toLowerCase().includes(query) ||
          option.slug.toLowerCase().includes(query),
      )
      .slice(0, 12);
  }, [productOptions, query, selectedIds]);

  async function addProduct(productId: string) {
    setLoadingId(productId);
    setError("");
    try {
      const res = await fetch("/api/admin/bestsellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }
      setItems((prev) => [...prev, data.item]);
      setSearch("");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(item: AdminBestsellerItem) {
    if (!confirm(`Убрать «${item.product.name}» из бестселлеров?`)) return;
    const res = await fetch(`/api/admin/bestsellers/${item.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Не удалось удалить");
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(nextIndex, 0, row);
    setItems(next);
    const res = await fetch("/api/admin/bestsellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
    if (!res.ok) {
      setItems(items);
      setError("Не удалось изменить порядок");
      return;
    }
    const data = await res.json();
    setItems(data.items);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="font-medium">Добавить товар</h2>
        <p className="mt-1 text-sm text-stone-500">
          Начните вводить название — появятся совпадения, как в поиске шапки.
        </p>

        <div className="relative mt-4">
          <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию…"
              autoComplete="off"
              className="search-input min-w-0 flex-1 border-0 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
            />
            <SearchIcon className="h-4 w-4 shrink-0 text-[#260402]" />
          </div>

          {query ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto border border-stone-200 bg-white shadow-lg">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-stone-500">
                  Ничего не найдено
                </p>
              ) : (
                <ul>
                  {results.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        disabled={loadingId === option.id}
                        onClick={() => void addProduct(option.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 disabled:opacity-50"
                      >
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-stone-50">
                          <Image
                            src={option.imageUrl || PLACEHOLDER_PRODUCT}
                            alt={option.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-[#260402]">
                            {option.name}
                          </span>
                          {!option.isActive ? (
                            <span className="mt-0.5 block text-xs text-stone-400">
                              Скрыт в каталоге
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">Пока ничего не выбрано.</p>
        ) : null}
        {items.map((item, index) => (
          <article
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-stone-200 bg-white p-4"
          >
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-stone-50">
              <Image
                src={item.product.images[0]?.url || PLACEHOLDER_PRODUCT}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#260402]">{item.product.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {item.product.isActive ? "В каталоге" : "Скрыт в каталоге"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void move(index, -1)}
                disabled={index === 0}
                className="cursor-pointer border border-stone-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void move(index, 1)}
                disabled={index === items.length - 1}
                className="cursor-pointer border border-stone-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(item)}
                className="cursor-pointer border border-stone-300 px-2 py-1 text-sm text-stone-500 hover:text-red-600"
              >
                Убрать
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
