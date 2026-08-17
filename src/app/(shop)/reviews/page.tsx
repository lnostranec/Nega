import { SiteContainer } from "@/components/layout/SiteContainer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ReviewsContent } from "@/components/reviews/ReviewsContent";
import { listActiveReviews } from "@/lib/reviews";
import { isDbAvailable } from "@/lib/prisma";

export const metadata = { title: "Отзывы" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = (await isDbAvailable()) ? await listActiveReviews() : [];

  return (
    <SiteContainer className="py-10">
      <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Отзывы" }]} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-semibold uppercase tracking-widest text-[#260402] md:text-3xl">
          Отзывы
        </h1>
        <ReviewsContent initialReviews={reviews} />
      </div>
    </SiteContainer>
  );
}
