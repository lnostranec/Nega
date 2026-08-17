import { getOrderPaymentStatus } from "@/lib/orders";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const { orderId } = await params;
  if (!orderId) {
    return Response.json({ error: "Не указан заказ" }, { status: 400 });
  }

  const order = await getOrderPaymentStatus(orderId);
  if (!order) {
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return Response.json({ order });
}
