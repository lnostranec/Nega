"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { sanitizePhoneInput, validateName, validatePhone } from "@/lib/validation";

type ConsultationModalProps = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "w-full border border-stone-200 px-5 py-3.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-brand";

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    agreed?: string;
  }>({});

  useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
      setAgreed(false);
      setErrors({});
    }
  }, [open]);

  useBodyScrollLock(open);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function handlePhoneFocus() {
    if (!phone) setPhone("+7");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrors = {
      name: validateName(name) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      agreed: agreed ? undefined : "Необходимо согласие на обработку данных",
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.phone || nextErrors.agreed) return;

    alert("Заявка на консультацию будет отправлена после подключения CRM");
    onClose();
  }

  const canSubmit =
    !validateName(name) && !validatePhone(phone) && agreed;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Заявка на консультацию"
        className="relative w-full max-w-lg bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 text-stone-400 transition hover:text-brand"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-5 w-5"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-center text-xl font-semibold text-brand sm:text-2xl">
          Заявка на консультацию
        </h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s'-]/g, ""));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Ваше имя"
              autoComplete="name"
              className={inputClass}
            />
            {errors.name && (
              <p className="mt-1.5 px-2 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(sanitizePhoneInput(e.target.value));
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              onFocus={handlePhoneFocus}
              placeholder="Номер телефона"
              autoComplete="tel"
              className={inputClass}
            />
            {errors.phone && (
              <p className="mt-1.5 px-2 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 px-1 pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: undefined }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 accent-brand"
            />
            <span className="text-sm leading-snug text-brand">
              Соглашаюсь с обработкой персональных данных
            </span>
          </label>
          {errors.agreed && (
            <p className="-mt-2 px-2 text-xs text-red-600">{errors.agreed}</p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 w-full py-4 disabled:bg-stone-200 disabled:text-stone-400"
          >
            Перезвоните мне
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-stone-500">
          Отправляя заявку, вы принимаете условия{" "}
          <Link href="/offer" className="text-brand underline underline-offset-2" onClick={onClose}>
            публичной оферты
          </Link>{" "}
          и подтверждаете согласие с{" "}
          <Link
            href="/privacy"
            className="text-brand underline underline-offset-2"
            onClick={onClose}
          >
            политикой обработки персональных данных
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
