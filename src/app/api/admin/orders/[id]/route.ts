import { NextRequest } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin";
import { getAdminOrder, updateAdminOrderStatus } from "@/lib/admin-orders";
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
  const body = (await request.json()) as { status?: OrderStatus };
  if (!body.status || !STATUSES.includes(body.status)) {
    return Response.json({ error: "Некорректный статус" }, { status: 400 });
  }

  try {
    await updateAdminOrderStatus(id, body.status);
    const order = await getAdminOrder(id);
    return Response.json({ order });
  } catch {
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }
}
