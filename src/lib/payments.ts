import {
  confirmOrderPayment,
  markOrderPaymentFailed,
  setOrderExternalPaymentId,
  type OrderView,
} from "@/lib/orders";
import { getPrisma } from "@/lib/prisma";
import {
  createDolyamiOrder,
  isDolyamiConfigured,
} from "@/lib/dolyami";
import {
  createYandexPayOrder,
  isYandexPayConfigured,
} from "@/lib/yandex-pay";
import {
  createYooKassaPayment,
  isYooKassaConfigured,
} from "@/lib/yookassa";
import type { PaymentMethod } from "@prisma/client";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export type StartPaymentResult = {
  order: OrderView;
  /** Если есть — редирект на оплату; иначе заказ уже подтверждён (dev без ключей) */
  paymentUrl: string | null;
};

type PaymentContext = {
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
};

async function loadOrderItems(orderId: string) {
  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  return order;
}

function providerReady(method: PaymentMethod | null): boolean {
  if (method === "DOLYAMI") return isDolyamiConfigured();
  if (method === "YANDEX_SPLIT") return isYandexPayConfigured();
  return isYooKassaConfigured();
}

/**
 * Запускает оплату по выбранному способу.
 * Без ключей провайдера — auto-confirm (локальная разработка).
 */
export async function startOrderPayment(
  order: OrderView,
  context: PaymentContext = {},
): Promise<StartPaymentResult> {
  if (order.total <= 0) {
    const paid = await confirmOrderPayment(order.id);
    return { order: paid, paymentUrl: null };
  }

  const method = order.paymentMethod;
  if (!providerReady(method)) {
    console.warn(
      `[payments] provider for ${method ?? "CARD"} not configured — auto-confirming`,
      order.orderNumber,
    );
    const paid = await confirmOrderPayment(order.id);
    return { order: paid, paymentUrl: null };
  }

  const dbOrder = await loadOrderItems(order.id);
  const email = context.customerEmail ?? dbOrder.customerEmail;
  const phone = context.customerPhone ?? dbOrder.customerPhone;
  const name = context.customerName ?? dbOrder.customerName;
  const returnUrl = `${siteUrl()}/checkout/result?orderId=${order.id}`;
  const failUrl = `${siteUrl()}/checkout?payment=failed`;

  const items = dbOrder.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
  }));

  if (method === "DOLYAMI") {
    const { paymentId, confirmationUrl } = await createDolyamiOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountRub: order.total,
      customerName: name ?? undefined,
      customerPhone: phone,
      customerEmail: email ?? undefined,
      successUrl: returnUrl,
      failUrl,
      notificationUrl: `${siteUrl()}/api/payments/dolyami`,
      items,
    });
    await setOrderExternalPaymentId(order.id, paymentId);
    return { order, paymentUrl: confirmationUrl };
  }

  if (method === "YANDEX_SPLIT") {
    const { paymentId, confirmationUrl } = await createYandexPayOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountRub: order.total,
      deliveryCost: Number(dbOrder.deliveryCost ?? 0),
      customerEmail: email ?? undefined,
      customerPhone: phone,
      successUrl: returnUrl,
      errorUrl: failUrl,
      methods: ["SPLIT"],
      items,
    });
    await setOrderExternalPaymentId(order.id, paymentId);
    return { order, paymentUrl: confirmationUrl };
  }

  // CARD → ЮKassa
  const { paymentId, confirmationUrl } = await createYooKassaPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountRub: order.total,
    returnUrl,
    description: `Заказ ${order.orderNumber}`,
    customerEmail: email ?? undefined,
  });
  await setOrderExternalPaymentId(order.id, paymentId);
  return { order, paymentUrl: confirmationUrl };
}

export async function handleExternalPaymentSucceeded(
  paymentId: string,
  orderIdFromMeta?: string,
): Promise<void> {
  const prisma = getPrisma();

  const order = await prisma.order.findFirst({
    where: orderIdFromMeta
      ? {
          OR: [{ id: orderIdFromMeta }, { externalPaymentId: paymentId }],
        }
      : { externalPaymentId: paymentId },
    select: { id: true, paymentStatus: true },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (order.paymentStatus === "PAID") return;

  await setOrderExternalPaymentId(order.id, paymentId);
  await confirmOrderPayment(order.id);
}

export async function handleExternalPaymentCanceled(
  paymentId: string,
  orderIdFromMeta?: string,
): Promise<void> {
  const prisma = getPrisma();

  const order = await prisma.order.findFirst({
    where: orderIdFromMeta
      ? {
          OR: [{ id: orderIdFromMeta }, { externalPaymentId: paymentId }],
        }
      : { externalPaymentId: paymentId },
    select: { id: true, paymentStatus: true },
  });

  if (!order || order.paymentStatus !== "PENDING") return;

  await markOrderPaymentFailed(order.id);
}

/** @deprecated alias */
export const handleYooKassaPaymentSucceeded = handleExternalPaymentSucceeded;
/** @deprecated alias */
export const handleYooKassaPaymentCanceled = handleExternalPaymentCanceled;
