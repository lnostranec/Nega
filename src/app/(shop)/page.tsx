import { HeroSlider } from "@/components/home/HeroSlider";
import { BestsellersCarousel } from "@/components/home/BestsellersCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { getDemoProducts } from "@/lib/demo-products";
import { getProducts } from "@/lib/data";
import { toCatalogItem } from "@/lib/product-display";
import { isDbAvailable } from "@/lib/prisma";
import type { BestsellerProduct } from "@/components/home/BestsellerCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bestsellers: BestsellerProduct[] = [];

  if (await isDbAvailable()) {
    const products = await getProducts({ limit: 8 });
    bestsellers = products.map((product) => {
      const item = toCatalogItem(product);
      return {
        productId: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      };
    });
  } else {
    bestsellers = getDemoProducts(8).map((demo) => ({
      productId: demo.id,
      slug: demo.slug,
      name: demo.name,
      price: demo.price,
      imageUrl: demo.images[0]?.url,
    }));
  }

  return (
    <>
      <HeroSlider />
      <BestsellersCarousel products={bestsellers} />
      <CategoryGrid />
    </>
  );
}
