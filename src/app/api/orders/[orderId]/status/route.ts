import { getOrderPaymentStatus } from "@/lib/orders";
import { syncYandexPayOrderStatus } from "@/lib/yandex-pay-webhook";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Params) {
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
    order.paymentMethod === "YANDEX_SPLIT"
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

  return Response.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: order.statusLabel,
      paymentStatus: order.paymentStatus,
      total: order.total,
    },
  });
}
