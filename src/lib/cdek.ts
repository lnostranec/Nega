import { getPrisma } from "@/lib/prisma";
import { CDEK_CITIES, CDEK_PVZ, type CdekCity, type CdekPvz } from "./cdek-mock-data";
import {
  calculateTariffLive,
  getPvzByCityLive,
  isCdekConfigured,
  searchCitiesLive,
} from "./cdek-api";
import {
  calculateYandexDeliveryPrice,
  isYandexDeliveryConfigured,
} from "./yandex-delivery";

export type DeliveryType = "cdek_pvz" | "cdek_courier" | "yandex_courier";

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
  yandexBaseCost: number;
  freeDeliveryFrom: number | null;
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  cdek_pvz: "СДЭК — пункт выдачи",
  cdek_courier: "СДЭК — курьер",
  yandex_courier: "Яндекс Доставка",
};

export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const settings = await getPrisma().siteSettings.findUnique({
      where: { id: "default" },
    });
    return {
      pvzBaseCost: settings?.cdekPvzBaseCost ?? 350,
      courierBaseCost: settings?.cdekCourierBaseCost ?? 500,
      yandexBaseCost: settings?.yandexDeliveryCost ?? 450,
      freeDeliveryFrom: settings?.freeDeliveryFrom ?? 10000,
    };
  } catch {
    return {
      pvzBaseCost: 350,
      courierBaseCost: 500,
      yandexBaseCost: 450,
      freeDeliveryFrom: 10000,
    };
  }
}

function searchCitiesMock(query: string): CdekCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return CDEK_CITIES.slice(0, 8);
  return CDEK_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.region.toLowerCase().includes(q),
  ).slice(0, 10);
}

export async function searchCities(query: string): Promise<CdekCity[]> {
  if (isCdekConfigured()) {
    try {
      return await searchCitiesLive(query);
    } catch (error) {
      console.error("CDEK cities error:", error);
      return [];
    }
  }
  return searchCitiesMock(query);
}

export async function getPvzByCity(cityCode: number): Promise<CdekPvz[]> {
  if (isCdekConfigured()) {
    try {
      return await getPvzByCityLive(cityCode);
    } catch (error) {
      console.error("CDEK PVZ error:", error);
      return [];
    }
  }
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
  cityCode?: number,
  address?: string,
): Promise<number> {
  const settings = await getDeliverySettings();
  if (
    settings.freeDeliveryFrom !== null &&
    subtotal >= settings.freeDeliveryFrom
  ) {
    return 0;
  }

  if (type === "yandex_courier") {
    if (isYandexDeliveryConfigured() && address?.trim()) {
      try {
        const cityLabel = cityCode ? await cityNameHint(cityCode) : "";
        const fullAddress = [address.trim(), cityLabel]
          .filter(Boolean)
          .join(", ");
        const live = await calculateYandexDeliveryPrice({
          toAddress: fullAddress,
        });
        if (live !== null) return live;
      } catch (error) {
        console.error("Yandex Delivery tariff error, using base cost:", error);
      }
    }
    return settings.yandexBaseCost;
  }

  if (
    isCdekConfigured() &&
    cityCode &&
    (type === "cdek_pvz" || type === "cdek_courier")
  ) {
    try {
      const live = await calculateTariffLive(type, cityCode);
      if (live !== null) return live;
    } catch (error) {
      console.error("CDEK tariff error, using base cost:", error);
    }
  }

  if (type === "cdek_courier") return settings.courierBaseCost;
  return settings.pvzBaseCost;
}

async function cityNameHint(cityCode: number): Promise<string> {
  const city = getCityByCode(cityCode);
  if (city) return city.name;
  try {
    const cities = await searchCities("");
    return cities.find((c) => c.code === cityCode)?.name ?? "";
  } catch {
    return "";
  }
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
  if (
    selection.type === "cdek_courier" ||
    selection.type === "yandex_courier"
  ) {
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
