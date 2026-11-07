const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const pending = await p.order.findMany({
    where: { paymentStatus: "PENDING" },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      stockReleased: true,
      paymentMethod: true,
      createdAt: true,
      items: { select: { name: true, quantity: true, variantId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("PENDING:", JSON.stringify(pending, null, 2));

  const variantIds = [
    ...new Set(pending.flatMap((o) => o.items.map((i) => i.variantId))),
  ];
  if (variantIds.length) {
    const variants = await p.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        size: true,
        stock: true,
        product: { select: { name: true } },
      },
    });
    console.log("VARIANTS:", JSON.stringify(variants, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
