import Link from "next/link";
import Image from "next/image";

type CollectionCardProps = {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

export function CollectionCard({
  slug,
  name,
  description,
  imageUrl,
}: CollectionCardProps) {
  return (
    <Link href={`/catalog/${slug}`} className="site-card group relative block overflow-hidden">
      <div className="relative aspect-[4/5] bg-stone-200">
        <Image
          src={imageUrl || "/placeholder-product.jpg"}
          alt={name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h3 className="font-serif text-2xl">{name}</h3>
          {description && (
            <p className="mt-1 text-sm text-white/80">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
