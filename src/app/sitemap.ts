import type { MetadataRoute } from "next";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/catalog",
  "/about",
  "/delivery",
  "/returns",
  "/faq",
  "/loyalty",
  "/reviews",
  "/measurements",
  "/gift-certificate",
  "/offer",
  "/privacy",
  "/cookies",
  "/payment-security",
  "/contacts",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/catalog" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/catalog" ? 0.9 : 0.5,
  }));

  if (!isDbConfigured()) return entries;

  try {
    const prisma = getPrisma();
    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const collection of collections) {
      entries.push({
        url: `${SITE_URL}/catalog/${collection.slug}`,
        lastModified: collection.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap DB error:", error);
  }

  return entries;
}
