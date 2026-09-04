import { getYandexPayOrder, isYandexPayConfigured } from "@/lib/yandex-pay";
import {
  handleExternalPaymentCanceled,
  handleExternalPaymentSucceeded,
} from "@/lib/payments";
import { isDbConfigured } from "@/lib/prisma";
import { captureException } from "@/lib/monitoring";

type Body = {
  event?: string;
  orderId?: string;
  merchantId?: string;
  order?: { orderId?: string; paymentStatus?: string };
  data?: {
    orderId?: string;
    paymentStatus?: string;
    orderStatus?: string;
  };
};

const SUCCESS = new Set([
  "CAPTURED",
  "SUCCESS",
  "PAID",
  "CONFIRMED",
  "COMPLETED",
]);
const FAIL = new Set(["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "VOIDED"]);

export async function handleYandexPayWebhook(request: Request) {
  if (!isDbConfigured()) {
    return Response.json(
      { error: "База данных не настроена" },
      { status: 503 },
    );
  }
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
    void captureException(error, { route: "POST yandex-pay webhook" });
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

/**
 * Если заказ ещё PENDING — спросить статус у Яндекс Пэй и обновить у себя.
 * Вызывать только из API routes, не из клиентских компонентов.
 */
export async function syncYandexPayOrderStatus(order: {
  id: string;
  paymentMethod: string | null;
  paymentStatus: string;
  externalPaymentId: string | null;
}): Promise<void> {
  if (order.paymentStatus !== "PENDING") return;
  if (order.paymentMethod !== "YANDEX_SPLIT") return;
  if (!isYandexPayConfigured()) return;

  const remoteId = order.externalPaymentId || order.id;
  try {
    const remote = await getYandexPayOrder(remoteId);
    const status = (
      remote.paymentStatus ||
      remote.orderStatus ||
      ""
    ).toUpperCase();

    if (SUCCESS.has(status)) {
      await handleExternalPaymentSucceeded(remoteId, order.id);
    } else if (FAIL.has(status)) {
      await handleExternalPaymentCanceled(remoteId, order.id);
    }
  } catch (error) {
    console.error("[yandex-pay sync]", error);
  }
}
