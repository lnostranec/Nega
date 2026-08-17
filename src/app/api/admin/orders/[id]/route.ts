import { NextRequest } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin";
import {
  getAdminOrder,
  refundAdminOrder,
  retryAdminCdekShipment,
  updateAdminOrderStatus,
  updateAdminOrderTracking,
} from "@/lib/admin-orders";
import { writeAuditLog } from "@/lib/audit";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  status?: OrderStatus;
  trackingNumber?: string;
  action?: "refund" | "cdek_retry";
};

export async function GET(_request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }
  return Response.json({ order });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  try {
    if (body.action === "refund") {
      const order = await refundAdminOrder(id);
      await writeAuditLog({
        adminId: admin.id,
        action: "order_refund",
        entityType: "Order",
        entityId: id,
      });
      return Response.json({ order });
    }

    if (body.action === "cdek_retry") {
      const order = await retryAdminCdekShipment(id);
      await writeAuditLog({
        adminId: admin.id,
        action: "cdek_retry",
        entityType: "Order",
        entityId: id,
      });
      return Response.json({ order });
    }

    if (typeof body.trackingNumber === "string") {
      const order = await updateAdminOrderTracking(id, body.trackingNumber);
      await writeAuditLog({
        adminId: admin.id,
        action: "order_tracking",
        entityType: "Order",
        entityId: id,
        meta: { trackingNumber: body.trackingNumber },
      });
      return Response.json({ order });
    }

    if (!body.status || !STATUSES.includes(body.status)) {
      return Response.json({ error: "Некорректный статус" }, { status: 400 });
    }

    await updateAdminOrderStatus(id, body.status, admin.id);
    const order = await getAdminOrder(id);
    return Response.json({ order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return Response.json({ error: "Заказ не найден" }, { status: 404 });
      }
      if (error.message === "NOT_PAID") {
        return Response.json(
          { error: "Возврат доступен только для оплаченных заказов" },
          { status: 400 },
        );
      }
        if (
        error.message === "NOT_CDEK_DELIVERY" ||
        error.message === "MISSING_CITY"
      ) {
        return Response.json(
          { error: "Нельзя создать накладную СДЭК для этого заказа" },
          { status: 400 },
        );
      }
      if (error.message === "CDEK_NOT_CONFIGURED") {
        return Response.json(
          { error: "СДЭК API не настроен (нет ключей в env)" },
          { status: 400 },
        );
      }
      console.error("Admin order patch error:", error);
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }
}
