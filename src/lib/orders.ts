import {
  calculateDeliveryCost,
  type DeliveryType,
} from "@/lib/cdek";
import { createCdekShipment, isCdekConfigured } from "@/lib/cdek-api";
import {
  acceptYandexDeliveryClaim,
  createYandexDeliveryClaim,
  isYandexDeliveryConfigured,
} from "@/lib/yandex-delivery";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { normalizeEmail, normalizePhone } from "@/lib/auth-types";
import {
  orderToEmailData,
  sendOrderCreatedEmail,
  sendOrderPaidEmail,
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
import { getUserLoyalty, loyaltyDiscountFromItems } from "@/lib/loyalty";
import { isSetAddonCartKey, isSetCartKey, parseSetAddonCartKey, parseSetCartKey } from "@/lib/product-sets";

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
  paymentStatus: PaymentStatus;
  trackingNumber?: string | null;
  subtotal: number;
  deliveryCost: number;
  promoDiscount: number;
  loyaltyDiscount: number;
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
  sizeTop?: string;
  sizeBottom?: string;
  bottomModel?: string;
  bottomVariantId?: string;
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

    if (isSetCartKey(item.variantId)) {
      const parsed = parseSetCartKey(item.variantId);
      if (!parsed) throw new Error("VARIANT_NOT_FOUND");

      const top = await tx.productVariant.findUnique({
        where: { id: parsed.topVariantId },
        include: {
          product: { select: { price: true, isActive: true, name: true } },
        },
      });
      const bottom = await tx.productVariant.findUnique({
        where: { id: parsed.bottomVariantId },
      });

      if (
        !top ||
        !bottom ||
        top.productId !== item.productId ||
        bottom.productId !== item.productId ||
        top.part !== "TOP" ||
        bottom.part !== "BOTTOM"
      ) {
        throw new Error("VARIANT_NOT_FOUND");
      }
      if (!top.product.isActive) throw new Error("PRODUCT_INACTIVE");
      if (Number(top.product.price) !== item.price) {
        throw new Error("PRICE_MISMATCH");
      }
      continue;
    }

    if (isSetAddonCartKey(item.variantId)) {
      const addonId = parseSetAddonCartKey(item.variantId);
      if (!addonId) throw new Error("VARIANT_NOT_FOUND");

      const addon = await tx.productSetAddon.findUnique({
        where: { id: addonId },
        include: {
          product: { select: { isActive: true } },
        },
      });

      if (
        !addon ||
        !addon.isActive ||
        addon.productId !== item.productId
      ) {
        throw new Error("VARIANT_NOT_FOUND");
      }
      if (!addon.product.isActive) throw new Error("PRODUCT_INACTIVE");
      if (Number(addon.price) !== item.price) {
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

    if (isSetAddonCartKey(item.variantId)) continue;

    if (isSetCartKey(item.variantId)) {
      const parsed = parseSetCartKey(item.variantId);
      if (!parsed) throw new Error("VARIANT_NOT_FOUND");
      qtyByVariant.set(
        parsed.topVariantId,
        (qtyByVariant.get(parsed.topVariantId) ?? 0) + item.quantity,
      );
      qtyByVariant.set(
        parsed.bottomVariantId,
        (qtyByVariant.get(parsed.bottomVariantId) ?? 0) + item.quantity,
      );
      continue;
    }

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
  if (error.message.startsWith("YooKassa:")) {
    return `Не удалось перейти к оплате (${error.message.replace(/^YooKassa:\s*/, "")}). Попробуйте ещё раз или выберите другой способ оплаты.`;
  }
  if (error.message.startsWith("YandexPay:")) {
    return `Не удалось перейти к оплате Яндекс Сплит (${error.message.replace(/^YandexPay:\s*/, "")}). Попробуйте ещё раз или оплатите картой.`;
  }
  // Любая другая ошибка оплаты / провайдера
  if (
    error.message.includes("payment") ||
    error.message.includes("Pay") ||
    error.message.includes("API key") ||
    error.message.includes("sandbox")
  ) {
    return `Не удалось перейти к оплате (${error.message}). Попробуйте ещё раз или оплатите картой.`;
  }
  if (error.name === "TimeoutError" || error.message.includes("timeout")) {
    return "Сервер не успел ответить. Попробуйте ещё раз через минуту.";
  }
  return "Не удалось создать заказ. Попробуйте ещё раз";
}

const ORDER_TX_OPTIONS = { maxWait: 15_000, timeout: 60_000 };

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

  let loyaltyDiscount = 0;
  if (input.userId) {
    const loyalty = await getUserLoyalty(input.userId);
    loyaltyDiscount = loyaltyDiscountFromItems(input.items, loyalty.percent);
  }

  const deliveryMethod = (input.deliveryMethod ?? "cdek_pvz") as DeliveryType;
  const deliveryCost = await calculateDeliveryCost(
    deliveryMethod,
    Math.max(0, subtotal - promoDiscount - loyaltyDiscount),
    input.cdekCityCode,
    input.deliveryAddress,
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

    if (input.userId) {
      const loyalty = await getUserLoyalty(input.userId);
      loyaltyDiscount = loyaltyDiscountFromItems(input.items, loyalty.percent);
    }

    if (input.userId && input.usePoints) {
      const dbUser = await tx.user.findUnique({
        where: { id: input.userId },
        select: { points: true },
      });

      if (!dbUser) {
        throw new Error("USER_NOT_FOUND");
      }

      const payableBeforePoints = Math.max(
        0,
        subtotal - promoDiscount - loyaltyDiscount,
      );
      const redemption = calculatePointsRedemption(
        payableBeforePoints,
        dbUser.points,
        true,
      );

      pointsUsed = redemption.pointsUsed;
    } else {
      pointsUsed = 0;
    }

    const payableSubtotal = Math.max(
      0,
      subtotal - promoDiscount - loyaltyDiscount - pointsUsed,
    );
    const total = Math.max(0, payableSubtotal + deliveryCost);
    const pointsEarned =
      payableSubtotal >= minOrderForPoints
        ? Math.floor((payableSubtotal * pointsPercent) / 100)
        : 0;

    let orderNumber = generateOrderNumber();
    while (await tx.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

    const orderItems = input.items.map((item) => {
      const setKey = isSetCartKey(item.variantId)
        ? parseSetCartKey(item.variantId)
        : null;
      const isAddon = isSetAddonCartKey(item.variantId);

      return {
        productId: item.productId,
        variantId: isGiftProduct(item.productId, item.variantId) || isAddon
          ? null
          : setKey
            ? setKey.topVariantId
            : item.variantId,
        sourceVariantId: item.variantId,
        name: item.name,
        size: item.size ?? null,
        sizeTop: item.sizeTop ?? null,
        sizeBottom: item.sizeBottom ?? null,
        bottomModel: item.bottomModel ?? setKey?.bottomModel ?? null,
        color: item.color ?? null,
        price: item.price,
        quantity: item.quantity,
      };
    });

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
        loyaltyDiscount,
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
  }, ORDER_TX_OPTIONS);

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
  }, ORDER_TX_OPTIONS);

  if (result.order.customerEmail) {
    void sendOrderPaidEmail(
      result.order.customerEmail,
      result.order.id,
      orderToEmailData(result.order),
    ).catch((error) => console.error("Order paid email error:", error));
  }

  void tryCreateCdekShipment(result.order.id).catch((error) =>
    console.error("CDEK shipment error:", error),
  );

  void tryCreateYandexClaim(result.order.id).catch((error) =>
    console.error("Yandex Delivery claim error:", error),
  );

  return toOrderView(result.order, result.giftCertificateCodes);
}

export async function setOrderExternalPaymentId(
  orderId: string,
  externalPaymentId: string,
): Promise<void> {
  const prisma = getPrisma();
  await prisma.order.update({
    where: { id: orderId },
    data: { externalPaymentId },
  });
}

export async function markOrderPaymentFailed(orderId: string): Promise<void> {
  await cancelUnpaidOrder(orderId);
}

export async function getOrderPaymentStatus(orderId: string): Promise<{
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentStatus: PaymentStatus;
  total: number;
} | null> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
    },
  });
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
  };
}

/** Создаёт накладную СДЭК. force=true — даже если uuid уже есть (повтор из админки). */
export async function createOrderCdekShipment(
  orderId: string,
  options?: { force?: boolean },
): Promise<{ uuid: string; trackingNumber?: string } | null> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.cdekUuid && !options?.force) return null;
  if (
    order.deliveryMethod !== "cdek_pvz" &&
    order.deliveryMethod !== "cdek_courier"
  ) {
    throw new Error("NOT_CDEK_DELIVERY");
  }
  if (!order.cdekCityCode) throw new Error("MISSING_CITY");

  const shipment = await createCdekShipment({
    orderNumber: options?.force
      ? `${order.orderNumber}-${Date.now().toString(36)}`
      : order.orderNumber,
    recipientName: order.customerName ?? "Покупатель",
    recipientPhone: order.customerPhone,
    recipientEmail: order.customerEmail,
    type: order.deliveryMethod,
    cityCode: order.cdekCityCode,
    pvzCode: order.cdekPvzCode,
    address: order.deliveryAddress,
    deliveryCost: Number(order.deliveryCost),
    items: order.items.map((item) => ({
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  });

  if (!shipment) {
    if (!isCdekConfigured()) {
      if (options?.force) throw new Error("CDEK_NOT_CONFIGURED");
      return null;
    }
    return null;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      cdekUuid: shipment.uuid,
      trackingNumber: shipment.trackingNumber ?? order.trackingNumber,
      ...(order.status === "PAID" || order.status === "PENDING"
        ? { status: "PROCESSING" as const }
        : {}),
    },
  });

  return shipment;
}

async function tryCreateCdekShipment(orderId: string): Promise<void> {
  if (!isCdekConfigured()) return;
  await createOrderCdekShipment(orderId);
}

async function tryCreateYandexClaim(orderId: string): Promise<void> {
  if (!isYandexDeliveryConfigured()) return;

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.yandexClaimId) return;
  if (order.deliveryMethod !== "yandex_courier") return;
  if (!order.deliveryAddress?.trim()) return;

  const toAddress = [order.deliveryAddress.trim(), order.cdekCityName]
    .filter(Boolean)
    .join(", ");

  const claim = await createYandexDeliveryClaim({
    orderNumber: order.orderNumber,
    recipientName: order.customerName ?? "Покупатель",
    recipientPhone: order.customerPhone,
    toAddress,
    comment: order.comment,
  });

  if (!claim) return;

  try {
    await acceptYandexDeliveryClaim(claim.claimId);
  } catch (error) {
    console.warn("Yandex claim accept deferred:", error);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      yandexClaimId: claim.claimId,
      ...(order.status === "PAID" || order.status === "PENDING"
        ? { status: "PROCESSING" as const }
        : {}),
    },
  });
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
    paymentStatus: PaymentStatus;
    trackingNumber?: string | null;
    subtotal: { toString(): string };
    deliveryCost: { toString(): string };
    promoDiscount: { toString(): string };
    loyaltyDiscount?: { toString(): string };
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
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber ?? null,
    subtotal: Number(order.subtotal),
    deliveryCost: Number(order.deliveryCost),
    promoDiscount: Number(order.promoDiscount),
    loyaltyDiscount: Number(order.loyaltyDiscount ?? 0),
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
