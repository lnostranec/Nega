import type { OrderStatus, Prisma } from "@prisma/client";
import { createOrderCdekShipment, ORDER_STATUS_LABELS } from "@/lib/orders";
import {
  orderToEmailData,
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
} from "@/lib/email/orders";
import { writeAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/prisma";
import { restoreOrderStock } from "@/lib/stock";
import {
  createYooKassaRefund,
  isYooKassaConfigured,
} from "@/lib/yookassa";

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

async function reverseOrderPoints(
  tx: Prisma.TransactionClient,
  order: OrderWithItems,
): Promise<void> {
  if (!order.userId || order.paymentStatus !== "PAID") return;

  if (order.pointsUsed > 0) {
    await tx.user.update({
      where: { id: order.userId },
      data: { points: { increment: order.pointsUsed } },
    });
    await tx.pointTransaction.create({
      data: {
        userId: order.userId,
        amount: order.pointsUsed,
        type: "ADJUSTMENT",
        orderId: order.id,
        note: `Возврат баллов за отмену ${order.orderNumber}`,
      },
    });
  }

  if (order.pointsEarned > 0) {
    const user = await tx.user.findUnique({
      where: { id: order.userId },
      select: { points: true },
    });
    const clawback = Math.min(order.pointsEarned, user?.points ?? 0);
    if (clawback > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { points: { decrement: clawback } },
      });
      await tx.pointTransaction.create({
        data: {
          userId: order.userId,
          amount: clawback,
          type: "ADJUSTMENT",
          orderId: order.id,
          note: `Списание начисленных баллов за отмену ${order.orderNumber}`,
        },
      });
    }
  }
}

async function reverseOrderPromo(
  tx: Prisma.TransactionClient,
  order: OrderWithItems,
): Promise<void> {
  if (!order.promoCodeId || order.paymentStatus !== "PAID") return;

  const promo = await tx.promoCode.findUnique({
    where: { id: order.promoCodeId },
    select: { usedCount: true },
  });

  if (promo && promo.usedCount > 0) {
    await tx.promoCode.update({
      where: { id: order.promoCodeId },
      data: { usedCount: { decrement: 1 } },
    });
  }
}

async function deactivateGiftCertificates(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  await tx.promoCode.updateMany({
    where: { sourceOrderId: orderId, isGiftCert: true },
    data: { isActive: false },
  });
}

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  customerName: string | null;
  customerPhone: string;
  total: number;
  itemsCount: number;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  customerEmail: string | null;
  subtotal: number;
  deliveryCost: number;
  promoDiscount: number;
  pointsUsed: number;
  pointsEarned: number;
  paymentMethod: string | null;
  paymentStatus: string;
  externalPaymentId: string | null;
  deliveryMethod: string | null;
  cdekPvzCode: string | null;
  cdekPvzName: string | null;
  cdekCityCode: number | null;
  cdekCityName: string | null;
  deliveryAddress: string | null;
  cdekUuid: string | null;
  yandexClaimId: string | null;
  trackingNumber: string | null;
  promoCode: string | null;
  comment: string | null;
  items: {
    id: string;
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    quantity: number;
  }[];
};

export async function listAdminOrders(): Promise<AdminOrderListItem[]> {
  const orders = await getPrisma().order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: Number(order.total),
    itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: {
      items: true,
      promoCode: { select: { code: true } },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    subtotal: Number(order.subtotal),
    deliveryCost: Number(order.deliveryCost),
    promoDiscount: Number(order.promoDiscount),
    total: Number(order.total),
    pointsUsed: order.pointsUsed,
    pointsEarned: order.pointsEarned,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    externalPaymentId: order.externalPaymentId,
    deliveryMethod: order.deliveryMethod,
    cdekPvzCode: order.cdekPvzCode,
    cdekPvzName: order.cdekPvzName,
    cdekCityCode: order.cdekCityCode,
    cdekCityName: order.cdekCityName,
    deliveryAddress: order.deliveryAddress,
    cdekUuid: order.cdekUuid,
    yandexClaimId: order.yandexClaimId,
    trackingNumber: order.trackingNumber,
    promoCode: order.promoCode?.code ?? null,
    comment: order.comment,
    itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      color: item.color,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus,
  adminId?: string | null,
) {
  const prisma = getPrisma();

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new Error("NOT_FOUND");
    }

    const wasCancelled = order.status === "CANCELLED";
    const willCancel = status === "CANCELLED";

    const updateData: Prisma.OrderUpdateInput = { status };

    if (willCancel && !wasCancelled) {
      if (!order.stockReleased) {
        await restoreOrderStock(tx, order.items);
        updateData.stockReleased = true;
      }

      if (order.paymentStatus === "PAID") {
        await reverseOrderPoints(tx, order);
        await reverseOrderPromo(tx, order);
        await deactivateGiftCertificates(tx, order.id);
        updateData.paymentStatus = "REFUNDED";
      } else if (order.paymentStatus === "PENDING") {
        updateData.paymentStatus = "FAILED";
      }
    }

    return tx.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  });

  await writeAuditLog({
    adminId,
    action: "order_status",
    entityType: "Order",
    entityId: id,
    meta: { status },
  });

  if (updated.customerEmail) {
    const emailData = orderToEmailData(updated);
    if (status === "PROCESSING") {
      void sendOrderProcessingEmail(
        updated.customerEmail,
        updated.id,
        emailData,
      ).catch((error) => console.error("Order processing email error:", error));
    }
    if (status === "SHIPPED") {
      void sendOrderShippedEmail(
        updated.customerEmail,
        updated.id,
        emailData,
      ).catch((error) => console.error("Order shipped email error:", error));
    }
    if (status === "DELIVERED") {
      void sendOrderDeliveredEmail(
        updated.customerEmail,
        updated.id,
        emailData,
      ).catch((error) => console.error("Order delivered email error:", error));
    }
    if (status === "CANCELLED") {
      void sendOrderCancelledEmail(
        updated.customerEmail,
        updated.id,
        emailData,
      ).catch((error) => console.error("Order cancelled email error:", error));
    }
  }

  return updated;
}

export async function updateAdminOrderTracking(
  id: string,
  trackingNumber: string,
): Promise<AdminOrderDetail | null> {
  const prisma = getPrisma();
  const trimmed = trackingNumber.trim();
  await prisma.order.update({
    where: { id },
    data: { trackingNumber: trimmed || null },
  });
  return getAdminOrder(id);
}

export async function retryAdminCdekShipment(
  id: string,
): Promise<AdminOrderDetail | null> {
  await createOrderCdekShipment(id, { force: true });
  return getAdminOrder(id);
}

/**
 * Возврат через ЮKassa (если настроена) + отмена заказа.
 * Без ключей — только отмена со статусом REFUNDED.
 */
export async function refundAdminOrder(
  id: string,
): Promise<AdminOrderDetail | null> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("NOT_FOUND");
  if (order.paymentStatus === "REFUNDED") {
    return getAdminOrder(id);
  }
  if (order.paymentStatus !== "PAID") {
    throw new Error("NOT_PAID");
  }

  if (isYooKassaConfigured() && order.externalPaymentId) {
    await createYooKassaRefund({
      paymentId: order.externalPaymentId,
      amountRub: Number(order.total),
      orderId: order.id,
    });
  }

  await updateAdminOrderStatus(id, "CANCELLED");
  return getAdminOrder(id);
}
