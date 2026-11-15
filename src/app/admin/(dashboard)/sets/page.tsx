import { AdminSetAddonsManager } from "@/components/admin/AdminSetAddonsManager";
import { listAdminSetAddons } from "@/lib/admin-set-addons";

export const dynamic = "force-dynamic";

export default async function AdminSetsPage() {
  const items = await listAdminSetAddons();

  return (
    <div>
      <h1 className="text-2xl font-medium">Комплекты</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-500">
        Допы, которые показываются на карточке любого комплекта — «Добавить к
        этому комплекту». У каждого допа можно задать фото, цену и список
        моделей: клиент выбирает модель, и её цена прибавляется к заказу.
      </p>
      <div className="mt-6">
        <AdminSetAddonsManager initial={items} />
      </div>
    </div>
  );
}
