import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-medium">Настройки</h1>
      <p className="mt-2 text-sm text-stone-500">
        Магазин, доставка, баллы и скидка клиента
      </p>
      <div className="mt-8">
        <AdminSettingsForm
          initial={{
            shopName: settings?.shopName ?? "Nega",
            pointsPercent: settings?.pointsPercent ?? 5,
            minOrderForPoints: settings?.minOrderForPoints ?? 0,
            cdekPvzBaseCost: settings?.cdekPvzBaseCost ?? 350,
            cdekCourierBaseCost: settings?.cdekCourierBaseCost ?? 500,
            yandexDeliveryCost: settings?.yandexDeliveryCost ?? 450,
            freeDeliveryFrom: settings?.freeDeliveryFrom ?? 10000,
            loyaltyThreshold1: settings?.loyaltyThreshold1 ?? 10000,
            loyaltyPercent1: settings?.loyaltyPercent1 ?? 3,
            loyaltyThreshold2: settings?.loyaltyThreshold2 ?? 30000,
            loyaltyPercent2: settings?.loyaltyPercent2 ?? 5,
            loyaltyThreshold3: settings?.loyaltyThreshold3 ?? 50000,
            loyaltyPercent3: settings?.loyaltyPercent3 ?? 10,
          }}
        />
      </div>
    </div>
  );
}
