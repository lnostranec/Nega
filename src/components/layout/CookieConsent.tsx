"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CookieIcon } from "@/components/icons";
import { COOKIE_CONSENT_KEY } from "@/lib/constants";

function subscribeConsent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getConsentSnapshot() {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

function getServerConsentSnapshot() {
  return true;
}

export function CookieConsent() {
  const accepted = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    window.dispatchEvent(new Event("storage"));
  }

  if (accepted) return null;

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      aria-describedby="cookie-consent-text"
      className="fixed bottom-4 left-4 z-50 w-[min(100%-2rem,22rem)] border border-stone-200 bg-white p-5 shadow-lg sm:w-96"
    >
      <div className="flex gap-3">
        <CookieIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#260402]" />
        <p id="cookie-consent-text" className="text-sm leading-relaxed text-stone-600">
          Мы используем cookie для работы сайта и аналитики. Продолжая, вы
          соглашаетесь с{" "}
          <Link href="/cookies" className="text-[#260402] underline underline-offset-2 transition hover:opacity-70">
            политикой cookie
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={accept}
        className="btn-site btn-site-filled mt-4 w-full bg-brand py-2.5 text-xs font-medium uppercase tracking-widest text-white"
      >
        Принять
      </button>
    </div>
  );
}
