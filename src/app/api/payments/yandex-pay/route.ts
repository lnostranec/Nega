import { handleYandexPayWebhook } from "@/lib/yandex-pay-webhook";

/**
 * Callback URL в кабинете:
 * https://nega-phi.vercel.app/api/payments/yandex-pay
 * (без /v1/webhook — Яндекс добавит сам)
 */
export async function POST(request: Request) {
  return handleYandexPayWebhook(request);
}
