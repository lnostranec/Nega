import { HeroSlider } from "@/components/home/HeroSlider";
import { BestsellersCarousel } from "@/components/home/BestsellersCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { getDemoProducts } from "@/lib/demo-products";
import { getHeroSlides, getHomepageBestsellers } from "@/lib/data";
import { isDbAvailable } from "@/lib/prisma";
import type { BestsellerProduct } from "@/components/home/BestsellerCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bestsellers: BestsellerProduct[] = [];
  const heroSlides = await getHeroSlides();

  if (await isDbAvailable()) {
    bestsellers = await getHomepageBestsellers();
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
      <HeroSlider slides={heroSlides} />
      <BestsellersCarousel products={bestsellers} />
      <CategoryGrid />
    </>
  );
}
