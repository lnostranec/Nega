"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminReviewView } from "@/lib/admin-reviews";

type Filter = "pending" | "published" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "На модерации" },
  { id: "published", label: "Опубликованные" },
  { id: "all", label: "Все" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-[#260402]" aria-label={`Оценка ${rating} из 5`}>
      {"★".repeat(rating)}
      <span className="text-stone-300">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export function AdminReviewsPanel({ initial }: { initial: AdminReviewView[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = reviews.filter((review) => !review.isActive).length;
  const publishedCount = reviews.filter((review) => review.isActive).length;

  const visible = reviews.filter((review) =>
    filter === "all"
      ? true
      : filter === "pending"
        ? !review.isActive
        : review.isActive,
  );

  async function updateActive(id: string, isActive: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Не удалось обновить отзыв");
        return;
      }
      setReviews((prev) =>
        prev.map((review) =>
          review.id === id ? { ...review, isActive } : review,
        ),
      );
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить отзыв навсегда?")) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Не удалось удалить отзыв");
        return;
      }
      setReviews((prev) => prev.filter((review) => review.id !== id));
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count =
            item.id === "pending"
              ? pendingCount
              : item.id === "published"
                ? publishedCount
                : reviews.length;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`border px-4 py-2 text-sm transition ${
                filter === item.id
                  ? "border-[#260402] bg-[#260402] text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="mt-8 border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          {filter === "pending"
            ? "Новых отзывов на модерации нет"
            : "Отзывов нет"}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((review) => (
            <li
              key={review.id}
              className="border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">
                    {review.authorName}
                    {review.verified && (
                      <span className="ml-2 bg-stone-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-stone-600">
                        Покупка подтверждена
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {review.authorEmail} ·{" "}
                    {new Date(review.createdAt).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars rating={review.rating} />
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      review.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {review.isActive ? "Опубликован" : "На модерации"}
                  </span>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {review.text}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {review.isActive ? (
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => updateActive(review.id, false)}
                    className="border border-stone-300 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                  >
                    Скрыть
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => updateActive(review.id, true)}
                    className="bg-[#260402] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Опубликовать
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === review.id}
                  onClick={() => remove(review.id)}
                  className="border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
