"use client";

import { FormEvent, useState } from "react";
import type { PublicUser } from "@/lib/auth-types";
import { sanitizePhoneInput } from "@/lib/validation";
import { useAuth } from "./AuthModalProvider";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

type AccountProfileFormProps = {
  user: PublicUser;
};

export function AccountProfileForm({ user }: AccountProfileFormProps) {
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить профиль");
        return;
      }

      await refreshUser();
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
            Имя
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-stone-500">
            Фамилия
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-widest text-stone-500">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className={`${inputClass} bg-stone-50 text-stone-500`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-widest text-stone-500">
            Телефон
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            required
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Профиль сохранён
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохраняем..." : "Сохранить изменения"}
      </Button>
    </form>
  );
}
