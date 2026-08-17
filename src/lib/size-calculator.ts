/** EU-style bra size from underbust + bust, matching ROOMARÉ calculator. */

const BAND_RANGES: Array<{ min: number; max: number; band: number }> = [
  { min: 63, max: 67, band: 65 },
  { min: 68, max: 72, band: 70 },
  { min: 73, max: 77, band: 75 },
  { min: 78, max: 82, band: 80 },
  { min: 83, max: 87, band: 85 },
  { min: 88, max: 92, band: 90 },
  { min: 93, max: 97, band: 95 },
];

const CUP_RANGES: Array<{ min: number; max: number; cup: string }> = [
  { min: 6, max: 8, cup: "AA" },
  { min: 9, max: 11, cup: "A" },
  { min: 12, max: 14, cup: "B" },
  { min: 15, max: 17, cup: "C" },
  { min: 18, max: 19, cup: "D" },
  { min: 20, max: 21, cup: "E" },
  { min: 22, max: 24, cup: "F" },
  { min: 25, max: 27, cup: "G" },
];

const CUPS_BY_BAND: Record<number, readonly string[]> = {
  65: ["AA", "A", "B", "C", "D", "E", "F", "G"],
  70: ["AA", "A", "B", "C", "D", "E", "F", "G"],
  75: ["AA", "A", "B", "C", "D", "E", "F", "G"],
  80: ["AA", "A", "B", "C", "D", "E", "F"],
  85: ["AA", "A", "B", "C", "D", "E"],
  90: ["AA", "A", "B", "C", "D"],
  95: ["AA", "A", "B", "C"],
};

export const SAMPLE_BRA_SIZES = ["70B", "75B", "75C", "80B", "85C"] as const;
export const SAMPLE_PANTY_SIZES = ["XS", "S", "M", "L", "XL"] as const;

export type BraSizeResult = {
  size: string;
  band: number;
  cup: string;
  difference: number;
};

export type PantySizeResult = {
  size: string;
  fromWaist: string;
  fromHips: string;
};

const PANTY_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const WAIST_RANGES: Array<{ min: number; max: number; size: (typeof PANTY_ORDER)[number] }> = [
  { min: 48, max: 54, size: "XXS" },
  { min: 55, max: 61, size: "XS" },
  { min: 62, max: 68, size: "S" },
  { min: 69, max: 75, size: "M" },
  { min: 76, max: 82, size: "L" },
  { min: 83, max: 89, size: "XL" },
  { min: 90, max: 96, size: "XXL" },
  { min: 97, max: 103, size: "XXXL" },
];

const HIP_RANGES: Array<{ min: number; max: number; size: (typeof PANTY_ORDER)[number] }> = [
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

  const difference = bustCm - underbustCm;
  const cup = CUP_RANGES.find(
    (row) => difference >= row.min && difference <= row.max,
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
