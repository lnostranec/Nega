/**
 * Адрес сайта без завершающего слэша.
 *
 * Берётся из NEXT_PUBLIC_SITE_URL (Vercel, VPS, локальный .env), поэтому при
 * смене домена достаточно поменять переменную окружения — код не меняется.
 */
const FALLBACK_SITE_URL = "https://negalingerie.ru";

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv ? fromEnv : FALLBACK_SITE_URL).replace(/\/$/, "");
}
