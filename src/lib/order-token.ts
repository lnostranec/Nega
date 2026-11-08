import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_LENGTH = 32;

/**
 * Секрет для подписи ссылок на страницу результата заказа.
 * Отдельная переменная необязательна — можно использовать CRON_SECRET.
 */
function secret(): string {
  return (
    process.env.ORDER_TOKEN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function isOrderTokenEnabled(): boolean {
  return secret().length > 0;
}

/** Подпись заказа: HMAC-SHA256 от id, усечённый до 32 символов. */
export function createOrderToken(orderId: string): string | null {
  const key = secret();
  if (!key || !orderId) return null;
  return createHmac("sha256", key)
    .update(orderId)
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

export function verifyOrderToken(
  orderId: string,
  token: string | null | undefined,
): boolean {
  if (!token) return false;

  const expected = createOrderToken(orderId);
  if (!expected || expected.length !== token.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

/** Ссылка возврата после оплаты: /checkout/result?orderId=…&token=… */
export function buildOrderResultUrl(siteUrl: string, orderId: string): string {
  const base = `${siteUrl.replace(/\/$/, "")}/checkout/result?orderId=${encodeURIComponent(orderId)}`;
  const token = createOrderToken(orderId);
  return token ? `${base}&token=${token}` : base;
}
