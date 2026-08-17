import {
  getClientIp,
  getYooKassaPayment,
  isYooKassaConfigured,
  isYooKassaIp,
  shouldSkipYooKassaIpCheck,
} from "@/lib/yookassa";
import {
  handleExternalPaymentCanceled,
  handleExternalPaymentSucceeded,
} from "@/lib/payments";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

type YooKassaWebhookBody = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    paid?: boolean;
    metadata?: { order_id?: string; order_number?: string };
  };
};

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  if (!isYooKassaConfigured()) {
    return Response.json({ error: "YooKassa not configured" }, { status: 503 });
  }

  if (!shouldSkipYooKassaIpCheck()) {
    const ip = getClientIp(request);
    if (!isYooKassaIp(ip)) {
      console.warn("[yookassa webhook] rejected IP", ip);
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: YooKassaWebhookBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) {
    return Response.json({ ok: true });
  }

  try {
    // Не доверяем телу уведомления — перечитываем платёж в API
    const payment = await getYooKassaPayment(paymentId);
    const orderId = payment.metadata?.order_id;

    if (body.event === "payment.succeeded" || payment.status === "succeeded") {
      if (payment.paid || payment.status === "succeeded") {
        await handleExternalPaymentSucceeded(payment.id, orderId);
      }
    } else if (
      body.event === "payment.canceled" ||
      payment.status === "canceled"
    ) {
      await handleExternalPaymentCanceled(payment.id, orderId);
    }
  } catch (error) {
    console.error("[yookassa webhook] error:", error);
    // 200 чтобы ЮKassa не ретраила бесконечно при ORDER_NOT_FOUND;
    // при временных сбоях лучше 500 — но ORDER_ALREADY_PAID уже обработан.
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
