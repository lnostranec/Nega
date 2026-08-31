import { writeAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/prisma";
import { toCatalogItem } from "@/lib/product-display";

export type AdminBestsellerItem = {
  id: string;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    images: { url: string }[];
  };
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
} as const;

function serializeBestseller(row: {
  id: string;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    images: { url: string }[];
  };
}): AdminBestsellerItem {
  return {
    id: row.id,
    productId: row.productId,
    sortOrder: row.sortOrder,
    product: {
      id: row.product.id,
      name: row.product.name,
      slug: row.product.slug,
      isActive: row.product.isActive,
      images: row.product.images.map((image) => ({ url: image.url })),
    },
  };
}

export async function listAdminBestsellers(): Promise<AdminBestsellerItem[]> {
  const rows = await getPrisma().homepageBestseller.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      product: { select: productSelect },
    },
  });
  return rows.map(serializeBestseller);
}

export async function addAdminBestseller(
  productId: string,
  adminId?: string | null,
) {
  const product = await getPrisma().product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new Error("NOT_FOUND");

  const last = await getPrisma().homepageBestseller.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    const item = await getPrisma().homepageBestseller.create({
      data: {
        productId,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
      include: {
        product: { select: productSelect },
      },
    });

    await writeAuditLog({
      adminId,
      action: "homepage_bestseller.create",
      entityType: "HomepageBestseller",
      entityId: item.id,
    });

    return serializeBestseller(item);
  } catch {
    throw new Error("ALREADY_ADDED");
  }
}

export async function deleteAdminBestseller(
  id: string,
  adminId?: string | null,
) {
  const existing = await getPrisma().homepageBestseller.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("NOT_FOUND");

  await getPrisma().homepageBestseller.delete({ where: { id } });
  await writeAuditLog({
    adminId,
    action: "homepage_bestseller.delete",
    entityType: "HomepageBestseller",
    entityId: id,
  });
}

export async function reorderAdminBestsellers(
  ids: string[],
  adminId?: string | null,
) {
  if (ids.length === 0) throw new Error("EMPTY_ORDER");

  await getPrisma().$transaction(
    ids.map((id, index) =>
      getPrisma().homepageBestseller.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  await writeAuditLog({
    adminId,
    action: "homepage_bestseller.reorder",
    entityType: "HomepageBestseller",
    meta: { ids },
  });

  return listAdminBestsellers();
}

export function toBestsellerCard(product: {
  id: string;
  slug: string;
  name: string;
  price: number | { toString(): string };
  images?: { url: string }[];
}) {
  const item = toCatalogItem(product);
  return {
    productId: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
  };
}
