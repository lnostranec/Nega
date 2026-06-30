"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  sanitizePhoneInput,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "@/lib/validation";
import type { PublicUser } from "@/lib/auth-types";
import { useAuth } from "./AuthModalProvider";

type AuthMode = "login" | "register";

type AccountAuthModalProps = {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
};

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

export function AccountAuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: AccountAuthModalProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setPasswordConfirm("");
      setError(null);
      setLoading(false);
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

  if (!open || !mounted) return null;

  function validateForm(): string | null {
    if (mode === "register") {
      const nameError = validateName(firstName);
      if (nameError) return nameError;
    }

    const emailError = validateEmail(email);
    if (emailError) return emailError;

    if (mode === "register" && phone.trim()) {
      const phoneError = validatePhone(phone);
      if (phoneError) return phoneError;
    }

    const passwordError =
      mode === "login"
        ? password
          ? null
          : "Введите пароль"
        : validatePassword(password);
    if (passwordError) return passwordError;

    if (mode === "register") {
      const confirmError = validatePasswordConfirm(password, passwordConfirm);
      if (confirmError) return confirmError;
    }

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { firstName, email, phone, password, passwordConfirm };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      let data: { user?: unknown; error?: string };
      try {
        data = await response.json();
      } catch {
        setError("Сервер вернул некорректный ответ");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Не удалось выполнить запрос");
        return;
      }

      setUser(data.user as PublicUser);
      onClose();
      router.push("/account");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Вход в личный кабинет" : "Регистрация"}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 text-stone-400 transition hover:text-[#260402]"
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

        <h2 className="text-center text-2xl font-medium text-[#260402]">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500">
          {mode === "login"
            ? "Войдите по email и паролю"
            : "Создайте аккаунт для заказов и баллов"}
        </p>

        <div className="mt-6 flex border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setError(null);
              onModeChange("login");
            }}
            className={`flex-1 py-2.5 text-sm font-medium uppercase tracking-widest transition-colors duration-300 ${
              mode === "login"
                ? "bg-brand text-white"
                : "bg-white text-stone-600 hover:text-[#260402]"
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onModeChange("register");
            }}
            className={`flex-1 py-2.5 text-sm font-medium uppercase tracking-widest transition-colors duration-300 ${
              mode === "register"
                ? "bg-brand text-white"
                : "bg-white text-stone-600 hover:text-[#260402]"
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {mode === "register" && (
            <div>
              <label htmlFor="auth-first-name" className="sr-only">
                Имя
              </label>
              <input
                id="auth-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Имя"
                autoComplete="given-name"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="sr-only">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {mode === "register" && (
            <div>
              <label htmlFor="auth-phone" className="sr-only">
                Телефон
              </label>
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                placeholder="Телефон (необязательно)"
                autoComplete="tel"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-password" className="sr-only">
              Пароль
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (минимум 8 символов)"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {mode === "register" && (
            <div>
              <label htmlFor="auth-password-confirm" className="sr-only">
                Повторите пароль
              </label>
              <input
                id="auth-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Повторите пароль"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          {mode === "login" ? (
            <>
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onModeChange("register");
                }}
                className="text-[#260402] underline"
              >
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onModeChange("login");
                }}
                className="text-[#260402] underline"
              >
                Войти
              </button>
            </>
          )}
        </p>
      </div>
    </div>,
    document.body,
  );
}
