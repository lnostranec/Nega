import { requireAdminUser } from "@/lib/admin";
import { listAdminOrders } from "@/lib/admin-orders";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const orders = await listAdminOrders();
  return Response.json({ orders });
}
