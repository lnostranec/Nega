import { AdminHeroSlidesManager } from "@/components/admin/AdminHeroSlidesManager";
import { listAdminHeroSlides } from "@/lib/admin-hero-slides";

export const dynamic = "force-dynamic";

export default async function AdminHeroSlidesPage() {
  const slides = await listAdminHeroSlides();

  return (
    <div>
      <h1 className="text-2xl font-medium">Слайдер на главной</h1>
      <p className="mt-2 text-sm text-stone-500">
        Можно добавить, скрыть, удалить слайды и поменять их порядок. На сайте
        показываются только активные.
      </p>
      <div className="mt-6">
        <AdminHeroSlidesManager initial={slides} />
      </div>
    </div>
  );
}
