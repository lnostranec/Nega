const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const products = await p.product.findMany({
    where: { name: { contains: "тест", mode: "insensitive" } },
    select: {
      name: true,
      variants: { select: { id: true, size: true, color: true, stock: true } },
    },
  });
  console.log("PRODUCTS:", JSON.stringify(products, null, 2));

  const pending = await p.order.findMany({
    where: {
      paymentStatus: "PENDING",
      status: "PENDING",
      stockReleased: false,
    },
    include: { items: true },
  });

  for (const order of pending) {
    await p.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
          stockReleased: true,
        },
      });
    });
    console.log("Cancelled", order.orderNumber);
  }

  const after = await p.product.findMany({
    where: { name: { contains: "тест", mode: "insensitive" } },
    select: {
      name: true,
      variants: { select: { size: true, color: true, stock: true } },
    },
  });
  console.log("AFTER:", JSON.stringify(after, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
