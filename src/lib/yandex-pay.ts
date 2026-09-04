/**
 * Яндекс Пэй / Сплит — создание заказа со ссылкой на оплату.
 * Env: YANDEX_PAY_API_KEY
 * Опционально: YANDEX_PAY_MERCHANT_ID, YANDEX_PAY_API_URL
 * Sandbox: https://sandbox.pay.yandex.ru/api/merchant/v1
 */

export type YandexPayCreateInput = {
  orderId: string;
  orderNumber: string;
  amountRub: number;
  deliveryCost?: number;
  customerEmail?: string;
  customerPhone?: string;
  successUrl: string;
  errorUrl: string;
  /** SPLIT = только части, CARD+SPLIT = оба на форме */
  methods: Array<"CARD" | "SPLIT">;
  items: { productId: string; name: string; price: number; quantity: number }[];
};

export function isYandexPayConfigured(): boolean {
  return Boolean(process.env.YANDEX_PAY_API_KEY?.trim());
}

function apiBase(): string {
  return (
    process.env.YANDEX_PAY_API_URL?.trim() ||
    "https://pay.yandex.ru/api/merchant/v1"
  ).replace(/\/$/, "");
}

async function yandexPayFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Api-Key ${process.env.YANDEX_PAY_API_KEY!.trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Request-Id": crypto.randomUUID(),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
  });

  const raw = await response.text();
  let data: T & {
    reasonCode?: string;
    reason?: string;
    message?: string;
    statusCode?: number;
    code?: number | string;
  } = {} as T & Record<string, unknown>;
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : data;
  } catch {
    /* non-json */
  }

  if (!response.ok) {
    const detail =
      data.message ||
      data.reason ||
      data.reasonCode ||
      (typeof data.code === "string" ? data.code : null) ||
      raw.slice(0, 300) ||
      `HTTP ${response.status}`;
    throw new Error(`YandexPay: ${detail}`);
  }

  return data as T;
}

export async function createYandexPayOrder(
  input: YandexPayCreateInput,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const amount = Number(input.amountRub).toFixed(2);
  const deliveryCost = Math.max(0, Number(input.deliveryCost ?? 0));

  const cartItems = input.items.map((item) => {
    const lineTotal = Number((item.price * item.quantity).toFixed(2));
    return {
      productId: item.productId,
      title: item.name.slice(0, 128),
      quantity: { count: String(item.quantity) },
      total: lineTotal.toFixed(2),
      unitPrice: Number(item.price).toFixed(2),
    };
  });

  // Доставка — отдельной позицией (требование API Яндекс Пэй)
  if (deliveryCost > 0) {
    cartItems.push({
      productId: "delivery",
      title: "Доставка",
      quantity: { count: "1" },
      total: deliveryCost.toFixed(2),
      unitPrice: deliveryCost.toFixed(2),
    });
  }

  const payload: Record<string, unknown> = {
    orderId: input.orderId,
    currencyCode: "RUB",
    availablePaymentMethods: input.methods,
    preferredPaymentMethod:
      input.methods.length === 1 ? input.methods[0] : undefined,
    cart: {
      items: cartItems,
      total: { amount },
    },
    redirectUrls: {
      onSuccess: input.successUrl,
      onError: input.errorUrl,
    },
    // API принимает metadata только как string
    metadata: input.orderNumber.slice(0, 2048),
  };

  if (input.customerPhone) {
    payload.billingPhone = input.customerPhone;
  }

  const data = await yandexPayFetch<{
    data?: { paymentUrl?: string; orderId?: string };
    paymentUrl?: string;
  }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const confirmationUrl = data.data?.paymentUrl || data.paymentUrl;
  if (!confirmationUrl) {
    throw new Error("YandexPay: не вернул ссылку на оплату (paymentUrl)");
  }

  return {
    paymentId: data.data?.orderId || input.orderId,
    confirmationUrl,
  };
}

export async function getYandexPayOrder(orderId: string): Promise<{
  orderId: string;
  paymentStatus?: string;
  orderStatus?: string;
}> {
  const data = await yandexPayFetch<{
    data?: {
      orderId?: string;
      paymentStatus?: string;
      orderStatus?: string;
    };
  }>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" });

  return {
    orderId: data.data?.orderId || orderId,
    paymentStatus: data.data?.paymentStatus,
    orderStatus: data.data?.orderStatus,
  };
}
