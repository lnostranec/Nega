import { getPrisma } from "@/lib/prisma";

export type AdminSetAddonModelInput = {
  name: string;
  price: number;
  isActive?: boolean;
};

export type AdminSetAddonDraftInput = {
  name: string;
  price: number;
  imageUrl?: string | null;
  note?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  models?: AdminSetAddonModelInput[];
};

export type AdminSetAddonModel = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

export type AdminSetAddon = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  models: AdminSetAddonModel[];
};

function toAdminAddon(addon: {
  id: string;
  name: string;
  price: unknown;
  imageUrl: string | null;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  models: { id: string; name: string; price: unknown; isActive: boolean }[];
}): AdminSetAddon {
  return {
    id: addon.id,
    name: addon.name,
    price: Number(addon.price),
    imageUrl: addon.imageUrl,
    note: addon.note,
    isActive: addon.isActive,
    sortOrder: addon.sortOrder,
    models: addon.models.map((model) => ({
      id: model.id,
      name: model.name,
      price: Number(model.price),
      isActive: model.isActive,
    })),
  };
}

/** Допы, которые показываются на всех комплектах (productId = null). */
export async function listAdminSetAddons(): Promise<AdminSetAddon[]> {
  const addons = await getPrisma().productSetAddon.findMany({
    where: { productId: null },
    orderBy: { sortOrder: "asc" },
    include: { models: { orderBy: { sortOrder: "asc" } } },
  });

  return addons.map(toAdminAddon);
}

function parseModels(models: AdminSetAddonModelInput[] | undefined) {
  return (models ?? [])
    .map((model, index) => ({
      name: model.name.trim(),
      price: Math.max(0, Number(model.price) || 0),
      isActive: model.isActive ?? true,
      sortOrder: index,
    }))
    .filter((model) => model.name.length > 0);
}

export async function createAdminSetAddon(
  input: AdminSetAddonDraftInput,
): Promise<AdminSetAddon> {
  const name = input.name.trim();
  if (!name) throw new Error("EMPTY_NAME");

  const addon = await getPrisma().productSetAddon.create({
    data: {
      productId: null,
      name,
      price: Math.max(0, Number(input.price) || 0),
      imageUrl: input.imageUrl?.trim() || null,
      note: input.note?.trim() || null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      models: { create: parseModels(input.models) },
    },
    include: { models: { orderBy: { sortOrder: "asc" } } },
  });

  return toAdminAddon(addon);
}

export async function updateAdminSetAddon(
  id: string,
  input: AdminSetAddonDraftInput,
): Promise<AdminSetAddon> {
  const name = input.name.trim();
  if (!name) throw new Error("EMPTY_NAME");

  const addon = await getPrisma().$transaction(async (tx) => {
    const existing = await tx.productSetAddon.findUnique({ where: { id } });
    if (!existing || existing.productId !== null) {
      throw new Error("NOT_FOUND");
    }

    await tx.productSetAddonModel.deleteMany({ where: { addonId: id } });

    return tx.productSetAddon.update({
      where: { id },
      data: {
        name,
        price: Math.max(0, Number(input.price) || 0),
        imageUrl: input.imageUrl?.trim() || null,
        note: input.note?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        models: { create: parseModels(input.models) },
      },
      include: { models: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return toAdminAddon(addon);
}

export async function deleteAdminSetAddon(id: string): Promise<void> {
  const addon = await getPrisma().productSetAddon.findUnique({ where: { id } });
  if (!addon || addon.productId !== null) throw new Error("NOT_FOUND");

  await getPrisma().productSetAddon.delete({ where: { id } });
}
