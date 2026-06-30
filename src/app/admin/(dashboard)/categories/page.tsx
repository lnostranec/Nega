import { AdminCategoriesManager } from "@/components/admin/AdminCategoriesManager";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getPrisma().collection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-medium">Категории</h1>
      <p className="mt-2 text-sm text-stone-500">
        Подкатегории в каталоге: Комплекты, Бюстгальтеры и т.д.
      </p>
      <div className="mt-6">
        <AdminCategoriesManager initial={categories} />
      </div>
    </div>
  );
}
