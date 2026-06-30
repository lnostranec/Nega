import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { listAdminPromoCodes } from "@/lib/admin-promo-codes";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const promos = await listAdminPromoCodes();

  return (
    <div>
      <h1 className="text-2xl font-medium">Промокоды и сертификаты</h1>
      <p className="mt-2 text-sm text-stone-500">
        Промокоды создаются вручную. Коды подарочных сертификатов генерируются
        автоматически после покупки.
      </p>
      <div className="mt-6">
        <AdminPromoCodesPanel initialPromos={promos} />
      </div>
    </div>
  );
}
