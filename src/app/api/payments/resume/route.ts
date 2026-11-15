import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { getYandexPayOrder } from "@/lib/yandex-pay";
import { getYooKassaPayment } from "@/lib/yookassa";

/**
 * Возврат к оплате заказа: если платёж ещё не завершён, получаем у ЮKassa
 * актуальную ссылку на оплату и отправляем туда пользователя.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("order");
  const backToAccount = new URL("/account", siteUrl());
  const backToCatalog = new URL("/catalog", siteUrl());

  if (!orderNumber) {
    return Response.redirect(backToAccount, 303);
  }

  const user = await getSessionUser();
  if (!user) {
    return Response.redirect(backToAccount, 303);
  }

  const order = await getPrisma().order.findFirst({
    where: { orderNumber, userId: user.id },
    select: {
      paymentStatus: true,
      paymentMethod: true,
      externalPaymentId: true,
    },
  });

  if (!order) {
    return Response.redirect(backToCatalog, 303);
  }

  if (order.paymentStatus === "PAID" || !order.externalPaymentId) {
    return Response.redirect(backToAccount, 303);
  }

  try {
    if (order.paymentMethod === "YANDEX_PAY") {
      const payment = await getYandexPayOrder(order.externalPaymentId);
      const paidStatuses = ["SUCCESS", "PAID", "CAPTURED"];

      if (
        payment.paymentStatus &&
        paidStatuses.includes(payment.paymentStatus.toUpperCase())
      ) {
        return Response.redirect(backToAccount, 303);
      }

      if (payment.paymentUrl) {
        return Response.redirect(payment.paymentUrl, 303);
      }

      return Response.redirect(backToAccount, 303);
    }

    const payment = await getYooKassaPayment(order.externalPaymentId);

    if (payment.status === "succeeded") {
      return Response.redirect(backToAccount, 303);
    }

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (confirmationUrl) {
      return Response.redirect(confirmationUrl, 303);
    }
  } catch {
    // Провайдер недоступен — возвращаем в кабинет, там видно статус заказа
  }

  return Response.redirect(backToAccount, 303);
}
