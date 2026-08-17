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
    ...(init?.headers as Record<string, string> | undefined),
  };

  const merchantId = process.env.YANDEX_PAY_MERCHANT_ID?.trim();
  if (merchantId) {
    headers["X-Request-Id"] = crypto.randomUUID();
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    reasonCode?: string;
    reason?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.reason ||
        data.reasonCode ||
        `Yandex Pay HTTP ${response.status}`,
    );
  }

  return data;
}

export async function createYandexPayOrder(
  input: YandexPayCreateInput,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const amount = input.amountRub.toFixed(2);

  const payload: Record<string, unknown> = {
    orderId: input.orderId,
    currencyCode: "RUB",
    availablePaymentMethods: input.methods,
    cart: {
      items: input.items.map((item) => ({
        productId: item.productId,
        title: item.name.slice(0, 128),
        quantity: { count: String(item.quantity) },
        total: (item.price * item.quantity).toFixed(2),
        unitPrice: item.price.toFixed(2),
      })),
      total: { amount },
    },
    redirectUrls: {
      onSuccess: input.successUrl,
      onError: input.errorUrl,
    },
    metadata: {
      order_number: input.orderNumber,
    },
  };

  if (input.customerEmail || input.customerPhone) {
    payload.billingContact = {
      email: input.customerEmail,
      phone: input.customerPhone,
    };
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
    throw new Error("Yandex Pay did not return paymentUrl");
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
