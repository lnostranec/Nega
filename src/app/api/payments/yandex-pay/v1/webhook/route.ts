import { handleYandexPayWebhook } from "@/lib/yandex-pay-webhook";

/** Яндекс вызывает Callback URL + /v1/webhook */
export async function POST(request: Request) {
  return handleYandexPayWebhook(request);
}
