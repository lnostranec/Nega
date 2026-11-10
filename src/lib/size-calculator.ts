/**
 * Размерная сетка лифа.
 *
 * Чашка определяется смещением обхвата груди от **номинала пояса**
 * (например, 91 при поясе 75 → смещение 16 → чашка D). Так же построена
 * таблица размеров, поэтому калькулятор и таблица всегда совпадают.
 */

export const BAND_RANGES: Array<{ min: number; max: number; band: number }> = [
  { min: 63, max: 67, band: 65 },
  { min: 68, max: 72, band: 70 },
  { min: 73, max: 77, band: 75 },
  { min: 78, max: 82, band: 80 },
  { min: 83, max: 87, band: 85 },
  { min: 88, max: 92, band: 90 },
  { min: 93, max: 97, band: 95 },
];

/**
 * Смещение обхвата груди от номинала пояса, см.
 * Нижняя граница включается, верхняя — нет: [min, max).
 * Данные заказчицы (10.11.2026): AA 10–12, A 12–14, B 14–16, C 16–18,
 * D 18–20, E 20–22, F 22–24.
 */
export const CUP_RANGES: Array<{ cup: string; min: number; max: number }> = [
  { cup: "AA", min: 10, max: 12 },
  { cup: "A", min: 12, max: 14 },
  { cup: "B", min: 14, max: 16 },
  { cup: "C", min: 16, max: 18 },
  { cup: "D", min: 18, max: 20 },
  { cup: "E", min: 20, max: 22 },
  { cup: "F", min: 22, max: 24 },
  { cup: "G", min: 24, max: 26 },
];

/**
 * Какие чашки шьём для каждого пояса — как в исходной таблице.
 * У 65-го пояса к списку заказчицы добавились только две чашки (E, F).
 * Мерки обхвата груди при этом берём новые (см. CUP_RANGES).
 */
export const CUPS_BY_BAND: Record<number, readonly string[]> = {
  65: ["AA", "A", "B", "C", "D", "E", "F"],
  70: ["AA", "A", "B", "C", "D", "E", "F", "G"],
  75: ["AA", "A", "B", "C", "D", "E", "F", "G"],
  80: ["AA", "A", "B", "C", "D", "E", "F"],
  85: ["AA", "A", "B", "C", "D", "E"],
  90: ["AA", "A", "B", "C", "D"],
  95: ["AA", "A", "B", "C"],
};

export const SAMPLE_BRA_SIZES = ["70B", "75B", "75C", "80B", "85C"] as const;
export const SAMPLE_PANTY_SIZES = ["XS", "S", "M", "L", "XL"] as const;

/**
 * Обхват груди для пары «пояс + чашка» — цифры под размером в таблице.
 * Считается из той же сетки, что и калькулятор, поэтому расхождений нет.
 */
export const BUST_RANGES_BY_BAND: Record<number, Record<string, string>> = {};

for (const { band } of BAND_RANGES) {
  const allowed = CUPS_BY_BAND[band] ?? [];
  BUST_RANGES_BY_BAND[band] = {};

  for (const { cup, min, max } of CUP_RANGES) {
    if (allowed.includes(cup)) {
      BUST_RANGES_BY_BAND[band][cup] = `${band + min}–${band + max}`;
    }
  }
}

export function getBustRange(band: number, cup: string): string | null {
  return BUST_RANGES_BY_BAND[band]?.[cup] ?? null;
}

export type BraSizeResult = {
  size: string;
  band: number;
  cup: string;
  /** Смещение обхвата груди от номинала пояса, см */
  difference: number;
};

export type PantySizeResult = {
  size: string;
  fromWaist: string;
  fromHips: string;
};

export const PANTY_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const WAIST_RANGES: Array<{ min: number; max: number; size: (typeof PANTY_ORDER)[number] }> = [
  { min: 48, max: 54, size: "XXS" },
  { min: 55, max: 61, size: "XS" },
  { min: 62, max: 68, size: "S" },
  { min: 69, max: 75, size: "M" },
  { min: 76, max: 82, size: "L" },
  { min: 83, max: 89, size: "XL" },
  { min: 90, max: 96, size: "XXL" },
  { min: 97, max: 103, size: "XXXL" },
];

export const HIP_RANGES: Array<{ min: number; max: number; size: (typeof PANTY_ORDER)[number] }> = [
  { min: 75, max: 81, size: "XXS" },
  { min: 82, max: 88, size: "XS" },
  { min: 89, max: 95, size: "S" },
  { min: 96, max: 102, size: "M" },
  { min: 103, max: 109, size: "L" },
  { min: 110, max: 116, size: "XL" },
  { min: 117, max: 123, size: "XXL" },
  { min: 124, max: 130, size: "XXXL" },
];

function sizeFromRanges(
  value: number,
  ranges: Array<{ min: number; max: number; size: (typeof PANTY_ORDER)[number] }>,
) {
  return ranges.find((row) => value >= row.min && value <= row.max)?.size ?? null;
}

export function calculateBraSize(
  underbustCm: number,
  bustCm: number,
): BraSizeResult | null {
  if (!Number.isFinite(underbustCm) || !Number.isFinite(bustCm)) return null;

  const band = BAND_RANGES.find(
    (row) => underbustCm >= row.min && underbustCm <= row.max,
  )?.band;
  if (!band) return null;

  // Смещение считаем от номинала пояса, а не от измеренного обхвата:
  // 77 и 75 при обхвате груди 91 дают один и тот же размер 75D.
  const difference = bustCm - band;
  const cup = CUP_RANGES.find(
    (row) => difference >= row.min && difference < row.max,
  )?.cup;
  if (!cup) return null;

  const allowed = CUPS_BY_BAND[band];
  if (!allowed?.includes(cup)) return null;

  return { size: `${band}${cup}`, band, cup, difference };
}

export function calculatePantySize(
  waistCm: number,
  hipsCm: number,
): PantySizeResult | null {
  if (!Number.isFinite(waistCm) || !Number.isFinite(hipsCm)) return null;

  const fromWaist = sizeFromRanges(waistCm, WAIST_RANGES);
  const fromHips = sizeFromRanges(hipsCm, HIP_RANGES);
  if (!fromWaist || !fromHips) return null;

  const waistIndex = PANTY_ORDER.indexOf(fromWaist);
  const hipsIndex = PANTY_ORDER.indexOf(fromHips);
  const size = PANTY_ORDER[Math.max(waistIndex, hipsIndex)] ?? fromHips;

  return { size, fromWaist, fromHips };
}
