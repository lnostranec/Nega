/**
 * CDEK API v2 client.
 * Без CDEK_CLIENT_ID / CDEK_CLIENT_SECRET — вызовы не выполняются (fallback на мок).
 */

import type { CdekCity, CdekPvz } from "./cdek-mock-data";

const DEFAULT_BASE = "https://api.cdek.ru/v2";

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

export function isCdekConfigured(): boolean {
  return Boolean(
    process.env.CDEK_CLIENT_ID?.trim() &&
      process.env.CDEK_CLIENT_SECRET?.trim(),
  );
}

function baseUrl(): string {
  const raw = process.env.CDEK_BASE_URL?.trim() || DEFAULT_BASE;
  return raw.replace(/\/$/, "").endsWith("/v2")
    ? raw.replace(/\/$/, "")
    : `${raw.replace(/\/$/, "")}/v2`;
}

function fromCityCode(): number {
  return Number(process.env.CDEK_FROM_CITY_CODE ?? "44") || 44;
}

function defaultPackage() {
  return {
    weight: Number(process.env.CDEK_PACKAGE_WEIGHT_G ?? "500") || 500,
    length: Number(process.env.CDEK_PACKAGE_LENGTH_CM ?? "30") || 30,
    width: Number(process.env.CDEK_PACKAGE_WIDTH_CM ?? "20") || 20,
    height: Number(process.env.CDEK_PACKAGE_HEIGHT_CM ?? "10") || 10,
  };
}

/** 136 склад-склад (ПВЗ), 137 склад-дверь (курьер) */
export function cdekTariffCode(type: "cdek_pvz" | "cdek_courier"): number {
  if (type === "cdek_courier") {
    return Number(process.env.CDEK_TARIFF_COURIER ?? "137") || 137;
  }
  return Number(process.env.CDEK_TARIFF_PVZ ?? "136") || 136;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CDEK_CLIENT_ID!.trim(),
    client_secret: process.env.CDEK_CLIENT_SECRET!.trim(),
  });

  const response = await fetch(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    message?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.message || `CDEK OAuth ${response.status}`,
    );
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

async function cdekFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as T & {
    errors?: { message?: string }[];
    message?: string;
  };

  if (!response.ok) {
    const msg =
      data.errors?.[0]?.message ||
      data.message ||
      `CDEK HTTP ${response.status}`;
    throw new Error(msg);
  }

  return data;
}

type CdekCityApi = {
  code: number;
  city: string;
  region?: string;
};

export async function searchCitiesLive(query: string): Promise<CdekCity[]> {
  const q = query.trim();
  const params = new URLSearchParams({ size: "10" });
  if (q) params.set("city", q);

  const rows = await cdekFetch<CdekCityApi[]>(
    `/location/cities?${params.toString()}`,
  );

  return (Array.isArray(rows) ? rows : []).map((row) => ({
    code: row.code,
    name: row.city,
    region: row.region ?? "",
  }));
}

type CdekPvzApi = {
  code: string;
  name: string;
  location?: {
    city_code?: number;
    address?: string;
    address_full?: string;
  };
  work_time?: string;
};

export async function getPvzByCityLive(cityCode: number): Promise<CdekPvz[]> {
  const params = new URLSearchParams({
    city_code: String(cityCode),
    type: "PVZ",
  });

  const rows = await cdekFetch<CdekPvzApi[]>(
    `/deliverypoints?${params.toString()}`,
  );

  return (Array.isArray(rows) ? rows : []).map((row) => ({
    code: row.code,
    name: row.name,
    address:
      row.location?.address_full ||
      row.location?.address ||
      row.name,
    workTime: row.work_time ?? "",
    cityCode: row.location?.city_code ?? cityCode,
  }));
}

type TariffResponse = {
  delivery_sum?: number;
  total_sum?: number;
  errors?: { message?: string }[];
};

export async function calculateTariffLive(
  type: "cdek_pvz" | "cdek_courier",
  toCityCode: number,
): Promise<number | null> {
  const pkg = defaultPackage();
  const data = await cdekFetch<TariffResponse>("/calculator/tariff", {
    method: "POST",
    body: JSON.stringify({
      type: 1,
      tariff_code: cdekTariffCode(type),
      from_location: { code: fromCityCode() },
      to_location: { code: toCityCode },
      packages: [
        {
          weight: pkg.weight,
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
        },
      ],
    }),
  });

  const sum = data.total_sum ?? data.delivery_sum;
  if (typeof sum !== "number" || Number.isNaN(sum)) return null;
  return Math.round(sum);
}

export type CreateCdekShipmentInput = {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  type: "cdek_pvz" | "cdek_courier";
  cityCode: number;
  pvzCode?: string | null;
  address?: string | null;
  deliveryCost: number;
  items: { name: string; price: number; quantity: number }[];
};

export async function createCdekShipment(
  input: CreateCdekShipmentInput,
): Promise<{ uuid: string; trackingNumber?: string } | null> {
  if (!isCdekConfigured()) return null;
  if (input.type !== "cdek_pvz" && input.type !== "cdek_courier") return null;

  const pkg = defaultPackage();
  const tariffCode = cdekTariffCode(input.type);

  const body: Record<string, unknown> = {
    type: 1,
    number: input.orderNumber,
    tariff_code: tariffCode,
    comment: `Заказ ${input.orderNumber}`,
    recipient: {
      name: input.recipientName,
      phones: [{ number: input.recipientPhone }],
      ...(input.recipientEmail ? { email: input.recipientEmail } : {}),
    },
    from_location: { code: fromCityCode() },
    packages: [
      {
        number: "1",
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        items: input.items.map((item, index) => ({
          name: item.name.slice(0, 255),
          ware_key: `item-${index + 1}`,
          payment: { value: 0 },
          cost: item.price,
          weight: Math.max(1, Math.round(pkg.weight / input.items.length)),
          amount: item.quantity,
        })),
      },
    ],
  };

  if (input.type === "cdek_pvz" && input.pvzCode) {
    body.delivery_point = input.pvzCode;
  } else {
    body.to_location = {
      code: input.cityCode,
      address: input.address ?? "",
    };
  }

  const data = await cdekFetch<{
    entity?: { uuid?: string; cdek_number?: string };
    requests?: { state?: string; errors?: { message?: string }[] }[];
  }>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const uuid = data.entity?.uuid;
  if (!uuid) {
    const err = data.requests?.[0]?.errors?.[0]?.message;
    throw new Error(err || "CDEK order create failed");
  }

  return {
    uuid,
    trackingNumber: data.entity?.cdek_number,
  };
}
