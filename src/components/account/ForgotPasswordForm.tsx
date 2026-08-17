"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить письмо");
        return;
      }
      setDone(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-serif text-3xl text-[#260402]">Проверьте почту</h1>
        <p className="mt-4 text-sm text-stone-600">
          Если аккаунт с таким email существует, мы отправили ссылку для сброса
          пароля.
        </p>
        <Link href="/account" className="mt-8 inline-block text-sm underline">
          Вернуться
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="font-serif text-3xl text-[#260402]">Сброс пароля</h1>
      <p className="mt-3 text-sm text-stone-600">
        Укажите email аккаунта — пришлём ссылку для нового пароля.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Отправляем…" : "Отправить ссылку"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/account" className="underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
