export const GIFT_CERTIFICATE_SKU = "NEGA-GIFT";

export const GIFT_CERTIFICATE_DESIGNS = [
  { id: "1", label: "1", previewClass: "bg-gradient-to-br from-[#f5e6e8] to-[#d4a0a8]" },
  { id: "2", label: "2", previewClass: "bg-gradient-to-br from-stone-100 to-stone-300" },
  { id: "3", label: "3", previewClass: "bg-gradient-to-br from-[#260402] to-[#4a1510]" },
  { id: "4", label: "4", previewClass: "bg-gradient-to-br from-[#fff8f0] to-[#e8d5c4]" },
] as const;

export const GIFT_CERTIFICATE_NOMINALS = [
  3000, 5000, 8000, 10000, 15000, 20000, 30000, 50000,
] as const;

export const GIFT_CERTIFICATE_TYPES = [
  { id: "paper", label: "Бумажный" },
  { id: "electronic", label: "Электронный" },
] as const;

export type GiftCertificateDesignId =
  (typeof GIFT_CERTIFICATE_DESIGNS)[number]["id"];

export type GiftCertificateTypeId =
  (typeof GIFT_CERTIFICATE_TYPES)[number]["id"];

export const GIFT_CERTIFICATE_IMAGE = "/placeholders/hero-certificate.svg";

export const GIFT_CERTIFICATE_DESCRIPTION =
  "Подарочный сертификат Nega — универсальный подарок для близких. Получательница сама выберет модель и размер в каталоге. Сертификат действует 12 месяцев с момента покупки.";

export const GIFT_CERTIFICATE_DELIVERY =
  "Электронный сертификат приходит на email в течение 1 часа после оплаты. Бумажный оформляется в фирменном конверте и доставляется курьером или в пункт выдачи СДЭК. Срок доставки — от 1 до 4 рабочих дней.";

export function isGiftCertificateVariant(variantId: string): boolean {
  return variantId.startsWith("gift-");
}

export function parseGiftCertificateNominal(variantId: string): number | null {
  if (!isGiftCertificateVariant(variantId)) return null;
  const parts = variantId.split("-");
  if (parts.length < 4) return null;
  const nominal = Number(parts[parts.length - 2]);
  if (!Number.isFinite(nominal) || nominal <= 0) return null;
  if (!(GIFT_CERTIFICATE_NOMINALS as readonly number[]).includes(nominal)) {
    return null;
  }
  return nominal;
}
