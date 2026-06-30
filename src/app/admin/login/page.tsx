"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError(loginData.error ?? "Ошибка входа");
        return;
      }

      const checkRes = await fetch("/api/admin/products");
      if (checkRes.status === 401) {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("У этого аккаунта нет прав администратора");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Не удалось войти. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-medium text-stone-900">Вход в админку</h1>
        <p className="mt-2 text-sm text-stone-500">
          Используйте email и пароль администратора
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-stone-600" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600" htmlFor="admin-password">
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-900">
            ← На сайт
          </Link>
        </p>
      </div>
    </div>
  );
}
