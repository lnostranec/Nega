"use client";

import { FormEvent, useState } from "react";
import type { AdminPromoCodeView } from "@/lib/admin-promo-codes";
import { formatPrice } from "@/lib/format";

type AdminPromoCodesPanelProps = {
  initialPromos: AdminPromoCodeView[];
};

type EditDraft = {
  code: string;
  type: "FIXED" | "PERCENT";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  isActive: boolean;
};

const inputClass = "w-full rounded border border-stone-300 px-2 py-1.5 text-sm";

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function AdminPromoCodesPanel({ initialPromos }: AdminPromoCodesPanelProps) {
  const [promos, setPromos] = useState(initialPromos);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowLoading, setRowLoading] = useState(false);

  function startEdit(promo: AdminPromoCodeView) {
    if (promo.isGiftCert) return;
    setEditingId(promo.id);
    setEditDraft({
      code: promo.code,
      type: promo.type,
      value: String(promo.value),
      minOrderAmount: String(promo.minOrderAmount),
      maxUses: promo.maxUses !== null ? String(promo.maxUses) : "",
      isActive: promo.isActive,
    });
    setRowError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setRowError(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          minOrderAmount: Number(minOrderAmount) || 0,
          maxUses: maxUses.trim() ? Number(maxUses) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось создать промокод");
        return;
      }

      setPromos((prev) => [data.promo, ...prev]);
      setCode("");
      setValue("");
      setMaxUses("");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(promoId: string) {
    if (!editDraft) return;

    setRowError(null);
    setRowLoading(true);

    try {
      const response = await fetch(`/api/admin/promo-codes/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: editDraft.code,
          type: editDraft.type,
          value: Number(editDraft.value),
          minOrderAmount: Number(editDraft.minOrderAmount) || 0,
          maxUses: editDraft.maxUses.trim() ? Number(editDraft.maxUses) : null,
          isActive: editDraft.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setRowError(data.error ?? "Не удалось сохранить");
        return;
      }

      setPromos((prev) =>
        prev.map((item) => (item.id === promoId ? data.promo : item)),
      );
      cancelEdit();
    } catch {
      setRowError("Ошибка сети");
    } finally {
      setRowLoading(false);
    }
  }

  async function handleDelete(promo: AdminPromoCodeView) {
    if (promo.isGiftCert) return;
    if (!confirm(`Удалить промокод ${promo.code}?`)) return;

    setRowError(null);
    setRowLoading(true);

    try {
      const response = await fetch(`/api/admin/promo-codes/${promo.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        setRowError(data.error ?? "Не удалось удалить");
        return;
      }

      setPromos((prev) => prev.filter((item) => item.id !== promo.id));
      if (editingId === promo.id) cancelEdit();
    } catch {
      setRowError("Ошибка сети");
    } finally {
      setRowLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-stone-200 bg-white p-6"
      >
        <h2 className="font-medium">Новый промокод</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            placeholder="Код"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "FIXED" | "PERCENT")}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="FIXED">Фиксированная сумма (₽)</option>
            <option value="PERCENT">Процент (%)</option>
          </select>
          <input
            type="number"
            placeholder={type === "PERCENT" ? "Процент" : "Сумма скидки"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min={1}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Мин. сумма заказа"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            min={0}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Лимит использований (пусто = без лимита)"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            min={1}
            className="rounded border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? "Создаём..." : "Создать"}
        </button>
      </form>

      {rowError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {rowError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Скидка</th>
              <th className="px-4 py-3 font-medium">Мин. заказ</th>
              <th className="px-4 py-3 font-medium">Лимит</th>
              <th className="px-4 py-3 font-medium">Использований</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => {
              const isEditing = editingId === promo.id && editDraft !== null;

              return (
                <tr key={promo.id} className="border-b border-stone-100">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDraft.code}
                        onChange={(e) =>
                          setEditDraft((draft) =>
                            draft
                              ? { ...draft, code: e.target.value.toUpperCase() }
                              : draft,
                          )
                        }
                        className={`${inputClass} font-mono text-xs`}
                      />
                    ) : (
                      <span className="font-mono text-xs">{promo.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <select
                          value={editDraft.type}
                          onChange={(e) =>
                            setEditDraft((draft) =>
                              draft
                                ? {
                                    ...draft,
                                    type: e.target.value as "FIXED" | "PERCENT",
                                  }
                                : draft,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="FIXED">₽</option>
                          <option value="PERCENT">%</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={editDraft.type === "PERCENT" ? 100 : undefined}
                          value={editDraft.value}
                          onChange={(e) =>
                            setEditDraft((draft) =>
                              draft ? { ...draft, value: e.target.value } : draft,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    ) : promo.type === "PERCENT" ? (
                      `${promo.value}%`
                    ) : (
                      formatPrice(promo.value)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editDraft.minOrderAmount}
                        onChange={(e) =>
                          setEditDraft((draft) =>
                            draft
                              ? { ...draft, minOrderAmount: e.target.value }
                              : draft,
                          )
                        }
                        className={inputClass}
                      />
                    ) : promo.minOrderAmount > 0 ? (
                      formatPrice(promo.minOrderAmount)
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={promo.usedCount || 1}
                        placeholder="∞"
                        value={editDraft.maxUses}
                        onChange={(e) =>
                          setEditDraft((draft) =>
                            draft ? { ...draft, maxUses: e.target.value } : draft,
                          )
                        }
                        className={inputClass}
                      />
                    ) : promo.maxUses !== null ? (
                      promo.maxUses
                    ) : (
                      "∞"
                    )}
                  </td>
                  <td className="px-4 py-3">{promo.usedCount}</td>
                  <td className="px-4 py-3">
                    {promo.isGiftCert ? (
                      <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
                        Сертификат
                      </span>
                    ) : isEditing ? (
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editDraft.isActive}
                          onChange={(e) =>
                            setEditDraft((draft) =>
                              draft
                                ? { ...draft, isActive: e.target.checked }
                                : draft,
                            )
                          }
                        />
                        Активен
                      </label>
                    ) : (
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          promo.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {promo.isActive ? "Активен" : "Выключен"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {promo.isGiftCert ? (
                      <span className="text-xs text-stone-400">Авто</span>
                    ) : isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={rowLoading}
                          onClick={() => saveEdit(promo.id)}
                          className="rounded bg-stone-900 px-2.5 py-1.5 text-xs text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          disabled={rowLoading}
                          onClick={cancelEdit}
                          className="rounded border border-stone-300 px-2.5 py-1.5 text-xs hover:bg-stone-50"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(promo)}
                          disabled={rowLoading || editingId !== null}
                          aria-label={`Редактировать ${promo.code}`}
                          className="rounded p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          disabled={rowLoading || editingId !== null}
                          aria-label={`Удалить ${promo.code}`}
                          className="rounded p-2 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {promos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  Нет промокодов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
