"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function AdminCategoriesManager({
  initial,
}: {
  initial: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }
      setCategories((prev) => [...prev, data.collection]);
      setName("");
      setSlug("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(category: Category) {
    setRowLoadingId(category.id);
    try {
      const res = await fetch(`/api/admin/collections/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, ...data.collection } : c)),
        );
        router.refresh();
      }
    } finally {
      setRowLoadingId(null);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Удалить категорию «${category.name}»?`)) return;

    setRowLoadingId(category.id);
    try {
      const res = await fetch(`/api/admin/collections/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Не удалось удалить");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      router.refresh();
    } finally {
      setRowLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-stone-200 bg-white p-6"
      >
        <h2 className="font-medium">Новая категория</h2>
        <p className="mt-1 text-sm text-stone-500">
          Появится в фильтре слева на странице каталога
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название, например: Боди"
            required
            className="border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (латиница, необязательно)"
            className="border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-4" disabled={loading}>
          Добавить категорию
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-stone-200 bg-white p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{category.name}</h3>
              <button
                type="button"
                onClick={() => handleDelete(category)}
                disabled={rowLoadingId === category.id}
                aria-label={`Удалить ${category.name}`}
                className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <TrashIcon />
              </button>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              /catalog?collection={category.slug}
            </p>
            {category.description && (
              <p className="mt-2 text-sm text-stone-600">{category.description}</p>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => toggleActive(category)}
                disabled={rowLoadingId === category.id}
                className={`cursor-pointer rounded px-2 py-1 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  category.isActive
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                {category.isActive ? "Активна" : "Отключена"}
              </button>
              <p className="mt-2 text-xs text-stone-400">
                {category.isActive
                  ? "Видна в каталоге"
                  : "Скрыта из фильтра каталога"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
