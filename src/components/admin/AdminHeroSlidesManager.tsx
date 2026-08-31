"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export type AdminHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
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

const fieldClass = "w-full border border-stone-300 px-3 py-2 text-sm";

export function AdminHeroSlidesManager({
  initial,
}: {
  initial: AdminHeroSlide[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState(initial);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [href, setHref] = useState("/catalog");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось загрузить файл");
        return null;
      }
      return data.url as string;
    } catch {
      setError("Не удалось загрузить файл");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, href, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }
      setSlides((prev) => [...prev, data.slide]);
      setTitle("");
      setSubtitle("");
      setHref("/catalog");
      setImageUrl("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveSlide(id: string, patch: Partial<AdminHeroSlide>) {
    setRowLoadingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }
      setSlides((prev) =>
        prev.map((slide) => (slide.id === id ? data.slide : slide)),
      );
      router.refresh();
    } finally {
      setRowLoadingId(null);
    }
  }

  async function handleDelete(slide: AdminHeroSlide) {
    if (!confirm(`Удалить слайд «${slide.title}»?`)) return;
    setRowLoadingId(slide.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Не удалось удалить");
        return;
      }
      setSlides((prev) => prev.filter((item) => item.id !== slide.id));
      router.refresh();
    } finally {
      setRowLoadingId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const next = [...slides];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setSlides(next);
    setError("");
    const res = await fetch("/api/admin/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((slide) => slide.id) }),
    });
    if (!res.ok) {
      setSlides(slides);
      setError("Не удалось изменить порядок");
      return;
    }
    const data = await res.json();
    setSlides(data.slides);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-stone-200 bg-white p-6"
      >
        <h2 className="font-medium">Новый слайд</h2>
        <p className="mt-1 text-sm text-stone-500">
          Лучше горизонтальное фото. Кнопка «Смотреть» ведёт по ссылке ниже.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
          <label className="relative block aspect-[16/9] cursor-pointer overflow-hidden border border-dashed border-stone-300 bg-stone-50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <span className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
                {uploading ? "Загрузка…" : "Нажмите, чтобы выбрать фото"}
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const url = await uploadFile(file);
                if (url) setImageUrl(url);
              }}
            />
          </label>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Заголовок</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Новая коллекция"
                required
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Подзаголовок</span>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Короткий текст под заголовком"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">
                Ссылка кнопки «Смотреть»
              </span>
              <input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/catalog"
                className={fieldClass}
              />
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-4" disabled={loading || uploading}>
          Добавить слайд
        </Button>
      </form>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className="rounded-lg border border-stone-200 bg-white p-4 sm:p-6"
          >
            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto]">
              <label className="relative block aspect-[16/9] cursor-pointer overflow-hidden bg-stone-50">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={rowLoadingId === slide.id || uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const url = await uploadFile(file);
                    if (url) await saveSlide(slide.id, { imageUrl: url });
                  }}
                />
              </label>

              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-stone-500">Заголовок</span>
                  <input
                    defaultValue={slide.title}
                    key={`${slide.id}-title-${slide.title}`}
                    className={fieldClass}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value && value !== slide.title) {
                        void saveSlide(slide.id, { title: value });
                      }
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-stone-500">Подзаголовок</span>
                  <input
                    defaultValue={slide.subtitle}
                    key={`${slide.id}-subtitle-${slide.subtitle}`}
                    className={fieldClass}
                    onBlur={(e) => {
                      if (e.target.value !== slide.subtitle) {
                        void saveSlide(slide.id, { subtitle: e.target.value });
                      }
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-stone-500">
                    Ссылка кнопки «Смотреть»
                  </span>
                  <input
                    defaultValue={slide.href}
                    key={`${slide.id}-href-${slide.href}`}
                    className={fieldClass}
                    onBlur={(e) => {
                      if (e.target.value !== slide.href) {
                        void saveSlide(slide.id, { href: e.target.value });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-row items-start gap-2 lg:flex-col">
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
                  disabled={index === slides.length - 1}
                  className="cursor-pointer border border-stone-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void saveSlide(slide.id, { isActive: !slide.isActive })
                  }
                  disabled={rowLoadingId === slide.id}
                  className="cursor-pointer border border-stone-300 px-2 py-1 text-xs disabled:cursor-not-allowed"
                >
                  {slide.isActive ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(slide)}
                  disabled={rowLoadingId === slide.id}
                  className="cursor-pointer border border-stone-300 p-1.5 text-stone-500 hover:text-red-600 disabled:cursor-not-allowed"
                  aria-label="Удалить"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
