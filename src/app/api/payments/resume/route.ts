import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getYooKassaPayment } from "@/lib/yookassa";

/**
 * Возврат к оплате заказа: если платёж ещё не завершён, получаем у ЮKassa
 * актуальную ссылку на оплату и отправляем туда пользователя.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("order");
  const backToAccount = new URL("/account", request.url);
  const backToCatalog = new URL("/catalog", request.url);

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
    const payment = await getYooKassaPayment(order.externalPaymentId);

    if (payment.status === "succeeded") {
      return Response.redirect(backToAccount, 303);
    }

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (confirmationUrl) {
      return Response.redirect(confirmationUrl, 303);
    }
  } catch {
    // ЮKassa недоступна — возвращаем в кабинет, там видно статус заказа
  }

  return Response.redirect(backToAccount, 303);
}
