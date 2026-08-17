/**
 * Яндекс Доставка (Express B2B Cargo API).
 * Env: YANDEX_DELIVERY_TOKEN
 * Склад: YANDEX_DELIVERY_FROM_ADDRESS (+ опционально lat/lon)
 * Host: YANDEX_DELIVERY_API_URL (default b2b.taxi.yandex.net)
 */

export function isYandexDeliveryConfigured(): boolean {
  return Boolean(process.env.YANDEX_DELIVERY_TOKEN?.trim());
}

function apiBase(): string {
  return (
    process.env.YANDEX_DELIVERY_API_URL?.trim() ||
    "https://b2b.taxi.yandex.net"
  ).replace(/\/$/, "");
}

function fromAddress(): string {
  return (
    process.env.YANDEX_DELIVERY_FROM_ADDRESS?.trim() ||
    "Москва, улица Тверская, 1"
  );
}

async function yandexDeliveryFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.YANDEX_DELIVERY_TOKEN!.trim()}`,
      "Content-Type": "application/json",
      "Accept-Language": "ru",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message || data.code || `Yandex Delivery HTTP ${response.status}`,
    );
  }

  return data;
}

/** Предварительная цена (check-price). Без ключей не вызывается. */
export async function calculateYandexDeliveryPrice(input: {
  toAddress: string;
}): Promise<number | null> {
  if (!isYandexDeliveryConfigured()) return null;

  const data = await yandexDeliveryFetch<{ price?: string; price_raw?: number }>(
    "/b2b/cargo/integration/v2/check-price",
    {
      method: "POST",
      body: JSON.stringify({
        route_points: [
          {
            id: 1,
            coordinates:
              process.env.YANDEX_DELIVERY_FROM_LON &&
              process.env.YANDEX_DELIVERY_FROM_LAT
                ? [
                    Number(process.env.YANDEX_DELIVERY_FROM_LON),
                    Number(process.env.YANDEX_DELIVERY_FROM_LAT),
                  ]
                : undefined,
            fullname: fromAddress(),
            country: "Россия",
          },
          {
            id: 2,
            fullname: input.toAddress,
            country: "Россия",
          },
        ].map((point) => {
          const cleaned = { ...point };
          if (!cleaned.coordinates) delete cleaned.coordinates;
          return cleaned;
        }),
        items: [
          {
            quantity: 1,
            size: {
              length: Number(process.env.YANDEX_DELIVERY_ITEM_LENGTH_M ?? "0.3"),
              width: Number(process.env.YANDEX_DELIVERY_ITEM_WIDTH_M ?? "0.2"),
              height: Number(process.env.YANDEX_DELIVERY_ITEM_HEIGHT_M ?? "0.1"),
            },
            weight: Number(process.env.YANDEX_DELIVERY_ITEM_WEIGHT_KG ?? "0.5"),
          },
        ],
      }),
    },
  );

  if (typeof data.price_raw === "number") return Math.round(data.price_raw);
  if (data.price) {
    const n = Number(String(data.price).replace(",", "."));
    if (!Number.isNaN(n)) return Math.round(n);
  }
  return null;
}

export type CreateYandexClaimInput = {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  toAddress: string;
  comment?: string | null;
};

export async function createYandexDeliveryClaim(
  input: CreateYandexClaimInput,
): Promise<{ claimId: string } | null> {
  if (!isYandexDeliveryConfigured()) return null;

  const requestId = `nega-${input.orderNumber}-${Date.now()}`;

  const data = await yandexDeliveryFetch<{ id?: string }>(
    `/b2b/cargo/integration/v2/claims/create?request_id=${encodeURIComponent(requestId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            cost_currency: "RUB",
            cost_value: "1",
            droppof_point: 2,
            pickup_point: 1,
            quantity: 1,
            title: `Заказ ${input.orderNumber}`,
            weight: Number(process.env.YANDEX_DELIVERY_ITEM_WEIGHT_KG ?? "0.5"),
            size: {
              length: Number(process.env.YANDEX_DELIVERY_ITEM_LENGTH_M ?? "0.3"),
              width: Number(process.env.YANDEX_DELIVERY_ITEM_WIDTH_M ?? "0.2"),
              height: Number(process.env.YANDEX_DELIVERY_ITEM_HEIGHT_M ?? "0.1"),
            },
          },
        ],
        route_points: [
          {
            point_id: 1,
            visit_order: 1,
            type: "source",
            address: {
              fullname: fromAddress(),
              ...(process.env.YANDEX_DELIVERY_FROM_LON &&
              process.env.YANDEX_DELIVERY_FROM_LAT
                ? {
                    coordinates: [
                      Number(process.env.YANDEX_DELIVERY_FROM_LON),
                      Number(process.env.YANDEX_DELIVERY_FROM_LAT),
                    ],
                  }
                : {}),
            },
            contact: {
              name: process.env.YANDEX_DELIVERY_CONTACT_NAME?.trim() || "Nega",
              phone:
                process.env.YANDEX_DELIVERY_CONTACT_PHONE?.trim() ||
                "+79990000000",
            },
          },
          {
            point_id: 2,
            visit_order: 2,
            type: "destination",
            address: {
              fullname: input.toAddress,
            },
            contact: {
              name: input.recipientName,
              phone: input.recipientPhone,
            },
          },
        ],
        comment: input.comment || `Заказ ${input.orderNumber}`,
        emergency_contact: {
          name: process.env.YANDEX_DELIVERY_CONTACT_NAME?.trim() || "Nega",
          phone:
            process.env.YANDEX_DELIVERY_CONTACT_PHONE?.trim() || "+79990000000",
        },
        client_requirements: {},
      }),
    },
  );

  if (!data.id) throw new Error("Yandex Delivery claim create failed");
  return { claimId: data.id };
}

/** Подтверждение заявки после оценки */
export async function acceptYandexDeliveryClaim(claimId: string): Promise<void> {
  await yandexDeliveryFetch(
    `/b2b/cargo/integration/v2/claims/accept?claim_id=${encodeURIComponent(claimId)}`,
    {
      method: "POST",
      body: JSON.stringify({ version: 1 }),
    },
  );
}
