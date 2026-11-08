import { getOrderPaymentStatus } from "@/lib/orders";
import { getOrderGiftCertificates } from "@/lib/promo-codes";
import { syncYandexPayOrderStatus } from "@/lib/yandex-pay-webhook";
import { dbUnavailableResponse, getSessionUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";
import { verifyOrderToken } from "@/lib/order-token";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const { orderId } = await params;
  if (!orderId) {
    return Response.json({ error: "Не указан заказ" }, { status: 400 });
  }

  let order = await getOrderPaymentStatus(orderId);
  if (!order) {
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }

  if (
    order.paymentStatus === "PENDING" &&
    (order.paymentMethod === "YANDEX_SPLIT" ||
      order.paymentMethod === "YANDEX_PAY")
  ) {
    await syncYandexPayOrderStatus({
      id: order.id,
      paymentMethod: order.paymentMethod ?? null,
      paymentStatus: order.paymentStatus,
      externalPaymentId: order.externalPaymentId ?? null,
    });
    order = await getOrderPaymentStatus(orderId);
    if (!order) {
      return Response.json({ error: "Заказ не найден" }, { status: 404 });
    }
  }

  // Коды сертификатов — это деньги. Отдаём их только владельцу заказа
  // (по сессии) или тому, кто пришёл по подписанной ссылке после оплаты.
  const token = new URL(request.url).searchParams.get("token");
  const user = await getSessionUser();
  const canViewCodes =
    verifyOrderToken(order.id, token) ||
    Boolean(user && order.userId && order.userId === user.id);

  const giftCertificates =
    order.paymentStatus === "PAID" && canViewCodes
      ? await getOrderGiftCertificates(order.id)
      : [];

  return Response.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: order.statusLabel,
      paymentStatus: order.paymentStatus,
      total: order.total,
      giftCertificates: giftCertificates.map(({ code, nominal, expiresAt }) => ({
        code,
        nominal,
        expiresAt,
      })),
    },
  });
}
