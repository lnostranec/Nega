import { formatPrice } from "@/lib/format";
import {
  DELIVERY_TYPE_LABELS,
  type DeliveryType,
} from "@/lib/cdek";
import type { OrderItemView } from "@/lib/orders";

export type OrderEmailData = {
  orderNumber: string;
  customerName: string | null;
  items: OrderItemView[];
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
  trackingNumber?: string | null;
};

const SHOP_NAME = process.env.SHOP_NAME ?? "Nega";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;color:#260402;line-height:1.5;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#78716c">${SHOP_NAME}</p>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#78716c">Это автоматическое письмо. Отвечать на него не нужно.</p>
</body>
</html>`;
}

function itemsTable(items: OrderItemView[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e7e5e4">${item.name}${item.size || item.color ? `<br><span style="color:#78716c;font-size:13px">${[item.color, item.size].filter(Boolean).join(" · ")}</span>` : ""}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;white-space:nowrap">${item.quantity} × ${formatPrice(item.price)}</td>
        </tr>`,
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>`;
}

function deliveryBlock(data: OrderEmailData): string {
  if (!data.deliveryMethod) return "";
  const type = data.deliveryMethod as DeliveryType;
  const label = DELIVERY_TYPE_LABELS[type] ?? data.deliveryMethod;
  let details = label;
  if (data.cdekCityName) details += `<br>Город: ${data.cdekCityName}`;
  if (data.cdekPvzName) details += `<br>ПВЗ: ${data.cdekPvzName}`;
  if (data.deliveryAddress) details += `<br>Адрес: ${data.deliveryAddress}`;
  if (data.deliveryCost > 0) {
    details += `<br>Доставка: ${formatPrice(data.deliveryCost)}`;
  } else {
    details += `<br>Доставка: бесплатно`;
  }
  return `<p style="margin:16px 0;padding:12px;background:#fafaf9;font-size:14px">${details}</p>`;
}

function totalsBlock(data: OrderEmailData): string {
  const lines = [
    `<div style="display:flex;justify-content:space-between"><span>Товары</span><span>${formatPrice(data.subtotal)}</span></div>`,
  ];
  if (data.promoDiscount > 0) {
    lines.push(
      `<div style="display:flex;justify-content:space-between;color:#78716c"><span>Промокод</span><span>−${formatPrice(data.promoDiscount)}</span></div>`,
    );
  }
  if (data.pointsUsed > 0) {
    lines.push(
      `<div style="display:flex;justify-content:space-between;color:#78716c"><span>Баллы</span><span>−${formatPrice(data.pointsUsed)}</span></div>`,
    );
  }
  if (data.deliveryCost > 0) {
    lines.push(
      `<div style="display:flex;justify-content:space-between"><span>Доставка</span><span>${formatPrice(data.deliveryCost)}</span></div>`,
    );
  }
  lines.push(
    `<div style="display:flex;justify-content:space-between;font-weight:600;margin-top:8px;font-size:16px"><span>Итого</span><span>${formatPrice(data.total)}</span></div>`,
  );
  return `<div style="margin-top:16px;font-size:14px">${lines.join("")}</div>`;
}

export function orderPaidEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} оплачен — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Спасибо за заказ!</h1>
    <p>Здравствуйте${data.customerName ? `, ${data.customerName}` : ""}!</p>
    <p>Заказ <strong>${data.orderNumber}</strong> успешно оплачен и принят в обработку.</p>
    ${itemsTable(data.items)}
    ${deliveryBlock(data)}
    ${totalsBlock(data)}
    ${data.pointsEarned > 0 ? `<p style="font-size:14px;color:#78716c">+${data.pointsEarned} баллов начислено на ваш счёт.</p>` : ""}
    <p style="margin-top:24px"><a href="${siteUrl()}/account" style="color:#260402">Личный кабинет</a> · <a href="${siteUrl()}/order/track" style="color:#260402">Отследить заказ</a></p>`,
  );
  return { subject, html };
}

export function orderProcessingEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} собирается — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Заказ собирается</h1>
    <p>Заказ <strong>${data.orderNumber}</strong> передан в сборку на складе.</p>
    ${deliveryBlock(data)}
    <p style="margin-top:24px"><a href="${siteUrl()}/order/track" style="color:#260402">Отследить заказ</a></p>`,
  );
  return { subject, html };
}

export function orderCreatedEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} оформлен — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Заказ оформлен</h1>
    <p>Здравствуйте${data.customerName ? `, ${data.customerName}` : ""}!</p>
    <p>Заказ <strong>${data.orderNumber}</strong> создан. Ожидаем оплату в течение 15 минут.</p>
    ${itemsTable(data.items)}
    ${deliveryBlock(data)}
    ${totalsBlock(data)}`,
  );
  return { subject, html };
}

export function orderShippedEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} отправлен — ${SHOP_NAME}`;
  const tracking = data.trackingNumber
    ? `<p>Трек-номер: <strong>${data.trackingNumber}</strong></p>`
    : "";
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Заказ отправлен</h1>
    <p>Заказ <strong>${data.orderNumber}</strong> передан в службу доставки.</p>
    ${tracking}
    ${deliveryBlock(data)}
    <p style="margin-top:24px"><a href="${siteUrl()}/order/track" style="color:#260402">Отследить заказ</a></p>`,
  );
  return { subject, html };
}

export function orderDeliveredEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} доставлен — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Заказ доставлен</h1>
    <p>Заказ <strong>${data.orderNumber}</strong> отмечен как доставленный.</p>
    <p>Спасибо, что выбрали ${SHOP_NAME}! Будем рады вашему отзыву.</p>
    <p style="margin-top:24px"><a href="${siteUrl()}/reviews" style="color:#260402">Оставить отзыв</a> · <a href="${siteUrl()}/catalog" style="color:#260402">В каталог</a></p>`,
  );
  return { subject, html };
}

export function orderCancelledEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} отменён — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Заказ отменён</h1>
    <p>Заказ <strong>${data.orderNumber}</strong> был отменён.</p>
    <p style="font-size:14px;color:#78716c">Если оплата уже прошла, возврат будет оформлен в ближайшее время.</p>`,
  );
  return { subject, html };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
