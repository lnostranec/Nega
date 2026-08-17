"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/account/AuthModalProvider";

export function LeaveReviewButton({
  className = "btn-site btn-site-filled mt-3 inline-block w-full bg-brand px-6 py-3.5 text-center text-sm font-medium text-white",
}: {
  className?: string;
}) {
  const router = useRouter();
  const { user, loading, openLogin } = useAuth();
  const [hint, setHint] = useState(false);

  function handleClick() {
    if (loading) return;
    if (!user) {
      setHint(true);
      openLogin();
      return;
    }
    setHint(false);
    router.push("/reviews#leave-review");
  }

  return (
    <div>
      <button type="button" onClick={handleClick} className={className}>
        Оставить отзыв
      </button>
      {hint && !user && (
        <p className="mt-2 text-center text-xs text-amber-800">
          Войдите в систему, чтобы оставить отзыв
        </p>
      )}
    </div>
  );
}
