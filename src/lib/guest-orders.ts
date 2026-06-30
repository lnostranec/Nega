import { normalizeEmail, normalizePhone } from "@/lib/auth-types";
import { getPhoneDigits } from "@/lib/validation";
import { getPrisma } from "@/lib/prisma";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderItemView,
} from "@/lib/orders";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

export type TrackedOrderView = {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethodLabel: string | null;
  subtotal: number;
  deliveryCost: number;
  promoDiscount: number;
  total: number;
  pointsUsed: number;
  pointsEarned: number;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  cdekPvzName: string | null;
  cdekCityName: string | null;
  createdAt: string;
  items: OrderItemView[];
};

function phoneMatches(stored: string, input: string): boolean {
  const storedDigits = getPhoneDigits(stored);
  const inputDigits = getPhoneDigits(input);
  if (!storedDigits || !inputDigits) return false;
  const normalize = (digits: string) =>
    digits.length === 11 && digits.startsWith("7") ? digits.slice(1) : digits;
  return normalize(storedDigits) === normalize(inputDigits);
}

export async function trackGuestOrder(
  orderNumber: string,
  phone: string,
): Promise<TrackedOrderView | null> {
  const prisma = getPrisma();
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: { equals: orderNumber.trim(), mode: "insensitive" },
    },
    include: { items: true },
  });

  if (!order || !phoneMatches(order.customerPhone, phone)) {
    return null;
  }

  return toTrackedOrderView(order);
}

export async function linkGuestOrdersToUser(
  userId: string,
  email: string,
  phone?: string | null,
): Promise<number> {
  const prisma = getPrisma();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const orConditions: { customerEmail?: { equals: string; mode: "insensitive" }; customerPhone?: string }[] = [
    { customerEmail: { equals: normalizedEmail, mode: "insensitive" } },
  ];

  if (normalizedPhone) {
    orConditions.push({ customerPhone: normalizedPhone });
  }

  const result = await prisma.order.updateMany({
    where: {
      userId: null,
      OR: orConditions,
    },
    data: { userId },
  });

  return result.count;
}

function toTrackedOrderView(order: {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  subtotal: { toString(): string };
  deliveryCost: { toString(): string };
  promoDiscount: { toString(): string };
  total: { toString(): string };
  pointsUsed: number;
  pointsEarned: number;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  cdekPvzName: string | null;
  cdekCityName: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    size: string | null;
    color: string | null;
    price: { toString(): string };
    quantity: number;
  }[];
}): TrackedOrderView {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    paymentMethodLabel: order.paymentMethod
      ? PAYMENT_METHOD_LABELS[order.paymentMethod]
      : null,
    subtotal: Number(order.subtotal),
    deliveryCost: Number(order.deliveryCost),
    promoDiscount: Number(order.promoDiscount),
    total: Number(order.total),
    pointsUsed: order.pointsUsed,
    pointsEarned: order.pointsEarned,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    cdekPvzName: order.cdekPvzName,
    cdekCityName: order.cdekCityName,
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
