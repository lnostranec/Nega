import { enqueueEmail } from "./outbox";
import {
  orderCancelledEmail,
  orderCreatedEmail,
  orderDeliveredEmail,
  orderPaidEmail,
  orderProcessingEmail,
  orderShippedEmail,
  type OrderEmailData,
} from "./templates";

export type { OrderEmailData };

export async function sendOrderCreatedEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderCreatedEmail(data);
  await enqueueEmail({ to, subject, html, template: "order_created", orderId });
}

export async function sendOrderPaidEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderPaidEmail(data);
  await enqueueEmail({ to, subject, html, template: "order_paid", orderId });
}

export async function sendOrderProcessingEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderProcessingEmail(data);
  await enqueueEmail({
    to,
    subject,
    html,
    template: "order_processing",
    orderId,
  });
}

export async function sendOrderShippedEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderShippedEmail(data);
  await enqueueEmail({ to, subject, html, template: "order_shipped", orderId });
}

export async function sendOrderDeliveredEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderDeliveredEmail(data);
  await enqueueEmail({
    to,
    subject,
    html,
    template: "order_delivered",
    orderId,
  });
}

export async function sendOrderCancelledEmail(
  to: string,
  orderId: string,
  data: OrderEmailData,
): Promise<void> {
  const { subject, html } = orderCancelledEmail(data);
  await enqueueEmail({ to, subject, html, template: "order_cancelled", orderId });
}

export function orderToEmailData(order: {
  orderNumber: string;
  customerName: string | null;
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
  trackingNumber?: string | null;
  items: {
    id: string;
    name: string;
    size: string | null;
    color: string | null;
    price: { toString(): string };
    quantity: number;
  }[];
}): OrderEmailData {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
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
    trackingNumber: order.trackingNumber ?? null,
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
