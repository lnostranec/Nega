import { formatPrice } from "@/lib/format";
import {
  DELIVERY_TYPE_LABELS,
  type DeliveryType,
} from "@/lib/cdek";
import type { OrderItemView } from "@/lib/orders";
import type { GiftCertificateView } from "@/lib/gift-certificate";

export type OrderEmailData = {
  orderNumber: string;
  customerName: string | null;
  items: OrderItemView[];
  subtotal: number;
  deliveryCost: number;
  promoDiscount: number;
  /** Скидка по программе лояльности */
  loyaltyDiscount?: number;
  total: number;
  pointsUsed: number;
  pointsEarned: number;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  cdekPvzName: string | null;
  cdekCityName: string | null;
  trackingNumber?: string | null;
  giftCertificates?: GiftCertificateView[];
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
          <td align="left" valign="top" style="padding:8px 0;border-bottom:1px solid #e7e5e4">${item.name}${item.size || item.color ? `<br><span style="color:#78716c;font-size:13px">${[item.color, item.size].filter(Boolean).join(" · ")}</span>` : ""}</td>
          <td align="right" valign="top" style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;white-space:nowrap">${item.quantity} × ${formatPrice(item.price)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>`;
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

/**
 * Итоги заказа. Только таблицы: почтовые клиенты (Gmail, Яндекс, Outlook)
 * не поддерживают display:flex и склеивают подписи с суммами.
 */
function totalsBlock(data: OrderEmailData): string {
  type Row = { label: string; value: string; muted?: boolean };

  const rows: Row[] = [{ label: "Товары", value: formatPrice(data.subtotal) }];

  if (data.promoDiscount > 0) {
    rows.push({
      label: "Промокод",
      value: `−${formatPrice(data.promoDiscount)}`,
      muted: true,
    });
  }
  if (data.loyaltyDiscount && data.loyaltyDiscount > 0) {
    rows.push({
      label: "Скидка клиента",
      value: `−${formatPrice(data.loyaltyDiscount)}`,
      muted: true,
    });
  }
  if (data.pointsUsed > 0) {
    rows.push({
      label: "Баллы",
      value: `−${formatPrice(data.pointsUsed)}`,
      muted: true,
    });
  }
  if (data.deliveryCost > 0) {
    rows.push({ label: "Доставка", value: formatPrice(data.deliveryCost) });
  }

  const color = (muted?: boolean) => (muted ? "#78716c" : "#260402");

  const rowsHtml = rows
    .map(
      (row) => `<tr>
        <td align="left" style="padding:4px 0;font-size:14px;color:${color(row.muted)}">${row.label}</td>
        <td align="right" style="padding:4px 0;font-size:14px;color:${color(row.muted)};white-space:nowrap">${row.value}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-top:16px">
    ${rowsHtml}
    <tr>
      <td align="left" style="padding:12px 0 0;border-top:1px solid #e7e5e4;font-size:16px;font-weight:600;color:#260402">Итого</td>
      <td align="right" style="padding:12px 0 0;border-top:1px solid #e7e5e4;font-size:16px;font-weight:600;color:#260402;white-space:nowrap">${formatPrice(data.total)}</td>
    </tr>
  </table>`;
}

function formatEmailDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function giftCertificatesBlock(certificates?: GiftCertificateView[]): string {
  if (!certificates?.length) return "";
  const rows = certificates
    .map(
      (certificate) =>
        `<div style="margin-top:12px;padding:16px;border:1px dashed #260402;text-align:center">
          <div style="font-size:13px;color:#78716c">Подарочный сертификат на ${formatPrice(certificate.nominal)}${certificate.typeLabel ? ` · ${certificate.typeLabel.toLowerCase()}` : ""}</div>
          <div style="margin-top:6px;font-family:monospace;font-size:22px;letter-spacing:0.08em;font-weight:600">${certificate.code}</div>
          ${certificate.expiresAt ? `<div style="margin-top:6px;font-size:13px;color:#78716c">Действует до ${formatEmailDate(certificate.expiresAt)}</div>` : ""}
        </div>`,
    )
    .join("");

  return `<div style="margin:24px 0">
    <h2 style="font-size:16px;font-weight:600;margin:0">${certificates.length > 1 ? "Ваши подарочные сертификаты" : "Ваш подарочный сертификат"}</h2>
    ${rows}
    <p style="margin-top:12px;font-size:14px">Чтобы воспользоваться сертификатом, введите код в поле «Промокод» при оформлении заказа на <a href="${siteUrl()}" style="color:#260402">сайте</a>. Сертификат применяется к одному заказу.</p>
  </div>`;
}

export function orderPaidEmail(data: OrderEmailData) {
  const subject = `Заказ ${data.orderNumber} оплачен — ${SHOP_NAME}`;
  const html = layout(
    subject,
    `<h1 style="font-size:20px;font-weight:600;margin:16px 0">Спасибо за заказ!</h1>
    <p>Здравствуйте${data.customerName ? `, ${data.customerName}` : ""}!</p>
    <p>Заказ <strong>${data.orderNumber}</strong> успешно оплачен и принят в обработку.</p>
    ${giftCertificatesBlock(data.giftCertificates)}
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
