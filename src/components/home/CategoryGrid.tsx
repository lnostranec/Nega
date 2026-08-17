import Image from "next/image";
import Link from "next/link";
import { CATEGORY_GRID } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/SiteContainer";

export function CategoryGrid() {
  return (
    <section className="bg-white py-12 md:py-16 lg:px-0">
      <SiteContainer className="grid grid-cols-2 gap-3 md:gap-4">
        {CATEGORY_GRID.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="site-card group relative aspect-square overflow-hidden"
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 700px"
            />
            <div className="absolute inset-0 bg-black/25 transition duration-300 group-hover:bg-black/35" />
            <span className="absolute bottom-3 left-3 text-sm font-medium uppercase tracking-[0.15em] text-white sm:bottom-4 sm:left-4 sm:text-base md:bottom-6 md:left-6 md:text-xl">
              {item.title}
            </span>
          </Link>
        ))}
      </SiteContainer>
    </section>
  );
}
