import { PrismaClient } from "@prisma/client";
import { DEFAULT_BOTTOM_MODELS } from "../src/lib/product-sets";

const prisma = new PrismaClient();

const TOP_SIZES = ["70B", "70C", "75B", "75C", "80B", "80C", "85B"];
const BOTTOM_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL"].slice(
  0,
  9,
);

async function main() {
  const product = await prisma.product.findFirst({
    where: { sku: "NEGA-AURORA-001" },
    include: {
      collections: { include: { collection: true } },
      variants: true,
    },
  });

  if (!product) {
    console.error("Product NEGA-AURORA-001 not found");
    process.exit(1);
  }

  const setsCollection = await prisma.collection.findUnique({
    where: { slug: "sets" },
  });

  if (setsCollection) {
    await prisma.productCollection.upsert({
      where: {
        productId_collectionId: {
          productId: product.id,
          collectionId: setsCollection.id,
        },
      },
      create: { productId: product.id, collectionId: setsCollection.id },
      update: {},
    });
  }

  const colors = [
    ...new Set(
      product.variants
        .map((v) => v.color?.trim() || "Белый")
        .filter(Boolean),
    ),
  ];
  if (colors.length === 0) colors.push("Белый", "Пудра");

  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.productBottomModel.deleteMany({
    where: { productId: product.id },
  });

  const variants = [
    ...colors.flatMap((color) =>
      TOP_SIZES.map((size) => ({
        productId: product.id,
        size,
        color,
        stock: 5,
        part: "TOP" as const,
      })),
    ),
    ...colors.flatMap((color) =>
      BOTTOM_SIZES.map((size) => ({
        productId: product.id,
        size,
        color,
        stock: 5,
        part: "BOTTOM" as const,
      })),
    ),
  ];

  await prisma.productVariant.createMany({ data: variants });

  await prisma.productBottomModel.createMany({
    data: DEFAULT_BOTTOM_MODELS.map((name, sortOrder) => ({
      productId: product.id,
      name,
      sortOrder,
      isActive: true,
    })),
  });

  console.log(
    `Updated ${product.name}: ${TOP_SIZES.length} top sizes, ${BOTTOM_SIZES.length} bottom sizes, colors=${colors.join(", ")}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
