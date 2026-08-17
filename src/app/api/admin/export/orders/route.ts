import { requireAdminUser } from "@/lib/admin";
import { dbUnavailableResponse } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const orders = await getPrisma().order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "orderNumber",
    "createdAt",
    "status",
    "paymentStatus",
    "customerName",
    "customerPhone",
    "customerEmail",
    "total",
    "deliveryMethod",
    "trackingNumber",
    "cdekCityName",
  ];

  const lines = [
    header.join(","),
    ...orders.map((o) =>
      [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.status,
        o.paymentStatus,
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        Number(o.total),
        o.deliveryMethod,
        o.trackingNumber,
        o.cdekCityName,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  await writeAuditLog({
    adminId: admin.id,
    action: "export_orders",
    entityType: "Order",
    meta: { count: orders.length },
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
