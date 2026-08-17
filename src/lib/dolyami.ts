/**
 * Долями (Т‑Банк) — создание заявки + webhook.
 * Env: DOLYAMI_LOGIN, DOLYAMI_PASSWORD
 * Опционально: DOLYAMI_API_URL (по умолчанию partner.dolyame.ru)
 */

import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_API = "https://partner.dolyame.ru";

export type DolyamiCreateInput = {
  orderId: string;
  orderNumber: string;
  amountRub: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
  notificationUrl: string;
  items: { name: string; price: number; quantity: number }[];
};

export function isDolyamiConfigured(): boolean {
  return Boolean(
    process.env.DOLYAMI_LOGIN?.trim() && process.env.DOLYAMI_PASSWORD?.trim(),
  );
}

function apiBase(): string {
  return (process.env.DOLYAMI_API_URL?.trim() || DEFAULT_API).replace(/\/$/, "");
}

function authHeader(): string {
  const login = process.env.DOLYAMI_LOGIN!.trim();
  const password = process.env.DOLYAMI_PASSWORD!.trim();
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function dolyamiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Dolyami HTTP ${response.status}`,
    );
  }

  return data;
}

export async function createDolyamiOrder(
  input: DolyamiCreateInput,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const [firstName, ...rest] = (input.customerName ?? "Покупатель")
    .trim()
    .split(/\s+/);

  const payload = {
    order: {
      id: input.orderId,
      amount: Number(input.amountRub.toFixed(2)),
      prepaid_amount: 0,
      items: input.items.map((item) => ({
        name: item.name.slice(0, 128),
        quantity: item.quantity,
        price: Number(item.price.toFixed(2)),
      })),
    },
    client_info: {
      first_name: firstName || "Покупатель",
      last_name: rest.join(" ") || undefined,
      phone: input.customerPhone,
      email: input.customerEmail,
    },
    notification_url: input.notificationUrl,
    success_url: input.successUrl,
    fail_url: input.failUrl,
  };

  const data = await dolyamiFetch<{
    id?: string;
    link?: string;
    status?: string;
  }>("/v1/orders/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data.link) {
    throw new Error("Dolyami did not return payment link");
  }

  return {
    paymentId: data.id || input.orderId,
    confirmationUrl: data.link,
  };
}

/** Подтверждение после wait_for_commit */
export async function commitDolyamiOrder(orderId: string): Promise<void> {
  await dolyamiFetch(`/v1/orders/${encodeURIComponent(orderId)}/commit`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getDolyamiOrderStatus(orderId: string): Promise<{
  id: string;
  status: string;
}> {
  return dolyamiFetch(`/v1/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

/**
 * Проверка подписи webhook (HMAC-SHA256).
 * Заголовок обычно X-Partner-Sign / signature — см. кабинет Долями.
 */
export function verifyDolyamiWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.DOLYAMI_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Без секрета в dev пропускаем; в проде лучше задать
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return expected === provided;
  }
}

export function isDolyamiIp(ip: string | null): boolean {
  if (!ip) return false;
  const cleaned = ip.replace(/^::ffff:/, "").split(",")[0]?.trim() ?? "";
  // 91.194.226.0/23
  const parts = cleaned.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] !== 91 || parts[1] !== 194) return false;
  if (parts[2] === 226 || parts[2] === 227) return true;
  return false;
}

export function shouldSkipDolyamiIpCheck(): boolean {
  return (
    process.env.DOLYAMI_SKIP_IP_CHECK === "1" ||
    process.env.NODE_ENV === "development"
  );
}
