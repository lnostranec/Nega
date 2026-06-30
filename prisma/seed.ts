import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getDemoProducts } from "../src/lib/demo-products";
import { NEGRA_PHOTOS } from "../src/lib/photos";
import { normalizeEmail } from "../src/lib/auth-types";

const prisma = new PrismaClient();

const COLLECTION_META: Record<
  string,
  { description: string; sortOrder: number; imageUrl?: string }
> = {
  novinki: {
    description: "Свежие поступления сезона",
    sortOrder: 1,
    imageUrl: NEGRA_PHOTOS.card[1],
  },
  sets: {
    description: "Готовые образы в одном комплекте",
    sortOrder: 2,
    imageUrl: NEGRA_PHOTOS.category.sets,
  },
  bras: {
    description: "Комфорт и поддержка на каждый день",
    sortOrder: 3,
    imageUrl: NEGRA_PHOTOS.category.bras,
  },
  panties: {
    description: "Классика и новые силуэты",
    sortOrder: 4,
    imageUrl: NEGRA_PHOTOS.category.panties,
  },
  belts: {
    description: "Пояса для чулок и акцентов образа",
    sortOrder: 5,
    imageUrl: NEGRA_PHOTOS.category.accessories,
  },
  bodysuits: {
    description: "Боди для особых случаев",
    sortOrder: 6,
    imageUrl: NEGRA_PHOTOS.card[15],
  },
  stockings: {
    description: "Чулки и колготки",
    sortOrder: 7,
    imageUrl: NEGRA_PHOTOS.category.accessories,
  },
  corsets: {
    description: "Корсеты и пояса",
    sortOrder: 8,
    imageUrl: NEGRA_PHOTOS.card[2],
  },
  homewear: {
    description: "Домашняя одежда",
    sortOrder: 9,
    imageUrl: NEGRA_PHOTOS.category.sets,
  },
  accessories: {
    description: "Аксессуары",
    sortOrder: 10,
    imageUrl: NEGRA_PHOTOS.category.accessories,
  },
};

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "Nega",
      pointsPercent: 5,
      minOrderForPoints: 0,
    },
  });

  const demoProducts = getDemoProducts();
  const collectionSlugs = new Set(
    demoProducts.map((p) => p.collection.slug),
  );
  collectionSlugs.add("novinki");

  for (const slug of collectionSlugs) {
    const demoProduct = demoProducts.find((p) => p.collection.slug === slug);
    const meta = COLLECTION_META[slug];

    await prisma.collection.upsert({
      where: { slug },
      update: {
        name: demoProduct?.collection.name ?? slug,
        description: meta?.description,
        sortOrder: meta?.sortOrder ?? 99,
      },
      create: {
        name: demoProduct?.collection.name ?? slug,
        slug,
        description: meta?.description ?? null,
        sortOrder: meta?.sortOrder ?? 99,
        imageUrl: meta?.imageUrl ?? NEGRA_PHOTOS.card[1],
      },
    });
  }

  for (const demo of demoProducts) {
    const collection = await prisma.collection.findUnique({
      where: { slug: demo.collection.slug },
    });

    const product = await prisma.product.upsert({
      where: { slug: demo.slug },
      update: {
        name: demo.name,
        description: demo.description,
        composition: demo.composition,
        care: demo.care,
        price: demo.price,
        comparePrice: demo.comparePrice,
        sku: demo.sku,
        style: demo.style,
        country: demo.country,
        pattern: demo.pattern,
        material: demo.material,
      },
      create: {
        name: demo.name,
        slug: demo.slug,
        description: demo.description,
        composition: demo.composition,
        care: demo.care,
        price: demo.price,
        comparePrice: demo.comparePrice,
        sku: demo.sku,
        style: demo.style,
        country: demo.country,
        pattern: demo.pattern,
        material: demo.material,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: demo.images.map((image, index) => ({
        productId: product.id,
        url: image.url,
        alt: image.alt,
        sortOrder: index,
      })),
    });

    if (collection) {
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: product.id,
            collectionId: collection.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          collectionId: collection.id,
        },
      });
    }

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.createMany({
      data: demo.variants.map((variant) => ({
        productId: product.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        sku: `${demo.sku}-${variant.size}-${variant.color?.slice(0, 3).toUpperCase() ?? "NA"}`,
      })),
    });
  }

  console.log(
    `Seed completed: ${collectionSlugs.size} collections, ${demoProducts.length} products.`,
  );

  await prisma.promoCode.upsert({
    where: { code: "WELCOME1000" },
    update: {},
    create: {
      code: "WELCOME1000",
      type: "FIXED",
      value: 1000,
      minOrderAmount: 3000,
      isActive: true,
    },
  });
  console.log("Demo promo: WELCOME1000 (−1000 ₽ при заказе от 3000 ₽)");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: normalizeEmail(adminEmail) },
      update: { role: "ADMIN", passwordHash },
      create: {
        email: normalizeEmail(adminEmail),
        passwordHash,
        role: "ADMIN",
        firstName: "Admin",
      },
    });
    console.log(`Admin user: ${normalizeEmail(adminEmail)}`);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — admin user skipped.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
