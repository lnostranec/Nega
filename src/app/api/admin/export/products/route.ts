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

  const products = await getPrisma().product.findMany({
    include: { variants: true },
    orderBy: { name: "asc" },
  });

  const header = [
    "name",
    "slug",
    "sku",
    "price",
    "isActive",
    "variantSize",
    "variantColor",
    "variantStock",
    "variantSku",
  ];

  const lines = [header.join(",")];
  for (const product of products) {
    if (product.variants.length === 0) {
      lines.push(
        [
          product.name,
          product.slug,
          product.sku,
          Number(product.price),
          product.isActive ? 1 : 0,
          "",
          "",
          "",
          "",
        ]
          .map(csvEscape)
          .join(","),
      );
      continue;
    }
    for (const variant of product.variants) {
      lines.push(
        [
          product.name,
          product.slug,
          product.sku,
          Number(product.price),
          product.isActive ? 1 : 0,
          variant.size,
          variant.color,
          variant.stock,
          variant.sku,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }

  await writeAuditLog({
    adminId: admin.id,
    action: "export_products",
    entityType: "Product",
    meta: { count: products.length },
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products.csv"',
    },
  });
}
