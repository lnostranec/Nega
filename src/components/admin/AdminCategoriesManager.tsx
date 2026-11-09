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

function PencilIcon() {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

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

const inputClass = "w-full border border-stone-300 px-3 py-2 text-sm";

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

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

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function saveEdit(category: Category) {
    const nextName = editName.trim();
    if (!nextName) {
      setError("Название не может быть пустым");
      return;
    }

    setRowLoadingId(category.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/collections/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          slug: editSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, ...data.collection } : c)),
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setRowLoadingId(null);
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
        <Button type="submit" className="mt-4" disabled={loading}>
          Добавить категорию
        </Button>
      </form>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-stone-200 bg-white p-6"
          >
            {editingId === category.id ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Название"
                  aria-label="Название категории"
                  className={inputClass}
                  autoFocus
                />
                <input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="slug (латиница)"
                  aria-label="Slug категории"
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit(category)}
                    disabled={rowLoadingId === category.id}
                    className="cursor-pointer rounded bg-stone-900 px-3 py-1.5 text-xs text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="cursor-pointer rounded border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{category.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      disabled={rowLoadingId === category.id || editingId !== null}
                      aria-label={`Редактировать ${category.name}`}
                      className="cursor-pointer rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={rowLoadingId === category.id || editingId !== null}
                      aria-label={`Удалить ${category.name}`}
                      className="cursor-pointer rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  /catalog?collection={category.slug}
                </p>
                {category.description && (
                  <p className="mt-2 text-sm text-stone-600">
                    {category.description}
                  </p>
                )}
              </>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => toggleActive(category)}
                disabled={rowLoadingId === category.id || editingId === category.id}
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
