import { trackGuestOrder } from "@/lib/guest-orders";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { validatePhone } from "@/lib/validation";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

type TrackBody = {
  orderNumber?: string;
  phone?: string;
};

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`track:${ip}`, 30, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!orderNumber) {
    return Response.json({ error: "Введите номер заказа" }, { status: 400 });
  }

  const phoneError = validatePhone(phone);
  if (phoneError) {
    return Response.json({ error: phoneError }, { status: 400 });
  }

  const order = await trackGuestOrder(orderNumber, phone);
  if (!order) {
    return Response.json(
      { error: "Заказ не найден. Проверьте номер и телефон" },
      { status: 404 },
    );
  }

  return Response.json({ order });
}
