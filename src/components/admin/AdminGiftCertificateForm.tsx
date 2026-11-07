"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  giftCertificateFallbackBackground,
  type GiftCertificateConfig,
  type GiftCertificateDesign,
  type GiftCertificateType,
} from "@/lib/gift-certificate";

const inputClass =
  "w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500";
const smallButton =
  "rounded border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50 disabled:opacity-40";

const TEXT_MAX = 5000;

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <h2 className="text-base font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminGiftCertificateForm({ initial }: { initial: GiftCertificateConfig }) {
  const [mainImageUrl, setMainImageUrl] = useState(initial.mainImageUrl);
  const [designs, setDesigns] = useState<GiftCertificateDesign[]>(initial.designs);
  const [nominals, setNominals] = useState<number[]>(initial.nominals);
  const [types, setTypes] = useState<GiftCertificateType[]>(initial.types);
  const [description, setDescription] = useState(initial.description);
  const [deliveryText, setDeliveryText] = useState(initial.deliveryText);
  const [newNominal, setNewNominal] = useState("");

  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function markDirty() {
    setSaved(false);
  }

  async function uploadFile(file: File, target: string): Promise<string | null> {
    setUploading(target);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось загрузить файл");
        return null;
      }
      markDirty();
      return data.url as string;
    } catch {
      setError("Не удалось загрузить файл");
      return null;
    } finally {
      setUploading(null);
    }
  }

  function updateDesign(index: number, patch: Partial<GiftCertificateDesign>) {
    setDesigns((list) =>
      list.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
    markDirty();
  }

  function updateType(index: number, label: string) {
    setTypes((list) => list.map((item, i) => (i === index ? { ...item, label } : item)));
    markDirty();
  }

  function addNominal() {
    const value = Number(newNominal.replace(/\s/g, ""));
    if (!Number.isInteger(value) || value <= 0) {
      setError("Номинал должен быть целым числом рублей");
      return;
    }
    setError(null);
    setNominals((list) => [...new Set([...list, value])].sort((a, b) => a - b));
    setNewNominal("");
    markDirty();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/gift-certificate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mainImageUrl,
          designs,
          nominals,
          types,
          description,
          deliveryText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось сохранить");
        return;
      }
      const config = data.config as GiftCertificateConfig;
      setMainImageUrl(config.mainImageUrl);
      setDesigns(config.designs);
      setNominals(config.nominals);
      setTypes(config.types);
      setDescription(config.description);
      setDeliveryText(config.deliveryText);
      setSaved(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section
        title="Фото сертификата"
        hint="Показывается на странице, если у выбранного дизайна нет своего фото."
      >
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative aspect-[3/4] w-40 overflow-hidden border border-stone-200 bg-stone-50">
            {mainImageUrl ? (
              <Image src={mainImageUrl} alt="" fill className="object-cover" sizes="160px" />
            ) : (
              <span className="flex h-full items-center justify-center p-2 text-center text-xs text-stone-400">
                Фото не загружено
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50">
              {uploading === "main"
                ? "Загрузка…"
                : mainImageUrl
                  ? "Заменить фото"
                  : "Загрузить фото"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading !== null}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const url = await uploadFile(file, "main");
                  if (url) setMainImageUrl(url);
                }}
              />
            </label>
            {mainImageUrl && (
              <button
                type="button"
                className="text-left text-sm text-red-600 hover:underline"
                onClick={() => {
                  setMainImageUrl(null);
                  markDirty();
                }}
              >
                Убрать фото
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Дизайны"
        hint="Покупатель выбирает дизайн на странице сертификата. У каждого дизайна может быть своё фото. Порядок — как на сайте."
      >
        <ul className="space-y-3">
          {designs.map((design, index) => (
            <li
              key={design.id}
              className="flex flex-wrap items-center gap-3 border-b border-stone-100 pb-3"
            >
              <div
                className={`relative h-16 w-16 shrink-0 overflow-hidden border border-stone-200 ${
                  design.imageUrl ? "bg-stone-50" : giftCertificateFallbackBackground(index)
                }`}
              >
                {design.imageUrl && (
                  <Image src={design.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                )}
              </div>
              <input
                type="text"
                value={design.name}
                maxLength={40}
                onChange={(e) => updateDesign(index, { name: e.target.value })}
                placeholder="Название, например: Розовый"
                className={`${inputClass} max-w-xs flex-1`}
              />
              <label className={`${smallButton} cursor-pointer`}>
                {uploading === design.id
                  ? "Загрузка…"
                  : design.imageUrl
                    ? "Заменить фото"
                    : "Фото"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const url = await uploadFile(file, design.id);
                    if (url) updateDesign(index, { imageUrl: url });
                  }}
                />
              </label>
              {design.imageUrl && (
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => updateDesign(index, { imageUrl: null })}
                >
                  Убрать фото
                </button>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  className={smallButton}
                  disabled={index === 0}
                  onClick={() => {
                    setDesigns((list) => move(list, index, -1));
                    markDirty();
                  }}
                  aria-label="Выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={smallButton}
                  disabled={index === designs.length - 1}
                  onClick={() => {
                    setDesigns((list) => move(list, index, 1));
                    markDirty();
                  }}
                  aria-label="Ниже"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline disabled:opacity-40"
                disabled={designs.length === 1}
                onClick={() => {
                  setDesigns((list) => list.filter((_, i) => i !== index));
                  markDirty();
                }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-stone-700 underline"
          disabled={designs.length >= 12}
          onClick={() => {
            setDesigns((list) => [
              ...list,
              { id: newId(), name: String(list.length + 1), imageUrl: null },
            ]);
            markDirty();
          }}
        >
          + Добавить дизайн
        </button>
      </Section>

      <Section title="Номиналы" hint="Суммы в рублях. На сайте выводятся по возрастанию.">
        <div className="flex flex-wrap gap-2">
          {nominals.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-1.5 text-sm"
            >
              {value.toLocaleString("ru-RU")} ₽
              <button
                type="button"
                aria-label={`Удалить номинал ${value}`}
                className="text-stone-400 hover:text-red-600 disabled:opacity-40"
                disabled={nominals.length === 1}
                onClick={() => {
                  setNominals((list) => list.filter((item) => item !== value));
                  markDirty();
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex max-w-sm gap-2">
          <input
            type="number"
            min={100}
            step={100}
            value={newNominal}
            onChange={(e) => setNewNominal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNominal();
              }
            }}
            placeholder="Например, 7000"
            className={inputClass}
          />
          <button type="button" className={smallButton} onClick={addNominal}>
            Добавить
          </button>
        </div>
      </Section>

      <Section
        title="Типы сертификата"
        hint="Например: Бумажный, Электронный. Тип попадает в заказ и письмо покупателю."
      >
        <ul className="space-y-2">
          {types.map((type, index) => (
            <li key={type.id} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={type.label}
                maxLength={40}
                onChange={(e) => updateType(index, e.target.value)}
                className={`${inputClass} max-w-xs flex-1`}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  className={smallButton}
                  disabled={index === 0}
                  onClick={() => {
                    setTypes((list) => move(list, index, -1));
                    markDirty();
                  }}
                  aria-label="Выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={smallButton}
                  disabled={index === types.length - 1}
                  onClick={() => {
                    setTypes((list) => move(list, index, 1));
                    markDirty();
                  }}
                  aria-label="Ниже"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline disabled:opacity-40"
                disabled={types.length === 1}
                onClick={() => {
                  setTypes((list) => list.filter((_, i) => i !== index));
                  markDirty();
                }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-stone-700 underline"
          disabled={types.length >= 6}
          onClick={() => {
            setTypes((list) => [...list, { id: newId(), label: "" }]);
            markDirty();
          }}
        >
          + Добавить тип
        </button>
      </Section>

      <Section
        title="Описание"
        hint="Раскрывающийся блок «Описание» на странице. Пустое поле — блок не показывается."
      >
        <textarea
          value={description}
          maxLength={TEXT_MAX}
          rows={5}
          onChange={(e) => {
            setDescription(e.target.value);
            markDirty();
          }}
          className={`${inputClass} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-stone-400">
          {description.length} / {TEXT_MAX}
        </p>
      </Section>

      <Section
        title="Доставка и возврат"
        hint="Раскрывающийся блок «Доставка и возврат». Пустое поле — блок не показывается."
      >
        <textarea
          value={deliveryText}
          maxLength={TEXT_MAX}
          rows={5}
          onChange={(e) => {
            setDeliveryText(e.target.value);
            markDirty();
          }}
          className={`${inputClass} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-stone-400">
          {deliveryText.length} / {TEXT_MAX}
        </p>
      </Section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-stone-200 bg-stone-100 py-4">
        <Button type="submit" disabled={saving || uploading !== null}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </Button>
        {saved && <span className="text-sm text-green-700">Сохранено — уже на сайте</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <a
          href="/gift-certificate"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-stone-600 underline"
        >
          Открыть страницу сертификата
        </a>
      </div>
    </form>
  );
}
