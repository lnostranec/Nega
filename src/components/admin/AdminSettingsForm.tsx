"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Settings = {
  shopName: string;
  pointsPercent: number;
  minOrderForPoints: number;
};

export function AdminSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage("Сохранено");
        router.refresh();
      } else {
        setMessage("Ошибка сохранения");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-6 rounded-lg border border-stone-200 bg-white p-6"
    >
      <div>
        <label className="text-sm text-stone-600">Название магазина</label>
        <input
          value={form.shopName}
          onChange={(e) => setForm({ ...form, shopName: e.target.value })}
          className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-stone-600">Процент начисления баллов</label>
        <input
          type="number"
          min={0}
          max={100}
          value={form.pointsPercent}
          onChange={(e) =>
            setForm({ ...form, pointsPercent: Number(e.target.value) })
          }
          className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-stone-600">
          Минимальная сумма заказа для баллов (₽)
        </label>
        <input
          type="number"
          min={0}
          value={form.minOrderForPoints}
          onChange={(e) =>
            setForm({ ...form, minOrderForPoints: Number(e.target.value) })
          }
          className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
