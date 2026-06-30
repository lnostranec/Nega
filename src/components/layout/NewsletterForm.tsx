"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    alert("Подписка будет подключена позже");
    setEmail("");
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#260402]">Получить скидку 1000 ₽</h3>
      <p className="mt-2 text-sm text-stone-500">
        Оставьте ваш email, а мы пришлём промокод на скидку.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-[#260402]"
        />
        <button
          type="submit"
          disabled={!agreed}
          className="btn-site btn-site-filled w-full bg-brand py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Получить промокод
        </button>
        <label className="flex items-start gap-2 text-xs text-stone-500">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 accent-brand"
          />
          <span>
            Вы принимаете условия «Политики конфиденциальности» и соглашаетесь на
            рассылку
          </span>
        </label>
      </form>
    </div>
  );
}
