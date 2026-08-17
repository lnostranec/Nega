"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/components/account/AuthModalProvider";
import { Button } from "@/components/ui/Button";
import type { ReviewView } from "@/lib/reviews";

function StarIcon({ filled, className = "h-5 w-5" }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`${className} ${filled ? "fill-[#260402] text-[#260402]" : "fill-none text-stone-300"}`}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

function Stars({
  value,
  onChange,
  interactive = false,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
  size?: "sm" | "md";
}) {
  const starClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="flex items-center gap-1" role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (!interactive || !onChange) {
          return <StarIcon key={star} filled={filled} className={starClass} />;
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} из 5`}
            onClick={() => onChange(star)}
            className="transition hover:opacity-80"
          >
            <StarIcon filled={filled} className={starClass} />
          </button>
        );
      })}
    </div>
  );
}

type ReviewsContentProps = {
  initialReviews: ReviewView[];
};

export function ReviewsContent({ initialReviews }: ReviewsContentProps) {
  const { user, loading, openLogin } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Войдите в систему, чтобы оставить отзыв");
      openLogin();
      return;
    }

    if (!text.trim()) {
      setError("Текст отзыва не должен быть пустым");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить отзыв");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      setText("");
      setRating(5);
      setSuccess("Спасибо! Ваш отзыв опубликован.");
    } catch {
      setError("Не удалось сохранить отзыв");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-stone-500">Средняя оценка</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-medium text-[#260402]">
              {reviews.length > 0 ? average.toFixed(1) : "—"}
            </p>
            <Stars value={Math.round(average)} size="sm" />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {reviews.length === 0
              ? "Пока нет отзывов"
              : `${reviews.length} ${
                  reviews.length === 1 ? "отзыв" : reviews.length < 5 ? "отзыва" : "отзывов"
                }`}
          </p>
        </div>
      </div>

      <section id="leave-review" className="scroll-mt-28">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
          Оставить отзыв
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500">Загрузка...</p>
        ) : !user ? (
          <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Войдите в систему, чтобы оставить отзыв.{" "}
            <button type="button" onClick={openLogin} className="underline underline-offset-2">
              Войти
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 max-w-xl space-y-4">
            <div>
              <p className="mb-2 text-sm text-stone-600">Оценка</p>
              <Stars value={rating} onChange={setRating} interactive />
            </div>
            <div>
              <label htmlFor="review-text" className="text-sm text-stone-600">
                Ваш отзыв
              </label>
              <textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Расскажите о покупке, качестве и сервисе"
                className="mt-1 w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Отправка..." : "Опубликовать отзыв"}
            </Button>
          </form>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
          Отзывы покупателей
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Станьте первым — оставьте отзыв о Nega.</p>
        ) : (
          <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
            {reviews.map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#260402]">{review.authorName}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Stars value={review.rating} size="sm" />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                  {review.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
