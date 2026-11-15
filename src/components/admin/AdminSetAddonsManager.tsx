"use client";

import Image from "next/image";
import { useState } from "react";
import type { AdminSetAddon } from "@/lib/admin-set-addons";

type ModelDraft = { name: string; price: number };

type AddonDraft = {
  id: string | null;
  name: string;
  price: number;
  imageUrl: string;
  note: string;
  isActive: boolean;
  sortOrder: number;
  models: ModelDraft[];
};

function toDraft(addon: AdminSetAddon): AddonDraft {
  return {
    id: addon.id,
    name: addon.name,
    price: addon.price,
    imageUrl: addon.imageUrl ?? "",
    note: addon.note ?? "",
    isActive: addon.isActive,
    sortOrder: addon.sortOrder,
    models: addon.models.map((model) => ({
      name: model.name,
      price: model.price,
    })),
  };
}

const emptyDraft: AddonDraft = {
  id: null,
  name: "",
  price: 0,
  imageUrl: "",
  note: "",
  isActive: true,
  sortOrder: 0,
  models: [],
};

export function AdminSetAddonsManager({ initial }: { initial: AdminSetAddon[] }) {
  const [drafts, setDrafts] = useState<AddonDraft[]>(initial.map(toDraft));
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  function update(index: number, patch: Partial<AddonDraft>) {
    setDrafts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateModel(index: number, modelIndex: number, patch: Partial<ModelDraft>) {
    setDrafts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              models: item.models.map((model, mi) =>
                mi === modelIndex ? { ...model, ...patch } : model,
              ),
            }
          : item,
      ),
    );
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    setMessage("");

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setMessage(data.error ?? "Не удалось загрузить фото");
        return;
      }
      update(index, { imageUrl: data.url });
    } catch {
      setMessage("Не удалось загрузить фото");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function save(index: number) {
    const draft = drafts[index];
    setSavingIndex(index);
    setMessage("");

    try {
      const payload = {
        name: draft.name,
        price: draft.price,
        imageUrl: draft.imageUrl || null,
        note: draft.note || null,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
        models: draft.models,
      };

      const response = await fetch(
        draft.id ? `/api/admin/set-addons/${draft.id}` : "/api/admin/set-addons",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        item?: AdminSetAddon;
        error?: string;
      };

      if (!response.ok || !data.item) {
        setMessage(data.error ?? "Не удалось сохранить");
        return;
      }

      setDrafts((prev) =>
        prev.map((item, i) => (i === index ? toDraft(data.item!) : item)),
      );
      setMessage("Сохранено");
    } catch {
      setMessage("Не удалось сохранить");
    } finally {
      setSavingIndex(null);
    }
  }

  async function remove(index: number) {
    const draft = drafts[index];

    if (draft.id) {
      const response = await fetch(`/api/admin/set-addons/${draft.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setMessage("Не удалось удалить");
        return;
      }
    }

    setDrafts((prev) => prev.filter((_, i) => i !== index));
    setMessage("Удалено");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setDrafts((prev) => [
              ...prev,
              {
                ...emptyDraft,
                sortOrder:
                  prev.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1,
              },
            ])
          }
          className="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50"
        >
          + Добавить доп
        </button>
        {message && <span className="text-sm text-stone-500">{message}</span>}
      </div>

      {drafts.length === 0 && (
        <p className="text-sm text-stone-500">
          Пока нет допов. Добавьте первый — он появится на всех комплектах.
        </p>
      )}

      <ul className="space-y-4">
        {drafts.map((draft, index) => (
          <li key={draft.id ?? `new-${index}`} className="rounded border border-stone-200 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-50">
                {draft.imageUrl ? (
                  <Image
                    src={draft.imageUrl}
                    alt={draft.name || "Доп"}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-stone-400">
                    Нет фото
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={draft.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  placeholder="Название (например, Ещё одни трусики)"
                  className="w-full border border-stone-300 px-2 py-1.5 text-sm"
                />

                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    Цена, ₽
                    <input
                      type="number"
                      min={0}
                      value={draft.price}
                      onChange={(event) =>
                        update(index, {
                          price: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                      className="w-28 border border-stone-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    Порядок
                    <input
                      type="number"
                      min={0}
                      value={draft.sortOrder}
                      onChange={(event) =>
                        update(index, {
                          sortOrder: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                      className="w-20 border border-stone-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        update(index, { isActive: event.target.checked })
                      }
                    />
                    Активен
                  </label>
                </div>

                <input
                  value={draft.note}
                  onChange={(event) => update(index, { note: event.target.value })}
                  placeholder="Подпись (необязательно), например «любая модель низа»"
                  className="w-full border border-stone-300 px-2 py-1.5 text-sm"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                      {uploadingIndex === index ? "Загрузка…" : "Загрузить фото"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIndex === index}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void uploadImage(index, file);
                      }}
                    />
                  </label>

                  {draft.imageUrl && (
                    <button
                      type="button"
                      onClick={() => update(index, { imageUrl: "" })}
                      className="text-sm text-stone-500 hover:text-stone-800"
                    >
                      Убрать фото
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-stone-200 pt-3">
              <p className="text-sm text-stone-600">
                Модели dentro допа — у каждой своя цена
              </p>

              <ul className="mt-2 space-y-2">
                {draft.models.map((model, modelIndex) => (
                  <li key={modelIndex} className="flex flex-wrap items-center gap-2">
                    <input
                      value={model.name}
                      onChange={(event) =>
                        updateModel(index, modelIndex, { name: event.target.value })
                      }
                      placeholder="Модель (например, Классические слипы)"
                      className="min-w-[220px] flex-1 border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <label className="flex items-center gap-1 text-sm text-stone-600">
                      ₽
                      <input
                        type="number"
                        min={0}
                        value={model.price}
                        onChange={(event) =>
                          updateModel(index, modelIndex, {
                            price: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                        className="w-24 border border-stone-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        update(index, {
                          models: draft.models.filter((_, mi) => mi !== modelIndex),
                        })
                      }
                      className="px-2 text-sm text-stone-400 hover:text-red-600"
                      aria-label="Удалить модель"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  update(index, {
                    models: [...draft.models, { name: "", price: 0 }],
                  })
                }
                className="mt-2 rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                + Добавить модель
              </button>

              {draft.models.length === 0 && (
                <p className="mt-2 text-xs text-stone-400">
                  Без моделей доп добавляется одной позицией без выбора.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => save(index)}
                disabled={savingIndex === index}
                className="btn-site btn-site-filled bg-brand px-5 py-2 text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50"
              >
                {savingIndex === index ? "Сохраняю…" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-3 py-2 text-sm text-stone-500 hover:text-red-600"
              >
                Удалить доп
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
