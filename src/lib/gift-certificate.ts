export const GIFT_CERTIFICATE_SKU = "NEGA-GIFT";

/** Заглушка, пока в админке не загружено фото сертификата */
export const GIFT_CERTIFICATE_PLACEHOLDER_IMAGE = "/placeholders/hero-certificate.svg";

export type GiftCertificateDesign = {
  /** Короткий id без дефисов — входит в variantId */
  id: string;
  name: string;
  imageUrl: string | null;
};

export type GiftCertificateType = {
  /** Короткий id без дефисов — входит в variantId */
  id: string;
  label: string;
};

/** Настройки страницы «Подарочный сертификат» (редактируются в админке). */
export type GiftCertificateConfig = {
  mainImageUrl: string | null;
  description: string;
  deliveryText: string;
  designs: GiftCertificateDesign[];
  nominals: number[];
  types: GiftCertificateType[];
};

export const DEFAULT_GIFT_CERTIFICATE_CONFIG: GiftCertificateConfig = {
  mainImageUrl: null,
  description:
    "Подарочный сертификат Nega — универсальный подарок для близких. Получательница сама выберет модель и размер в каталоге. Сертификат действует 12 месяцев с момента покупки.",
  deliveryText:
    "Электронный сертификат приходит на email в течение 1 часа после оплаты. Бумажный оформляется в фирменном конверте и доставляется курьером или в пункт выдачи СДЭК. Срок доставки — от 1 до 4 рабочих дней.",
  designs: [
    { id: "1", name: "1", imageUrl: null },
    { id: "2", name: "2", imageUrl: null },
    { id: "3", name: "3", imageUrl: null },
    { id: "4", name: "4", imageUrl: null },
  ],
  nominals: [3000, 5000, 8000, 10000, 15000, 20000, 30000, 50000],
  types: [
    { id: "paper", label: "Бумажный" },
    { id: "electronic", label: "Электронный" },
  ],
};

/** Фон для дизайна без загруженного фото — по порядковому номеру. */
export const GIFT_CERTIFICATE_FALLBACK_BACKGROUNDS = [
  "bg-gradient-to-br from-[#f5e6e8] to-[#d4a0a8]",
  "bg-gradient-to-br from-stone-100 to-stone-300",
  "bg-gradient-to-br from-[#260402] to-[#4a1510]",
  "bg-gradient-to-br from-[#fff8f0] to-[#e8d5c4]",
] as const;

export function giftCertificateFallbackBackground(index: number): string {
  return GIFT_CERTIFICATE_FALLBACK_BACKGROUNDS[
    index % GIFT_CERTIFICATE_FALLBACK_BACKGROUNDS.length
  ];
}

export function isGiftCertificateVariant(variantId: string): boolean {
  return variantId.startsWith("gift-");
}

export function buildGiftCertificateVariantId(
  designId: string,
  nominal: number,
  typeId: string,
): string {
  return `gift-${designId}-${nominal}-${typeId}`;
}

/** Разбирает variantId вида gift-{design}-{nominal}-{type}. */
export function parseGiftCertificateVariant(
  variantId: string,
): { designId: string; nominal: number; typeId: string } | null {
  if (!isGiftCertificateVariant(variantId)) return null;
  const parts = variantId.split("-");
  if (parts.length !== 4) return null;
  const nominal = Number(parts[2]);
  if (!Number.isInteger(nominal) || nominal <= 0) return null;
  return { designId: parts[1], nominal, typeId: parts[3] };
}

export function parseGiftCertificateNominal(variantId: string): number | null {
  return parseGiftCertificateVariant(variantId)?.nominal ?? null;
}

/** Вариант сертификата доступен к покупке по текущим настройкам. */
export function isGiftCertificateVariantAvailable(
  variantId: string,
  config: GiftCertificateConfig,
): boolean {
  const parsed = parseGiftCertificateVariant(variantId);
  if (!parsed) return false;
  return (
    config.nominals.includes(parsed.nominal) &&
    config.designs.some((design) => design.id === parsed.designId) &&
    config.types.some((type) => type.id === parsed.typeId)
  );
}

/** Выданный код сертификата — для писем, страницы оплаты и админки. */
export type GiftCertificateView = {
  code: string;
  nominal: number;
  expiresAt: string | null;
  typeLabel?: string | null;
  isActive?: boolean;
  isUsed?: boolean;
};
