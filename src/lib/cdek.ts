import { getPrisma } from "@/lib/prisma";
import { CDEK_CITIES, CDEK_PVZ, type CdekCity, type CdekPvz } from "./cdek-mock-data";

export type DeliveryType = "cdek_pvz" | "cdek_courier";

export type DeliverySelection = {
  type: DeliveryType;
  cityCode: number;
  cityName: string;
  pvzCode?: string;
  pvzName?: string;
  address?: string;
  cost: number;
};

export type DeliverySettings = {
  pvzBaseCost: number;
  courierBaseCost: number;
  freeDeliveryFrom: number | null;
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  cdek_pvz: "СДЭК — пункт выдачи",
  cdek_courier: "СДЭК — курьер",
};

export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const settings = await getPrisma().siteSettings.findUnique({
      where: { id: "default" },
    });
    return {
      pvzBaseCost: settings?.cdekPvzBaseCost ?? 350,
      courierBaseCost: settings?.cdekCourierBaseCost ?? 500,
      freeDeliveryFrom: settings?.freeDeliveryFrom ?? null,
    };
  } catch {
    return {
      pvzBaseCost: 350,
      courierBaseCost: 500,
      freeDeliveryFrom: null,
    };
  }
}

export function searchCities(query: string): CdekCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return CDEK_CITIES.slice(0, 8);
  return CDEK_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.region.toLowerCase().includes(q),
  ).slice(0, 10);
}

export function getPvzByCity(cityCode: number): CdekPvz[] {
  return CDEK_PVZ.filter((pvz) => pvz.cityCode === cityCode);
}

export function getCityByCode(cityCode: number): CdekCity | undefined {
  return CDEK_CITIES.find((city) => city.code === cityCode);
}

export function getPvzByCode(code: string): CdekPvz | undefined {
  return CDEK_PVZ.find((pvz) => pvz.code === code);
}

export async function calculateDeliveryCost(
  type: DeliveryType,
  subtotal: number,
): Promise<number> {
  const settings = await getDeliverySettings();
  if (settings.freeDeliveryFrom !== null && subtotal >= settings.freeDeliveryFrom) {
    return 0;
  }
  return type === "cdek_courier"
    ? settings.courierBaseCost
    : settings.pvzBaseCost;
}

export function validateDeliverySelection(
  selection: Partial<DeliverySelection>,
): string | null {
  if (!selection.type || !selection.cityCode || !selection.cityName) {
    return "Выберите город доставки";
  }
  if (selection.type === "cdek_pvz") {
    if (!selection.pvzCode || !selection.pvzName) {
      return "Выберите пункт выдачи СДЭК";
    }
  }
  if (selection.type === "cdek_courier") {
    if (!selection.address?.trim()) {
      return "Укажите адрес доставки";
    }
  }
  if (selection.cost === undefined || selection.cost < 0) {
    return "Не удалось рассчитать стоимость доставки";
  }
  return null;
}

export function formatPvzLabel(pvz: CdekPvz): string {
  return `${pvz.name}, ${pvz.address}`;
}
