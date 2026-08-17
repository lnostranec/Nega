import { getYandexPayOrder, isYandexPayConfigured } from "@/lib/yandex-pay";
import {
  handleExternalPaymentCanceled,
  handleExternalPaymentSucceeded,
} from "@/lib/payments";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { captureException } from "@/lib/monitoring";

/**
 * Callback / webhook Яндекс Пэй.
 * В кабинете укажите: https://your-domain/api/payments/yandex-pay
 *
 * Тело может отличаться по версии API — опираемся на orderId + перепроверку GET /orders/{id}.
 */
type Body = {
  event?: string;
  orderId?: string;
  order?: { orderId?: string; paymentStatus?: string };
  data?: { orderId?: string; paymentStatus?: string; orderStatus?: string };
};

const SUCCESS = new Set([
  "CAPTURED",
  "SUCCESS",
  "PAID",
  "CONFIRMED",
  "COMPLETED",
]);
const FAIL = new Set(["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "VOIDED"]);

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isYandexPayConfigured()) {
    return Response.json({ error: "Yandex Pay not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const orderId =
    body.orderId || body.order?.orderId || body.data?.orderId || undefined;

  if (!orderId) {
    return Response.json({ ok: true });
  }

  try {
    const remote = await getYandexPayOrder(orderId);
    const status = (
      remote.paymentStatus ||
      remote.orderStatus ||
      body.data?.paymentStatus ||
      ""
    ).toUpperCase();

    if (SUCCESS.has(status)) {
      await handleExternalPaymentSucceeded(orderId, orderId);
    } else if (FAIL.has(status)) {
      await handleExternalPaymentCanceled(orderId, orderId);
    }
  } catch (error) {
    console.error("[yandex-pay webhook]", error);
    void captureException(error, { route: "POST /api/payments/yandex-pay" });
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
