import { AdminBestsellersManager } from "@/components/admin/AdminBestsellersManager";
import { listAdminBestsellers } from "@/lib/admin-bestsellers";
import { listAdminProductOptions } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminBestsellersPage() {
  const [items, productOptions] = await Promise.all([
    listAdminBestsellers(),
    listAdminProductOptions(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-medium">Бестселлеры на главной</h1>
      <p className="mt-2 text-sm text-stone-500">
        Выберите товары и порядок — этот список показывается в блоке «Наши
        бестселлеры».
      </p>
      <div className="mt-6">
        <AdminBestsellersManager
          initial={items}
          productOptions={productOptions}
        />
      </div>
    </div>
  );
}
