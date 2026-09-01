"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

export function AccountPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, passwordConfirm }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось сменить пароль");
        return;
      }

      setPassword("");
      setPasswordConfirm("");
      setSuccess(true);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-stone-500">
            Новый пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-stone-500">
            Повторите пароль
          </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-xs text-stone-500">Минимум 8 символов</p>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Пароль изменён
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохраняем..." : "Сменить пароль"}
      </Button>
    </form>
  );
}
