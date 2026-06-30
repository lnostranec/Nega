import {
  calculateDeliveryCost,
  type DeliveryType,
} from "@/lib/cdek";
import type { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { normalizeEmail, normalizePhone } from "@/lib/auth-types";
import {
  orderToEmailData,
  sendOrderCancelledEmail,
  sendOrderCreatedEmail,
  sendOrderPaidEmail,
  sendOrderShippedEmail,
} from "@/lib/email/orders";
import { getPrisma } from "@/lib/prisma";
import { restoreOrderStock } from "@/lib/stock";
import {
  isGiftCertificateVariant,
  parseGiftCertificateNominal,
} from "@/lib/gift-certificate";
import { calculatePointsRedemption } from "@/lib/points";
import {
  calculatePromoDiscount,
  createGiftCertificatePromoCodes,
  getDiscountableSubtotal,
  normalizePromoCode,
  validatePromoCode,
  promoErrorMessage,
} from "@/lib/promo-codes";

export const PAYMENT_RESERVATION_MINUTES = 15;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "Собирается",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "Банковская карта",
  DOLYAMI: "Долями",
  YANDEX_SPLIT: "Яндекс Сплит",
};

export type OrderItemView = {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod: PaymentMethod | null;
  paymentMethodLabel: string | null;
  subtotal: number;
  deliveryCost: number;
  promoDiscount: number;
  total: number;
  pointsUsed: number;
  pointsEarned: number;
  itemsCount: number;
  createdAt: string;
  items: OrderItemView[];
  giftCertificateCodes?: string[];
};

export type CreateOrderItemInput = {
  productId: string;
  variantId: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
};

export type CreateOrderInput = {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  deliveryMethod?: string;
  cdekPvzCode?: string;
  cdekPvzName?: string;
  cdekCityCode?: number;
  cdekCityName?: string;
  deliveryAddress?: string;
  comment?: string;
  usePoints?: boolean;
  promoCode?: string;
  items: CreateOrderItemInput[];
};

function generateOrderNumber(): string {
  const suffix = Date.now().toString().slice(-8);
  return `NEGA-${suffix}`;
}

function isGiftProduct(productId: string, variantId: string): boolean {
  return productId === "gift-certificate" || isGiftCertificateVariant(variantId);
}

type TxClient = Prisma.TransactionClient;

async function validateItemPrices(
  tx: TxClient,
  items: CreateOrderItemInput[],
): Promise<void> {
  for (const item of items) {
    if (isGiftProduct(item.productId, item.variantId)) {
      const nominal = parseGiftCertificateNominal(item.variantId);
      if (nominal === null || nominal !== item.price) {
        throw new Error("PRICE_MISMATCH");
      }
      continue;
    }

    const variant = await tx.productVariant.findUnique({
      where: { id: item.variantId },
      include: {
        product: { select: { price: true, isActive: true, name: true } },
      },
    });

    if (!variant || variant.productId !== item.productId) {
      throw new Error("VARIANT_NOT_FOUND");
    }

    if (!variant.product.isActive) {
      throw new Error("PRODUCT_INACTIVE");
    }

    const dbPrice = Number(variant.product.price);
    if (dbPrice !== item.price) {
      throw new Error("PRICE_MISMATCH");
    }
  }
}

async function reserveStock(
  tx: TxClient,
  items: CreateOrderItemInput[],
): Promise<void> {
  const qtyByVariant = new Map<string, number>();

  for (const item of items) {
    if (isGiftProduct(item.productId, item.variantId)) continue;
    qtyByVariant.set(
      item.variantId,
      (qtyByVariant.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, needed] of qtyByVariant) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: variantId,
        stock: { gte: needed },
      },
      data: {
        stock: { decrement: needed },
      },
    });

    if (updated.count === 0) {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { select: { name: true } } },
      });

      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      throw new Error(
        `OUT_OF_STOCK:${variant.product.name}:${variant.size}${variant.color ? ` · ${variant.color}` : ""}`,
      );
    }
  }
}

export function orderErrorMessage(error: Error): string {
  if (error.message === "INSUFFICIENT_POINTS") {
    return "Недостаточно баллов для списания";
  }
  if (error.message === "PRICE_MISMATCH") {
    return "Цены в корзине устарели. Обновите страницу и попробуйте снова";
  }
  if (error.message === "VARIANT_NOT_FOUND") {
    return "Один из товаров больше недоступен";
  }
  if (error.message === "PRODUCT_INACTIVE") {
    return "Один из товаров снят с продажи";
  }
  if (error.message.startsWith("OUT_OF_STOCK:")) {
    const parts = error.message.split(":");
    const label = parts.slice(1).join(":") || "товар";
    return `Недостаточно на складе: ${label}`;
  }
  if (error.message.startsWith("PROMO_")) {
    return promoErrorMessage(error.message);
  }
  if (error.message === "ORDER_EXPIRED") {
    return "Время на оплату истекло. Оформите заказ заново";
  }
  if (error.message === "ORDER_ALREADY_PAID") {
    return "Заказ уже оплачен";
  }
  return "Не удалось создать заказ. Попробуйте ещё раз";
}

export async function releaseExpiredOrders(): Promise<number> {
  const prisma = getPrisma();
  const now = new Date();

  const expired = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      stockReleased: false,
      paymentExpiresAt: { lt: now },
    },
    select: { id: true },
  });

  for (const order of expired) {
    await cancelUnpaidOrder(order.id);
  }

  return expired.length;
}

async function cancelUnpaidOrder(orderId: string): Promise<void> {
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.stockReleased || order.paymentStatus !== "PENDING") {
      return;
    }

    await restoreOrderStock(tx, order.items);

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
        stockReleased: true,
      },
    });
  });
}

export async function createOrder(input: CreateOrderInput) {
  await releaseExpiredOrders();

  const prisma = getPrisma();

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const normalizedPhone = normalizePhone(input.customerPhone) ?? input.customerPhone.trim();
  const normalizedEmail = input.customerEmail
    ? normalizeEmail(input.customerEmail)
    : undefined;

  let promoDiscount = 0;
  let promoCodeId: string | undefined;

  if (input.promoCode?.trim()) {
    const promo = await validatePromoCode(input.promoCode, input.items);
    promoDiscount = promo.discount;
    promoCodeId = promo.promoCodeId;
  }

  const deliveryMethod = (input.deliveryMethod ?? "cdek_pvz") as DeliveryType;
  const deliveryCost = await calculateDeliveryCost(
    deliveryMethod,
    Math.max(0, subtotal - promoDiscount),
  );

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  const pointsPercent = settings?.pointsPercent ?? 5;
  const minOrderForPoints = settings?.minOrderForPoints ?? 0;

  const result = await prisma.$transaction(async (tx) => {
    let pointsUsed = 0;

    await validateItemPrices(tx, input.items);
    await reserveStock(tx, input.items);

    if (promoCodeId) {
      const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
      if (!promo || !promo.isActive) {
        throw new Error("PROMO_INVALID");
      }
      if (promo.expiresAt && promo.expiresAt < new Date()) {
        throw new Error("PROMO_EXPIRED");
      }
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        throw new Error("PROMO_EXHAUSTED");
      }

      const discountableSubtotal = getDiscountableSubtotal(input.items);
      promoDiscount = calculatePromoDiscount(promo, discountableSubtotal);
    }

    if (input.userId && input.usePoints) {
      const dbUser = await tx.user.findUnique({
        where: { id: input.userId },
        select: { points: true },
      });

      if (!dbUser) {
        throw new Error("USER_NOT_FOUND");
      }

      const payableBeforePoints = subtotal - promoDiscount;
      const redemption = calculatePointsRedemption(
        payableBeforePoints,
        dbUser.points,
        true,
      );

      pointsUsed = redemption.pointsUsed;
    } else {
      pointsUsed = 0;
    }

    const payableSubtotal = subtotal - promoDiscount - pointsUsed;
    const total = Math.max(0, payableSubtotal + deliveryCost);
    const pointsEarned =
      payableSubtotal >= minOrderForPoints
        ? Math.floor((payableSubtotal * pointsPercent) / 100)
        : 0;

    let orderNumber = generateOrderNumber();
    while (await tx.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

    const orderItems = input.items.map((item) => ({
      productId: item.productId,
      variantId: isGiftProduct(item.productId, item.variantId)
        ? null
        : item.variantId,
      sourceVariantId: item.variantId,
      name: item.name,
      size: item.size ?? null,
      color: item.color ?? null,
      price: item.price,
      quantity: item.quantity,
    }));

    const paymentExpiresAt = new Date(
      Date.now() + PAYMENT_RESERVATION_MINUTES * 60 * 1000,
    );

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: "PENDING",
        customerName: input.customerName,
        customerPhone: normalizedPhone,
        customerEmail: normalizedEmail,
        subtotal,
        deliveryCost,
        promoCodeId,
        promoDiscount,
        pointsUsed,
        total,
        pointsEarned,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        paymentExpiresAt,
        stockReleased: false,
        deliveryMethod: input.deliveryMethod ?? deliveryMethod,
        cdekPvzCode: input.cdekPvzCode,
        cdekPvzName: input.cdekPvzName,
        cdekCityCode: input.cdekCityCode,
        cdekCityName: input.cdekCityName,
        deliveryAddress: input.deliveryAddress,
        comment: input.comment,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    return { order: created };
  });

  if (normalizedEmail) {
    void sendOrderCreatedEmail(
      normalizedEmail,
      result.order.id,
      orderToEmailData(result.order),
    ).catch((error) => console.error("Order created email error:", error));
  }

  return toOrderView(result.order);
}

export async function confirmOrderPayment(orderId: string): Promise<OrderView> {
  await releaseExpiredOrders();

  const prisma = getPrisma();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.paymentStatus === "PAID") {
      throw new Error("ORDER_ALREADY_PAID");
    }

    if (order.paymentStatus !== "PENDING") {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.paymentExpiresAt && order.paymentExpiresAt < new Date()) {
      throw new Error("ORDER_EXPIRED");
    }

    if (order.promoCodeId) {
      const promo = await tx.promoCode.findUnique({
        where: { id: order.promoCodeId },
      });
      if (!promo || !promo.isActive) {
        throw new Error("PROMO_INVALID");
      }
      if (promo.expiresAt && promo.expiresAt < new Date()) {
        throw new Error("PROMO_EXPIRED");
      }
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        throw new Error("PROMO_EXHAUSTED");
      }

      await tx.promoCode.update({
        where: { id: order.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (order.userId && order.pointsUsed > 0) {
      const dbUser = await tx.user.findUnique({
        where: { id: order.userId },
        select: { points: true },
      });

      if (!dbUser || dbUser.points < order.pointsUsed) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      await tx.user.update({
        where: { id: order.userId },
        data: { points: { decrement: order.pointsUsed } },
      });
      await tx.pointTransaction.create({
        data: {
          userId: order.userId,
          amount: order.pointsUsed,
          type: "SPENT",
          orderId: order.id,
          note: `Списание за заказ ${order.orderNumber}`,
        },
      });
    }

    if (order.userId && order.pointsEarned > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { points: { increment: order.pointsEarned } },
      });
      await tx.pointTransaction.create({
        data: {
          userId: order.userId,
          amount: order.pointsEarned,
          type: "EARNED",
          orderId: order.id,
          note: `Начисление за заказ ${order.orderNumber}`,
        },
      });
    }

    const giftCertificateCodes = await createGiftCertificatePromoCodes(
      order.id,
      order.items.map((item) => ({
        variantId: item.sourceVariantId ?? item.variantId ?? "",
        quantity: item.quantity,
      })),
      tx,
    );

    const paid = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
      },
      include: { items: true },
    });

    return { order: paid, giftCertificateCodes };
  });

  if (result.order.customerEmail) {
    void sendOrderPaidEmail(
      result.order.customerEmail,
      result.order.id,
      orderToEmailData(result.order),
    ).catch((error) => console.error("Order paid email error:", error));
  }

  return toOrderView(result.order, result.giftCertificateCodes);
}

export async function getUserOrders(userId: string): Promise<OrderView[]> {
  const prisma = getPrisma();
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => toOrderView(order));
}

function toOrderView(
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod | null;
    subtotal: { toString(): string };
    deliveryCost: { toString(): string };
    promoDiscount: { toString(): string };
    total: { toString(): string };
    pointsUsed: number;
    pointsEarned: number;
    createdAt: Date;
    items: {
      id: string;
      name: string;
      size: string | null;
      color: string | null;
      price: { toString(): string };
      quantity: number;
    }[];
  },
  giftCertificateCodes?: string[],
): OrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: order.paymentMethod
      ? PAYMENT_METHOD_LABELS[order.paymentMethod]
      : null,
    subtotal: Number(order.subtotal),
    deliveryCost: Number(order.deliveryCost),
    promoDiscount: Number(order.promoDiscount),
    total: Number(order.total),
    pointsUsed: order.pointsUsed,
    pointsEarned: order.pointsEarned,
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
    giftCertificateCodes,
  };
}

export function parsePaymentMethod(value: string): PaymentMethod | null {
  switch (value) {
    case "card":
      return "CARD";
    case "dolyami":
      return "DOLYAMI";
    case "split":
      return "YANDEX_SPLIT";
    default:
      return null;
  }
}

export { normalizePromoCode };
