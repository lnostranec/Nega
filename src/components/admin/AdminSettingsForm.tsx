"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Settings = {
  shopName: string;
  pointsPercent: number;
  minOrderForPoints: number;
  cdekPvzBaseCost: number;
  cdekCourierBaseCost: number;
  yandexDeliveryCost: number;
  freeDeliveryFrom: number | null;
  loyaltyThreshold1: number;
  loyaltyPercent1: number;
  loyaltyThreshold2: number;
  loyaltyPercent2: number;
  loyaltyThreshold3: number;
  loyaltyPercent3: number;
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
      className="max-w-2xl space-y-8 rounded-lg border border-stone-200 bg-white p-6"
    >
      <section className="space-y-4">
        <h2 className="text-base font-medium text-stone-900">Магазин</h2>
        <div>
          <label className="text-sm text-stone-600">Название магазина</label>
          <input
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-stone-900">Баллы</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-stone-600">
              Процент начисления баллов
            </label>
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
              Мин. сумма заказа для баллов (₽)
            </label>
            <input
              type="number"
              min={0}
              value={form.minOrderForPoints}
              onChange={(e) =>
                setForm({
                  ...form,
                  minOrderForPoints: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-stone-900">Доставка</h2>
          <p className="mt-1 text-sm text-stone-500">
            Базовые тарифы. При сумме заказа от порога — бесплатно.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-stone-600">СДЭК ПВЗ (₽)</label>
            <input
              type="number"
              min={0}
              value={form.cdekPvzBaseCost}
              onChange={(e) =>
                setForm({
                  ...form,
                  cdekPvzBaseCost: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">СДЭК курьер (₽)</label>
            <input
              type="number"
              min={0}
              value={form.cdekCourierBaseCost}
              onChange={(e) =>
                setForm({
                  ...form,
                  cdekCourierBaseCost: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">Яндекс Доставка (₽)</label>
            <input
              type="number"
              min={0}
              value={form.yandexDeliveryCost}
              onChange={(e) =>
                setForm({
                  ...form,
                  yandexDeliveryCost: Number(e.target.value),
                })
              }
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600">
              Бесплатная доставка от (₽)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeDeliveryFrom ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeDeliveryFrom:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="10000"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-stone-900">
            Скидка клиента
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            По сумме оплаченных заказов за всё время. Применяется автоматически
            в корзине и при оформлении.
          </p>
        </div>
        <div className="space-y-3">
          {(
            [
              {
                label: "1 уровень",
                thresholdKey: "loyaltyThreshold1" as const,
                percentKey: "loyaltyPercent1" as const,
              },
              {
                label: "2 уровень",
                thresholdKey: "loyaltyThreshold2" as const,
                percentKey: "loyaltyPercent2" as const,
              },
              {
                label: "3 уровень",
                thresholdKey: "loyaltyThreshold3" as const,
                percentKey: "loyaltyPercent3" as const,
              },
            ] as const
          ).map((tier) => (
            <div
              key={tier.label}
              className="grid grid-cols-[1fr_1fr] gap-3 rounded border border-stone-200 p-3 sm:grid-cols-[120px_1fr_1fr]"
            >
              <p className="col-span-2 text-sm font-medium text-stone-700 sm:col-span-1 sm:self-center">
                {tier.label}
              </p>
              <div>
                <label className="text-xs text-stone-500">Сумма от, ₽</label>
                <input
                  type="number"
                  min={0}
                  value={form[tier.thresholdKey]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [tier.thresholdKey]: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500">Скидка, %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form[tier.percentKey]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [tier.percentKey]: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {message && <p className="text-sm text-green-700">{message}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
