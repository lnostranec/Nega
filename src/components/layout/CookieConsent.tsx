"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CookieIcon } from "@/components/icons";
import { COOKIE_CONSENT_KEY } from "@/lib/constants";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted") {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      aria-describedby="cookie-consent-text"
      className="fixed bottom-4 left-4 z-50 w-[min(100%-2rem,22rem)] border border-stone-200 bg-white p-5 shadow-lg sm:w-96"
    >
      <CookieIcon className="mx-auto h-10 w-10 text-[#260402]" />

      <p id="cookie-consent-text" className="mt-4 text-sm leading-relaxed text-stone-600">
        Продолжая использовать этот сайт и нажимая кнопку «Принимаю», вы даете{" "}
        <Link
          href="/cookies"
          className="text-[#260402] underline underline-offset-2 transition hover:opacity-70"
        >
          согласие на обработку файлов cookie
        </Link>{" "}
        и использование Яндекс.Метрики.
      </p>

      <button
        type="button"
        onClick={accept}
        className="btn-site btn-site-filled mt-5 w-full bg-brand px-4 py-3 text-sm font-medium text-white"
      >
        Принимаю
      </button>
    </div>
  );
}
