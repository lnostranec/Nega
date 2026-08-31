/**
 * ЮKassa API (redirect + webhook).
 * Без YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY — неактивен (dev auto-confirm).
 */

const YOOKASSA_API = "https://api.yookassa.ru/v3";

export type YooKassaPayment = {
  id: string;
  status: string;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
  cancellation_details?: { party?: string; reason?: string };
};

export type CreateYooKassaPaymentInput = {
  orderId: string;
  orderNumber: string;
  amountRub: number;
  returnUrl: string;
  description: string;
  customerEmail?: string;
};

export function isYooKassaConfigured(): boolean {
  return Boolean(
    process.env.YOOKASSA_SHOP_ID?.trim() &&
      process.env.YOOKASSA_SECRET_KEY?.trim(),
  );
}

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID!.trim();
  const secret = process.env.YOOKASSA_SECRET_KEY!.trim();
  return `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`;
}

const YOOKASSA_FETCH_TIMEOUT_MS = 25_000;

async function yooFetch<T>(
  path: string,
  init?: RequestInit & { idempotenceKey?: string },
): Promise<T> {
  const headers: HeadersInit = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
  if (init?.idempotenceKey) {
    (headers as Record<string, string>)["Idempotence-Key"] = init.idempotenceKey;
  }

  const response = await fetch(`${YOOKASSA_API}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(YOOKASSA_FETCH_TIMEOUT_MS),
  });

  const data = (await response.json()) as T & {
    type?: string;
    description?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.description || data.code || `YooKassa HTTP ${response.status}`,
    );
  }

  return data;
}

function shouldRetryYooKassaWithoutReceipt(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("receipt") ||
    msg.includes("чек") ||
    msg.includes("54-fz") ||
    msg.includes("fiscal")
  );
}

async function createYooKassaPaymentRequest(
  input: CreateYooKassaPaymentInput,
  withReceipt: boolean,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const amount = input.amountRub.toFixed(2);
  const payload: Record<string, unknown> = {
    amount: { value: amount, currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: input.returnUrl,
    },
    description: input.description.slice(0, 128),
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
    },
  };

  if (
    withReceipt &&
    input.customerEmail &&
    process.env.YOOKASSA_SEND_RECEIPT === "1"
  ) {
    payload.receipt = {
      customer: { email: input.customerEmail },
      items: [
        {
          description: input.description.slice(0, 128),
          quantity: "1.00",
          amount: { value: amount, currency: "RUB" },
          vat_code: Number(process.env.YOOKASSA_VAT_CODE ?? "1"),
          payment_subject: "commodity",
          payment_mode: "full_payment",
        },
      ],
    };
  }

  const payment = await yooFetch<YooKassaPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
    idempotenceKey: input.orderId,
  });

  const confirmationUrl = payment.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    throw new Error("YooKassa did not return confirmation_url");
  }

  return { paymentId: payment.id, confirmationUrl };
}

export async function createYooKassaPayment(
  input: CreateYooKassaPaymentInput,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const wantsReceipt =
    Boolean(input.customerEmail) && process.env.YOOKASSA_SEND_RECEIPT === "1";

  try {
    return await createYooKassaPaymentRequest(input, wantsReceipt);
  } catch (error) {
    if (wantsReceipt && shouldRetryYooKassaWithoutReceipt(error)) {
      console.warn(
        "[yookassa] receipt rejected, retrying payment without receipt",
        error,
      );
      return await createYooKassaPaymentRequest(input, false);
    }
    if (error instanceof Error) {
      throw new Error(`YooKassa: ${error.message}`);
    }
    throw error;
  }
}

export async function getYooKassaPayment(
  paymentId: string,
): Promise<YooKassaPayment> {
  return yooFetch<YooKassaPayment>(`/payments/${paymentId}`, {
    method: "GET",
  });
}

export async function createYooKassaRefund(input: {
  paymentId: string;
  amountRub: number;
  orderId: string;
}): Promise<{ refundId: string; status: string }> {
  const amount = input.amountRub.toFixed(2);
  const data = await yooFetch<{ id: string; status: string }>("/refunds", {
    method: "POST",
    body: JSON.stringify({
      payment_id: input.paymentId,
      amount: { value: amount, currency: "RUB" },
    }),
    idempotenceKey: `refund-${input.orderId}`,
  });
  return { refundId: data.id, status: data.status };
}

/** IP ranges from https://yookassa.ru/developers/using-api/webhooks */
const YOOKASSA_IPV4_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.154.128/25",
] as const;
const YOOKASSA_IPV4_EXACT = new Set(["77.75.156.11", "77.75.156.35"]);

export function shouldSkipYooKassaIpCheck(): boolean {
  return (
    process.env.YOOKASSA_SKIP_IP_CHECK === "1" ||
    process.env.NODE_ENV === "development"
  );
}

export function isYooKassaIp(ip: string | null): boolean {
  if (!ip) return false;
  const cleaned = ip.replace(/^::ffff:/, "").split(",")[0]?.trim() ?? "";
  if (!cleaned) return false;
  if (YOOKASSA_IPV4_EXACT.has(cleaned)) return true;
  if (cleaned.startsWith("2a02:5180:")) return true;

  const parts = cleaned.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const value =
    ((parts[0]! << 24) >>> 0) +
    ((parts[1]! << 16) >>> 0) +
    ((parts[2]! << 8) >>> 0) +
    (parts[3]! >>> 0);

  for (const cidr of YOOKASSA_IPV4_CIDRS) {
    const [base, bitsStr] = cidr.split("/");
    const bits = Number(bitsStr);
    const baseParts = base!.split(".").map(Number);
    const baseValue =
      ((baseParts[0]! << 24) >>> 0) +
      ((baseParts[1]! << 16) >>> 0) +
      ((baseParts[2]! << 8) >>> 0) +
      (baseParts[3]! >>> 0);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if ((value & mask) === (baseValue & mask)) return true;
  }

  return false;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}
