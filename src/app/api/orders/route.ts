import { startOrderPayment } from "@/lib/payments";
import {
  createOrder,
  getUserOrders,
  orderErrorMessage,
  parsePaymentMethod,
  releaseExpiredOrders,
} from "@/lib/orders";
import { getSessionUser, dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";
import { validateEmail, validateName, validatePhone } from "@/lib/validation";
import { validateDeliverySelection, type DeliveryType } from "@/lib/cdek";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { captureException } from "@/lib/monitoring";

type OrderItemBody = {
  productId?: string;
  variantId?: string;
  name?: string;
  size?: string;
  color?: string;
  price?: number;
  quantity?: number;
  sizeTop?: string;
  sizeBottom?: string;
  bottomModel?: string;
  bottomVariantId?: string;
};

type CreateOrderBody = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: string;
  comment?: string;
  usePoints?: boolean;
  promoCode?: string;
  acceptOffer?: boolean;
  deliveryMethod?: string;
  deliveryCost?: number;
  cdekPvzCode?: string;
  cdekPvzName?: string;
  cdekCityCode?: number;
  cdekCityName?: string;
  deliveryAddress?: string;
  items?: OrderItemBody[];
};

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const orders = await getUserOrders(user.id);
  return Response.json({ orders });
}

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`orders:${ip}`, 30, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const user = await getSessionUser();

  let body: CreateOrderBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const customerName = body.customerName?.trim() ?? "";
  const customerPhone = body.customerPhone?.trim() ?? "";
  const customerEmail = body.customerEmail?.trim() || user?.email || undefined;
  const paymentMethod = parsePaymentMethod(body.paymentMethod ?? "");
  const items = body.items ?? [];

  if (!body.acceptOffer) {
    return Response.json(
      { error: "Необходимо принять условия оферты и политику конфиденциальности" },
      { status: 400 },
    );
  }

  const nameError = validateName(customerName);
  if (nameError) {
    return Response.json({ error: nameError }, { status: 400 });
  }

  const phoneError = validatePhone(customerPhone);
  if (phoneError) {
    return Response.json({ error: phoneError }, { status: 400 });
  }

  if (!user) {
    const emailError = validateEmail(customerEmail ?? "");
    if (emailError) {
      return Response.json({ error: emailError }, { status: 400 });
    }
  }

  if (!paymentMethod) {
    return Response.json({ error: "Выберите способ оплаты" }, { status: 400 });
  }

  if (items.length === 0) {
    return Response.json({ error: "Корзина пуста" }, { status: 400 });
  }

  const deliverySelection = {
    type: body.deliveryMethod as DeliveryType | undefined,
    cityCode: body.cdekCityCode,
    cityName: body.cdekCityName,
    pvzCode: body.cdekPvzCode,
    pvzName: body.cdekPvzName,
    address: body.deliveryAddress,
    cost: body.deliveryCost,
  };

  const deliveryError = validateDeliverySelection(deliverySelection);
  if (deliveryError) {
    return Response.json({ error: deliveryError }, { status: 400 });
  }

  for (const item of items) {
    if (!item.productId || !item.variantId || !item.name) {
      return Response.json({ error: "Некорректный состав заказа" }, { status: 400 });
    }
    if (!item.price || item.price <= 0 || !item.quantity || item.quantity < 1) {
      return Response.json({ error: "Некорректная цена или количество" }, { status: 400 });
    }
  }

  try {
    await releaseExpiredOrders();

    const orderItems = items.map((item) => ({
      productId: item.productId!,
      variantId: item.variantId!,
      name: item.name!,
      size: item.size,
      color: item.color,
      price: item.price!,
      quantity: item.quantity!,
      sizeTop: item.sizeTop,
      sizeBottom: item.sizeBottom,
      bottomModel: item.bottomModel,
      bottomVariantId: item.bottomVariantId,
    }));

    const pendingOrder = await createOrder({
      userId: user?.id,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod: paymentMethod as PaymentMethod,
      comment: body.comment?.trim() || undefined,
      usePoints: Boolean(body.usePoints && user),
      promoCode: body.promoCode?.trim() || undefined,
      deliveryMethod: body.deliveryMethod,
      cdekPvzCode: body.cdekPvzCode,
      cdekPvzName: body.cdekPvzName,
      cdekCityCode: body.cdekCityCode,
      cdekCityName: body.cdekCityName,
      deliveryAddress: body.deliveryAddress?.trim() || undefined,
      items: orderItems,
    });

    const { order, paymentUrl } = await startOrderPayment(pendingOrder, {
      customerEmail,
      customerPhone,
      customerName,
    });

    return Response.json({ order, paymentUrl });
  } catch (error) {
    if (error instanceof Error) {
      const message = orderErrorMessage(error);
      const status =
        error.message === "INSUFFICIENT_POINTS" ||
        error.message.startsWith("OUT_OF_STOCK:") ||
        error.message.startsWith("PROMO_") ||
        error.message === "PRICE_MISMATCH" ||
        error.message === "VARIANT_NOT_FOUND" ||
        error.message === "PRODUCT_INACTIVE" ||
        error.message === "ORDER_EXPIRED" ||
        error.message === "ORDER_ALREADY_PAID"
          ? 400
          : 500;

      if (status === 400) {
        return Response.json({ error: message }, { status: 400 });
      }
    }

    console.error("Create order error:", error);
    void captureException(error, { route: "POST /api/orders" });
    return Response.json(
      { error: "Не удалось создать заказ. Попробуйте ещё раз" },
      { status: 500 },
    );
  }
}
