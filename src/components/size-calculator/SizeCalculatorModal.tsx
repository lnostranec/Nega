"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { buildCatalogUrl } from "@/lib/catalog";
import { calculateBraSize, calculatePantySize } from "@/lib/size-calculator";

type SizeCalculatorModalProps = {
  open: boolean;
  onClose: () => void;
};

const fieldClass =
  "size-calc-input w-full rounded-md border border-white/40 bg-[#260402] px-4 py-3 pr-12 text-xl text-[#f5efe8] outline-none placeholder:text-[#f5efe8]/70 focus:border-white/70 sm:text-2xl";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

function MeasureField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-xs font-medium uppercase tracking-[0.18em]">
        {label}
      </span>
      <span className="relative block">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => onChange(digitsOnly(e.target.value))}
          placeholder={placeholder}
          className={fieldClass}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm not-italic">
          см
        </span>
      </span>
    </label>
  );
}

function ResultLine({
  ready,
  outOfRange,
  size,
  catalogHref,
  emptyHint,
  outHint,
  onNavigate,
}: {
  ready: boolean;
  outOfRange: boolean;
  size: string | null;
  catalogHref?: string;
  emptyHint: string;
  outHint: string;
  onNavigate: () => void;
}) {
  if (size) {
    return (
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-2xl font-medium tracking-wide text-white sm:text-3xl">
          Ваш размер: {size}
        </p>
        {catalogHref ? (
          <Link
            href={catalogHref}
            onClick={onNavigate}
            className="ml-auto inline-flex shrink-0 items-center border border-white/50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            В каталог
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <p className="mt-6 text-sm text-[#f5efe8]/80">
      {ready && outOfRange ? outHint : emptyHint}
    </p>
  );
}

export function SizeCalculatorModal({ open, onClose }: SizeCalculatorModalProps) {
  const [underbust, setUnderbust] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  useEffect(() => {
    if (!open) {
      setUnderbust("");
      setBust("");
      setWaist("");
      setHips("");
    }
  }, [open]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const braReady = underbust.length >= 2 && bust.length >= 2;
  const bra = braReady
    ? calculateBraSize(Number(underbust), Number(bust))
    : null;

  const pantyReady = waist.length >= 2 && hips.length >= 2;
  const panty = pantyReady
    ? calculatePantySize(Number(waist), Number(hips))
    : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Калькулятор размера"
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#260402] px-6 py-8 text-[#f5efe8] shadow-xl sm:px-10 sm:py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 text-[#f5efe8]/70 transition hover:text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 className="text-sm font-medium uppercase tracking-[0.2em]">
          Калькулятор размера
        </h2>

        <h3 className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-[#f5efe8]/70">
          Размер лифа
        </h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:gap-8">
          <MeasureField
            label="Объём под грудью"
            value={underbust}
            onChange={setUnderbust}
            placeholder="например 75"
          />
          <MeasureField
            label="Объём груди"
            value={bust}
            onChange={setBust}
            placeholder="например 88"
          />
        </div>
        <ResultLine
          ready={braReady}
          outOfRange={!bra}
          size={bra?.size ?? null}
          catalogHref={
            bra
              ? buildCatalogUrl({ collection: "bras", size: bra.size })
              : undefined
          }
          onNavigate={onClose}
          emptyHint="Введите оба параметра — размер рассчитается автоматически."
          outHint="Эти мерки вне стандартной сетки (пояс 65–95, чашка AA–G). Перепроверьте замеры."
        />

        <h3 className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-[#f5efe8]/70">
          Размер трусиков
        </h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:gap-8">
          <MeasureField
            label="Объём талии"
            value={waist}
            onChange={setWaist}
            placeholder="например 68"
          />
          <MeasureField
            label="Объём бёдер"
            value={hips}
            onChange={setHips}
            placeholder="например 94"
          />
        </div>
        <ResultLine
          ready={pantyReady}
          outOfRange={!panty}
          size={panty?.size ?? null}
          catalogHref={
            panty
              ? buildCatalogUrl({ collection: "panties", size: panty.size })
              : undefined
          }
          onNavigate={onClose}
          emptyHint="Введите талию и бёдра — размер появится сразу."
          outHint="Эти мерки вне стандартной сетки (XXS–XXXL). Перепроверьте замеры."
        />
      </div>
    </div>
  );
}
