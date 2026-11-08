import { AdminReviewsPanel } from "@/components/admin/AdminReviewsPanel";
import { listAdminReviews } from "@/lib/admin-reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await listAdminReviews();

  return (
    <div>
      <h1 className="text-2xl font-medium">Отзывы</h1>
      <p className="mt-2 text-sm text-stone-500">
        Новые отзывы попадают на сайт только после публикации здесь. Скрытые
        отзывы остаются в базе, но покупатели их не видят.
      </p>
      <div className="mt-6">
        <AdminReviewsPanel initial={reviews} />
      </div>
    </div>
  );
}
